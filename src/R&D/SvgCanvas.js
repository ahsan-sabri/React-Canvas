import React, { useState } from 'react';

function PolygonDrawer() {
  const [points, setPoints] = useState([]);
  const [currentPoint, setCurrentPoint] = useState(null);
  const [isClosed, setIsClosed] = useState(false);
  const [hoverFirstPoint, setHoverFirstPoint] = useState(false);

  const handlePointClick = (event) => {
    if (isClosed) return;

    if (hoverFirstPoint) {
      setIsClosed(true);
      return;
    }

    const svgRect = event.target.getBoundingClientRect();
    const x = event.clientX - svgRect.left;
    const y = event.clientY - svgRect.top;

    const newPoint = { x, y };
    setPoints([...points, newPoint]);
    setCurrentPoint(null);
  };

  const handleMouseMove = (event) => {
    if (isClosed) return;

    const elementFromPoint = document.elementFromPoint(event.clientX, event.clientY);
    const isSvgElement = elementFromPoint.tagName === 'svg';
    const svgRect = event.target.getBoundingClientRect();

    if (isSvgElement) {

      const x = event.clientX - svgRect.left;
      const y = event.clientY - svgRect.top;

      setCurrentPoint({ x, y });

      const withinRadius = points.length > 0 && Math.abs(points[0].x - x) < 15 && Math.abs(points[0].y - y) < 15;
      setHoverFirstPoint(withinRadius);
    }

  };

  const handleMouseEnterFirstPoint = () => {
    setHoverFirstPoint(true);
  };

  const handleMouseLeaveFirstPoint = () => {
    setHoverFirstPoint(false);
  };

  const renderPoints = () => {
    return points.map((point, index) => (
      <circle key={index} cx={point.x} cy={point.y} r={index === 0 && hoverFirstPoint && !isClosed ? "15" : "10"} fill="#bed929" />
    ));
  };

  const renderLines = () => {
    const lines = [];
    for (let i = 0; i < points.length - 1; i++) {
      const startPoint = points[i];
      const endPoint = points[i + 1];
      lines.push(<line key={i} x1={startPoint.x} y1={startPoint.y} x2={endPoint.x} y2={endPoint.y} stroke="#000" strokeWidth={4} />);
    }

    if (currentPoint !== null && points.length > 0 && !isClosed) {
      const lastPoint = points[points.length - 1];
      lines.push(<line key={points.length} x1={lastPoint.x} y1={lastPoint.y} x2={currentPoint.x} y2={currentPoint.y} stroke="#000" strokeWidth={4} />);
    }

    if (isClosed && points.length > 0) {
      const firstPoint = points[0];
      const lastPoint = points[points.length - 1];
      lines.push(<line key={points.length} x1={lastPoint.x} y1={lastPoint.y} x2={firstPoint.x} y2={firstPoint.y} stroke="#000" strokeWidth={4} />);
    }

    return lines;
  };

  const renderPolygon = () => {
    if (points.length < 3 || !isClosed) return null;

    const pointsString = points.map(point => `${point.x},${point.y}`).join(' ');
    return <polygon points={pointsString} fill="#00D2FF" />;
  };

  return (
    <svg
      width="1000px"
      height="700px"
      style={{ border: '4px solid #D7DC3C', borderRadius: '20px', background: '#fff' }}
      onClick={handlePointClick}
      onMouseMove={handleMouseMove}
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
  );
}

export default PolygonDrawer;
