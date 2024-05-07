import React, { useState, useRef, useEffect } from 'react';

const SketchCanvas = () => {
  const canvasRef = useRef(null);
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(5);
  const [points, setPoints] = useState([]);
  const [currentPoint, setCurrentPoint] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.strokeStyle = color;
    context.lineWidth = size;
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw lines between points
    context.strokeStyle = 'black';
    context.lineWidth = 2;
    context.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }

      // Calculate and display distance for each line segment
      if (index < points.length - 1) {
        const nextPoint = points[index + 1];
        const distance = Math.sqrt(
          Math.pow(nextPoint.x - point.x, 2) +
          Math.pow(nextPoint.y - point.y, 2)
        ).toFixed(2);

        const textX = (point.x + nextPoint.x) / 2;
        const textY = (point.y + nextPoint.y) / 2;

        context.font = '14px Arial';
        context.fillStyle = 'black';
        context.textAlign = 'center';
        context.fillText(distance, textX, textY - 5);
      }
    });
    context.stroke();
  }, [color, size, points]);

  const handleMouseDown = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;

    setCurrentPoint({ x: clientX, y: clientY });
  };

  const handleMouseMove = (event) => {
    if (!currentPoint) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;

    drawTempLine(currentPoint, { x: clientX, y: clientY });
  };

  const handleMouseUp = (event) => {
    if (!currentPoint) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;

    setPoints([...points, currentPoint, { x: clientX, y: clientY }]);
    setCurrentPoint(null);
  };

  const drawTempLine = (start, end) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw lines between existing points
    context.strokeStyle = 'black';
    context.lineWidth = 2;
    context.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    });
    context.stroke();

    // Draw temporary line from current point to mouse position
    context.strokeStyle = 'gray';
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  };

  return (
    <div>
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        style={{ marginRight: '10px' }}
      />
      <input
        type="range"
        min={1}
        max={20}
        value={size}
        onChange={(e) => setSize(e.target.value)}
      />
      <br></br>
      <br></br>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        width={1200}
        height={600}
        style={{ border: '4px solid #D7DC3C', borderRadius: '4px', background: '#fff' }}
      />

    </div>
  );
};

export default SketchCanvas;