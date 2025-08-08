import  { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import '../styles/drawingBoard.css';

const DrawingBoard = ({ socketRef, roomId }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lineColor] = useState('#000000');
    const [lineWidth] = useState(5);
    const pointsRef = useRef([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        const handleMouseDown = (e) => {
            setIsDrawing(true);
            context.beginPath();
            context.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
            pointsRef.current = [{ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }];
        };

        const handleMouseMove = (e) => {
            if (!isDrawing) return;
            context.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
            context.strokeStyle = lineColor;
            context.lineWidth = lineWidth;
            context.stroke();
            context.beginPath();
            context.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
            pointsRef.current.push({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
        };

        const handleMouseUp = () => {
            setIsDrawing(false);
            context.closePath();
            const currentDrawing = {
                color: lineColor,
                width: lineWidth,
                drawings: pointsRef.current,
            };
            socketRef.current.emit('drawing', { roomId, drawing: currentDrawing });
        };

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDrawing, lineColor, lineWidth, socketRef, roomId]);

    useEffect(() => {
        const currentSocket = socketRef.current;
        const handleDrawing = ({ drawing }) => {
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            context.strokeStyle = drawing.color;
            context.lineWidth = drawing.width;
            if (Array.isArray(drawing.drawings)) {
                context.beginPath();
                drawing.drawings.forEach((point, idx) => {
                    if (idx === 0) {
                        context.moveTo(point.x, point.y);
                    } else {
                        context.lineTo(point.x, point.y);
                    }
                });
                context.stroke();
                context.closePath();
            }
        };

        currentSocket.on('drawing', handleDrawing);

        return () => {
            currentSocket.off('drawing', handleDrawing);
        };
    }, [socketRef]);

    return (
        <div className="drawing-board">
            <canvas ref={canvasRef} width={800} height={600} className="canvas" />
        </div>
    );
};

DrawingBoard.propTypes = {
    socketRef: PropTypes.shape({ current: PropTypes.any }),
    roomId: PropTypes.string,
};

export default DrawingBoard;