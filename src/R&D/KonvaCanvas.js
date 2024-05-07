import React, { useState, useEffect } from 'react';
import { Stage, Layer, Line, Text, Circle } from 'react-konva';

const SimpleLineTool = () => {
  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [endPoint, setEndPoint] = useState({ x: 0, y: 0 });
  const [distance, setDistance] = useState(0);
  const [currentColor, setCurrentColor] = useState('#000000'); // Default color is black

  const handleMouseDown = (event) => {
    const { offsetX, offsetY } = event.evt;
    setIsDrawing(true);
    setStartPoint({ x: offsetX, y: offsetY });
    setEndPoint({ x: offsetX, y: offsetY });
    setDistance(0); // Reset distance when starting a new line
  };

  const handleMouseMove = (event) => {
    if (!isDrawing) return;

    const { offsetX, offsetY } = event.evt;
    setEndPoint({ x: offsetX, y: offsetY });
    calculateDistance(startPoint, { x: offsetX, y: offsetY });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setLines([...lines, [startPoint, endPoint]]);
  };

  const handleColorChange = (event) => {
    setCurrentColor(event.target.value);
  };

  const handleDistanceChange = (event) => {
    const newDistance = Math.round(parseFloat(event.target.value));
    if (!isNaN(newDistance)) {
      setDistance(newDistance);
      // Recalculate the end point based on the new distance
      const dx = endPoint.x - startPoint.x;
      const dy = endPoint.y - startPoint.y;
      const angle = Math.atan2(dy, dx);
      const newX = startPoint.x + newDistance * Math.cos(angle);
      const newY = startPoint.y + newDistance * Math.sin(angle);
      setEndPoint({ x: newX, y: newY });
      // Update the last line in the lines array
      const updatedLines = [...lines];
      updatedLines[updatedLines.length - 1][1] = { x: newX, y: newY };
      setLines(updatedLines);
    }
  };

  const calculateDistance = (point1, point2) => {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    setDistance(dist);
  };

  useEffect(() => {
    calculateDistance(startPoint, endPoint);
  }, [startPoint, endPoint]);

  return (
    <div>
      <input type="color" value={currentColor} onChange={handleColorChange} />
      <input type="number" value={Math.round(distance)} onChange={handleDistanceChange} />
      <Stage
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        width={1200}
        height={600}
        style={{ border: '4px solid #D7DC3C', borderRadius: '4px', background: '#fff' }}
      >
        <Layer>
          {lines.map((line, i) => (
            <React.Fragment key={i}>
              <Line
                points={[line[0].x, line[0].y, line[1].x, line[1].y]}
                stroke={currentColor}
                strokeWidth={2}
              />
              <Circle x={line[0].x} y={line[0].y} radius={4} fill={currentColor} />
              <Circle x={line[1].x} y={line[1].y} radius={4} fill={currentColor} />
            </React.Fragment>
          ))}
          {isDrawing && (
            <React.Fragment>
              <Line
                points={[startPoint.x, startPoint.y, endPoint.x, endPoint.y]}
                stroke={currentColor}
                strokeWidth={2}
              />
              <Circle x={startPoint.x} y={startPoint.y} radius={4} fill={currentColor} />
              <Circle x={endPoint.x} y={endPoint.y} radius={4} fill={currentColor} />
            </React.Fragment>
          )}
          <Text
            x={(startPoint.x + endPoint.x) / 2}
            y={(startPoint.y + endPoint.y) / 2}
            text={Math.round(distance).toString()}
            fontSize={16}
            fontFamily="Arial"
            fill={currentColor}
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default SimpleLineTool;
