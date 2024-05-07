import React, { useState } from 'react';

function PolygonDrawer() {
  const [points, setPoints] = useState([]);
  const [lines, setLines] = useState([]);
  const [currentPoint, setCurrentPoint] = useState(null);
  const [selectedLineIndex, setSelectedLineIndex] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);
  const [dragPoint, setDragPoint] = useState(null);
  const [isDragged, setIsDragged] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [hoverFirstPoint, setHoverFirstPoint] = useState(false);

  const handlePointClick = (event) => {
    if (isClosed) return;

    if (hoverFirstPoint) {
      const newPoint = points[0]
      const newline = drawLineFromPoints(points[points.length - 1], newPoint)

      if (newline) {
        setLines([...lines, newline]);
      }
      setIsClosed(true);
      return;
    }

    // set new point 
    const svgPos = getSvgPosition(event);
    const newPoint = svgPos;

    setPoints([...points, newPoint]);
    setCurrentPoint(null);

    //draw line
    const newline = drawLineFromPoints(points[points.length - 1], newPoint)
    if (newline) {
      setLines([...lines, newline]);
    }
  };

  const drawLineFromPoints = (point1, point2) => {
    if (!point1 || !point2) return null;

    const newLine = {
      x1: point1.x.toFixed(),
      y1: point1.y.toFixed(),
      x2: point2.x.toFixed(),
      y2: point2.y.toFixed(),
      length: Math.sqrt((point2.x - point1.x) ** 2 + (point2.y - point1.y) ** 2).toFixed(),
    };

    return newLine;
  }

  const updateLinesAfterPointsUpdate = (updatedPoints) => {
    const updatedLines = [];
    for (let i = 0; i < updatedPoints.length - 1; i++) {
      const newLine = drawLineFromPoints(updatedPoints[i], updatedPoints[i + 1]);
      updatedLines.push(newLine);
    }
    // Add line between last and first point for closed polygon
    if (isClosed && updatedPoints.length > 2) {
      const newLine = drawLineFromPoints(updatedPoints[updatedPoints.length - 1], updatedPoints[0]);
      updatedLines.push(newLine);
    }

    // update lines 
    setLines(updatedLines);
    setSelectedLine(lines[selectedLineIndex]);
  }

  const handleLineClick = (index) => {
    setSelectedLineIndex(index);

    // Set selected line details
    const selectedLine = lines[index];
    setSelectedLine(selectedLine);
  };

  const handleMouseMove = (event) => {
    const svgPos = getSvgPosition(event);

    if (isClosed) {
      if (isDragged) {
        dragPoint.x = svgPos.x;
        dragPoint.y = svgPos.y;

        const updatedPoints = [...points];
        setPoints(updatedPoints);

        // lines should be updated after updating points 
        updateLinesAfterPointsUpdate(updatedPoints);
      }
      return
    }

    setCurrentPoint(svgPos);

    const withinRadius = points.length > 0 && Math.abs(points[0].x - svgPos.x) < 15 && Math.abs(points[0].y - svgPos.y) < 15;
    setHoverFirstPoint(withinRadius);
  };

  const handleMouseUp = () => {
    handlePointDragEnd();
  }

  const handlePointDrag = (index) => {
    if (!isClosed) {
      return;
    }

    const point = points[index]

    setIsDragged(true)
    setDragPoint(point)
  }

  const handlePointDragEnd = (event) => {
    setIsDragged(false)
  }

  const handleMouseEnterFirstPoint = () => {
    setHoverFirstPoint(true);
  };

  const handleMouseLeaveFirstPoint = () => {
    setHoverFirstPoint(false);
  };

  const getSvgPosition = (event) => {
    const svgRect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - svgRect.left;
    const y = event.clientY - svgRect.top;

    return { x, y }
  }

  const renderPoints = () => {
    return points.map((point, index) => (
      <circle key={index}
        cx={point.x}
        cy={point.y}
        r={index === 0 && hoverFirstPoint && !isClosed ? "15" : "10"}
        fill="#bed929"
        cursor={"move"}
        onMouseDown={() => handlePointDrag(index)}
      />
    ));
  };

  const renderLines = () => {
    const rlines = [];

    // Draw lines between consecutive points
    for (let i = 0; i < lines.length; i++) {
      const isSelected = selectedLineIndex === i;

      rlines.push(
        <line key={i}
          x1={lines[i].x1} y1={lines[i].y1} x2={lines[i].x2} y2={lines[i].y2}
          stroke={isSelected ? '#ff0000' : '#000'}
          strokeWidth={isSelected ? 6 : 4}
          cursor={"pointer"}
          onClick={() => handleLineClick(i)}
        />
      );
    }

    // Draw line between last point and current point if not closed
    if (currentPoint !== null && points.length > 0 && !isClosed) {
      const lastPoint = points[points.length - 1];

      rlines.push(
        <line key={points.length}
          x1={lastPoint.x} y1={lastPoint.y} x2={currentPoint.x} y2={currentPoint.y}
          stroke={'#000'}
          strokeWidth={4}
        />
      );
    }

    return rlines;
  };

  const renderPolygon = () => {
    if (points.length < 3 || !isClosed) return null;

    const pointsString = points.map(point => `${point.x},${point.y}`).join(' ');
    return <polygon points={pointsString} fill="#00D2FF" />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <svg
        width="1000px"
        height="700px"
        style={{ border: '4px solid #D7DC3C', borderRadius: '20px', background: '#fff' }}
        onClick={handlePointClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {renderPolygon()}
        {renderLines()}
        {renderPoints()}
        {hoverFirstPoint && !isClosed && (
          <circle
            cx={points.length > 0 ? points[0].x : 0}
            cy={points.length > 0 ? points[0].y : 0}
            r="10"
            fill="#dfed91"
            onMouseEnter={handleMouseEnterFirstPoint}
            onMouseLeave={handleMouseLeaveFirstPoint}
          />
        )}
      </svg>
      <div
        width="500px"
        height="700px"
        style={{ border: '4px solid #D7DC3C', borderRadius: '20px', background: '#fff', padding: '30px' }}
      >
        <h1>Line Metrics</h1>
        {selectedLine && (
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontWeight: 'bold' }}>Line {selectedLineIndex} is selected</p>
            <p><span style={{ fontWeight: 'bold' }}>(X1, Y1):</span> {selectedLine.x1 + ', ' + selectedLine.y1}</p>
            <p><span style={{ fontWeight: 'bold' }}>(X2, Y2):</span> {selectedLine.x2 + ', ' + selectedLine.y2}</p>
            <p><span style={{ fontWeight: 'bold' }}>Length:</span> {selectedLine.length}</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default PolygonDrawer;
