// Importing necessary packages using ES module syntax
import express from 'express';
import http from 'http';
import path from 'path';
import process from 'process';
import { Server } from 'socket.io';
import ACTIONS from './src/actions.js'; // Note the '.js' extension in ES Modules

// Create the express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io server
const io = new Server(server);

// Serve static files from 'build' directory
app.use(express.static('build'));

// Fallback to 'index.html' for any other routes
app.use((req, res) => {
    res.sendFile(path.join(path.resolve(), 'build', 'index.html'));
});

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
