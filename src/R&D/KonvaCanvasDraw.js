import React from 'react';
import { Stage, Layer, Line, Text } from 'react-konva';

const SketchApp = () => {
  const [tool, setTool] = React.useState('pen');
  const [lines, setLines] = React.useState([]);
  const [startPoint, setStartPoint] = React.useState(null); // Track start point of the line
  const [endPoint, setEndPoint] = React.useState(null); // Track end point of the line

  const handleMouseDown = (e) => {
    const pos = e.target.getStage().getPointerPosition();
    setStartPoint({ x: pos.x, y: pos.y }); // Set start point when mouse is pressed
    setEndPoint(null); // Reset end point when mouse is pressed
  };

  const handleMouseUp = (e) => {
    if (startPoint && endPoint) {
      const newLine = {
        tool,
        points: [startPoint.x, startPoint.y, endPoint.x, endPoint.y], // Create line with start and end points
      };
      setLines([...lines, newLine]);
      setStartPoint(null); // Reset start point after drawing the line
      setEndPoint(null); // Reset end point after drawing the line
    }
  };

  const handleMouseMove = (e) => {
    if (startPoint) {
      const pos = e.target.getStage().getPointerPosition();
      setEndPoint({ x: pos.x, y: pos.y }); // Update end point as mouse is moved
    }
  };

  const calculateDistance = (point1, point2) => {
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
  };

  return (
    <div>
      <select
        value={tool}
        onChange={(e) => {
          setTool(e.target.value);
        }}
      >
        <option value="pen">Pen</option>
        <option value="eraser">Eraser</option>
      </select>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          {lines.map((line, i) => (
            <React.Fragment key={i}>
              <Line
                points={line.points}
                stroke="#df4b26"
                strokeWidth={5}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  line.tool === 'eraser' ? 'destination-out' : 'source-over'
                }
              />
              {startPoint && endPoint && (
                <Text
                  x={(line.points[0] + line.points[2]) / 2} // x-coordinate for text
                  y={(line.points[1] + line.points[3]) / 2} // y-coordinate for text
                  text={calculateDistance({ x: line.points[0], y: line.points[1] }, { x: line.points[2], y: line.points[3] }).toFixed(2)} // distance text
                  fontSize={14}
                  fill="#000"
                  align="center"
                />
              )}
            </React.Fragment>
          ))}
          {startPoint && endPoint && ( // Render preview line while dragging
            <Line
              points={[startPoint.x, startPoint.y, endPoint.x, endPoint.y]}
              stroke="#df4b26"
              strokeWidth={5}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={
                tool === 'eraser' ? 'destination-out' : 'source-over'
              }
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default SketchApp;
