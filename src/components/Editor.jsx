import  { useEffect, useRef, useState } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/clike/clike';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../Actions';
import PropTypes from 'prop-types';

const Editor = ({ socketRef, roomId, onCodeChange }) => {
    const editorRef = useRef(null);
    const onCodeChangeRef = useRef(onCodeChange);
    const [language, setLanguage] = useState('javascript');
    const [running, setRunning] = useState(false);
    const [output, setOutput] = useState('');

    useEffect(() => {
        onCodeChangeRef.current = onCodeChange;
    }, [onCodeChange]);

    useEffect(() => {
        async function init() {
            if (editorRef.current) return; // guard against double init in StrictMode
            const textarea = document.getElementById('realtimeEditor');
            if (!textarea) return;
            editorRef.current = Codemirror.fromTextArea(textarea, {
                mode: { name: 'javascript', json: true },
                theme: 'dracula',
                autoCloseTags: true,
                autoCloseBrackets: true,
                lineNumbers: true,
            });

            editorRef.current.on('change', (instance, changes) => {
                const { origin } = changes;
                const code = instance.getValue();
                if (onCodeChangeRef.current) onCodeChangeRef.current(code);
                if (origin !== 'setValue') {
                    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                        roomId,
                        code,
                    });
                }
            });
        }
        init();
        return () => {
            // cleanup CodeMirror instance on unmount
            if (editorRef.current) {
                try {
                    const cm = editorRef.current;
                    editorRef.current = null;
                    cm.toTextArea();
                } catch {
                    // ignore cleanup errors
                }
            }
        };
    }, [roomId, socketRef]);

    useEffect(() => {
        const currentSocket = socketRef.current;
        if (currentSocket && editorRef.current) {
            const handleCodeChange = ({ code }) => {
                if (code !== null && code !== editorRef.current.getValue()) {
                    editorRef.current.setValue(code);
                }
            };
            const handleLanguageChange = ({ language }) => {
                setLanguage(language);
                // Update CodeMirror mode
                let mode = 'javascript';
                if (language === 'typescript') mode = 'javascript';
                if (language === 'c' || language === 'cpp') mode = 'text/x-c++src';
                editorRef.current.setOption('mode', mode);
            };

            currentSocket.on(ACTIONS.CODE_CHANGE, handleCodeChange);
            currentSocket.on(ACTIONS.LANGUAGE_CHANGE, handleLanguageChange);

            return () => {
                currentSocket.off(ACTIONS.CODE_CHANGE, handleCodeChange);
                currentSocket.off(ACTIONS.LANGUAGE_CHANGE, handleLanguageChange);
            };
        }
    }, [socketRef]);

    const onChangeLanguage = (e) => {
        const lang = e.target.value;
        setLanguage(lang);
        let mode = 'javascript';
        if (lang === 'typescript') mode = 'javascript';
        if (lang === 'c' || lang === 'cpp') mode = 'text/x-c++src';
        editorRef.current.setOption('mode', mode);
        socketRef.current.emit(ACTIONS.LANGUAGE_CHANGE, { roomId, language: lang });
    };

    const runCode = async () => {
        if (!editorRef.current) return;
        const code = editorRef.current.getValue();
        setRunning(true);
        setOutput('');
        try {
            const res = await fetch('/api/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language, code }),
            });
            const data = await res.json();
            const text = `${data.stdout || ''}${data.stderr ? (data.stdout ? '\n' : '') + data.stderr : ''}`;
            setOutput(text);
        } catch (err) {
            setOutput(String(err));
        } finally {
            setRunning(false);
        }
    };

    const shareCurrentRoom = async (type) => {
        const url = window.location.href;
        const text = `Join my coding room: ${url}`;
        const encodedText = encodeURIComponent(text);
        const encodedUrl = encodeURIComponent(url);
        switch (type) {
            case 'copy':
                await navigator.clipboard.writeText(url);
                break;
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodedText}`, '_blank');
                break;
            case 'telegram':
                window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`, '_blank');
                break;
            case 'mail':
                window.location.href = `mailto:?subject=Join my coding room&body=${encodedText}`;
                break;
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select value={language} onChange={onChangeLanguage}>
                    <option value="javascript">JavaScript (Node)</option>
                    <option value="typescript">TypeScript</option>
                    <option value="c">C (gcc)</option>
                    <option value="cpp">C++ (g++)</option>
                </select>
                <button onClick={runCode} disabled={running}>{running ? 'Running…' : 'Run'}</button>
                <button onClick={() => shareCurrentRoom('copy')}>Copy Link</button>
                <button onClick={() => shareCurrentRoom('whatsapp')}>WhatsApp</button>
                <button onClick={() => shareCurrentRoom('telegram')}>Telegram</button>
                <button onClick={() => shareCurrentRoom('mail')}>Email</button>
            </div>
            <textarea id="realtimeEditor"></textarea>
            <div style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 600 }}>Output</div>
                <pre style={{ background: '#0d1117', color: '#c9d1d9', padding: 8, minHeight: 120, overflow: 'auto' }}>{output}</pre>
            </div>
        </div>
    );
};
Editor.propTypes = {
    socketRef: PropTypes.shape({ current: PropTypes.any }),
    roomId: PropTypes.string,
    onCodeChange: PropTypes.func,
};

export default Editor;