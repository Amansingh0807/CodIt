// Importing necessary packages using ES module syntax
import express from 'express';
import http from 'http';
import path from 'path';
import process from 'process';
import { Server } from 'socket.io';
import ACTIONS from './src/Actions.js'; // Match actual file name (Windows-insensitive, but safer)
import os from 'os';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

// Create the express app
const app = express();
app.use(express.json({ limit: '200kb' }));

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io server
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

// --- Code execution endpoint ---
// Contract: POST /api/run { language: 'javascript'|'typescript'|'c'|'cpp', code: string, stdin?: string }
// Returns: { stdout: string, stderr: string, exitCode: number }
app.post('/api/run', async (req, res) => {
    try {
    const { language, code } = req.body || {};
        if (!language || typeof code !== 'string') {
            return res.status(400).json({ error: 'language and code are required' });
        }

        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'run-')); 
    const cleanup = async () => { try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
        };

        let cmd = '';
        let cwd = tmpDir;
    // no extra files needed for now

    const isWin = process.platform === 'win32';
    switch (language) {
            case 'javascript': {
                const file = path.join(tmpDir, 'main.js');
                await fs.writeFile(file, code, 'utf8');
                cmd = `node "${file}"`;
                break;
            }
            case 'typescript': {
                const file = path.join(tmpDir, 'main.ts');
                await fs.writeFile(file, code, 'utf8');
                // Try ts-node first; fallback to tsc + node if not available
                cmd = `node -e "try{require('ts-node/register') }catch(e){process.exit(42)}" && node -e "require('ts-node/register'); require('./main.ts')"`;
                break;
            }
            case 'c': {
                const file = path.join(tmpDir, 'main.c');
                await fs.writeFile(file, code, 'utf8');
                const runExe = isWin ? '.\\main.exe' : './main.exe';
                cmd = `gcc "${file}" -o main.exe && ${runExe}`;
                break;
            }
            case 'cpp': {
                const file = path.join(tmpDir, 'main.cpp');
                await fs.writeFile(file, code, 'utf8');
                const runExe = isWin ? '.\\main.exe' : './main.exe';
                cmd = `g++ "${file}" -o main.exe && ${runExe}`;
                break;
            }
            default:
                return res.status(400).json({ error: 'Unsupported language' });
        }

        // Windows compatibility: use shell to run chained commands
        const execOpts = { cwd, timeout: 8000, maxBuffer: 1024 * 1024 };

        let result;
        try {
            result = await execAsync(cmd, execOpts);
            await cleanup();
            return res.json({ stdout: result.stdout ?? '', stderr: result.stderr ?? '', exitCode: 0 });
        } catch (e) {
            await cleanup();
            const exitCode = typeof e.code === 'number' ? e.code : 1;
            return res.status(200).json({ stdout: e.stdout ?? '', stderr: e.stderr ?? String(e.message), exitCode });
        }
    } catch (err) {
        return res.status(500).json({ error: 'Execution failed', detail: String(err?.message || err) });
    }
});

// Serve static only in production when dist exists
const isProd = process.env.NODE_ENV === 'production';
if (isProd) {
    app.use(express.static('dist'));
    app.use((req, res) => {
        res.sendFile(path.join(path.resolve(), 'dist', 'index.html'));
    });
} else {
    app.get('/', (_req, res) => res.send('API server running. Use Vite dev server for UI at http://localhost:5173'));
}

// Map to track users and their associated socket IDs
const userSocketMap = {};

// Function to get all connected clients in a specific room
function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
}

// Handle socket connections
io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    // User joins the room
    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });

    // Code change event handler
    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    // Language change event handler
    socket.on(ACTIONS.LANGUAGE_CHANGE, ({ roomId, language }) => {
        socket.in(roomId).emit(ACTIONS.LANGUAGE_CHANGE, { language });
    });

    // Drawing relay
    socket.on('drawing', ({ roomId, drawing }) => {
        socket.in(roomId).emit('drawing', { drawing });
    });

    // Sync code change event handler
    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    // User disconnecting from the room
    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
        socket.leave();
    });
});

// Set up server to listen on port 5000 or environment-defined port
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
