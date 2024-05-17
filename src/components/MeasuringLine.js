import React from 'react';
import { PIXEL_PER_INCH } from '../utils/constant';

function MeasuringLine({ x1, y1, x2, y2 }) {
  const length = Math.round(Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)) / PIXEL_PER_INCH;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  // Calculate the unit vector along the line direction
  const gap = 40;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const unitX = dx / distance;
  const unitY = dy / distance;

  // Calculate the endpoints of the line segments with the gap
  const firstLineEndX = midX - unitX * gap / 2;
  const firstLineEndY = midY - unitY * gap / 2;
  const secondLineStartX = midX + unitX * gap / 2;
  const secondLineStartY = midY + unitY * gap / 2;

  const lineStyle = {
    display: length < 12 ? 'none' : 'block',
  };

  return (
    <g style={lineStyle}>
      {/* arrow head  */}
      <defs>
        <marker id="start-arrowhead" markerWidth="7" markerHeight="5" refX="0" refY="2.5" orient="auto">
          <polygon points="7 0, 0 2.5, 7 5" fill='grey' />
        </marker>
        <marker id="end-arrowhead" markerWidth="5" markerHeight="5" refX="7" refY="2.5" orient="auto">
          <polygon points="0 0, 7 2.5, 0 5" fill='grey' />
        </marker>
      </defs>
      {/* lines  */}
      <line
        x1={x1}
        y1={y1}
        x2={firstLineEndX}
        y2={firstLineEndY}
        stroke="grey"
        strokeWidth="2"
        markerStart="url(#start-arrowhead)"
      />
      <line
        x1={secondLineStartX}
        y1={secondLineStartY}
        x2={x2}
        y2={y2}
        stroke="grey"
        strokeWidth="2"
        markerEnd="url(#end-arrowhead)"
      />
      {/* value text */}
      <text
        x={midX}
        y={midY}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: '14px' }}
      >
        {length}"
      </text>
    </g>
  );
}

export default MeasuringLine;
