import React, { useState, useRef } from 'react';
import { saveAs } from 'file-saver';
import { convertSvgToDxf, convertSvgToDwg } from '../utils/canvas';

function PolygonDrawer() {
  const svgRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [lines, setLines] = useState([]);
  const [currentPoint, setCurrentPoint] = useState(null);
  const [selectedLineIndex, setSelectedLineIndex] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);
  const [dragPoint, setDragPoint] = useState(null);
  const [isDragged, setIsDragged] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [hoverFirstPoint, setHoverFirstPoint] = useState(false);

  const PIXEL_PER_INCH = 4

  const drawLineFromPoints = (point1, point2, index) => {
    if (!point1 || !point2) return null;

    const line = lines[index]

    const newLine = {
      x1: Math.round(point1.x),
      y1: Math.round(point1.y),
      x2: Math.round(point2.x),
      y2: Math.round(point2.y),
      length: Math.round(Math.sqrt((point2.x - point1.x) ** 2 + (point2.y - point1.y) ** 2)),
      bevel: line ? line.bevel : 'none',
    };

    return newLine;
  }

  const getNewCoordinateOnLineLengthChange = (index, newLength) => {

    // newLength = 120
    const line = lines[index]
    var currentLength = Math.sqrt(Math.pow(line.x2 - line.x1, 2) + Math.pow(line.y2 - line.y1, 2));
    const changeLength = newLength - currentLength;

    // Calculate the change in x-coordinate (Δx) and y-coordinate (Δy)
    let deltaX = (changeLength / currentLength) * (line.x2 - line.x1);
    let deltaY = (changeLength / currentLength) * (line.y2 - line.y1);

    // Update the coordinates of the second point
    let newX2 = line.x2 + deltaX;
    let newY2 = line.y2 + deltaY;

    return { x1: line.x1, y1: line.y1, x2: newX2, y2: newY2 };
  }

  const updateLinesAfterPointsUpdate = (updatedPoints) => {
    const updatedLines = [];
    for (let i = 0; i < updatedPoints.length - 1; i++) {
      const newLine = drawLineFromPoints(updatedPoints[i], updatedPoints[i + 1], i);
      updatedLines.push(newLine);
    }
    // Add line between last and first point for closed polygon
    if (isClosed && updatedPoints.length > 2) {
      const newLine = drawLineFromPoints(updatedPoints[updatedPoints.length - 1], updatedPoints[0], updatedPoints.length - 1);
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

  const handlePointClick = (event) => {
    if (isClosed) {
      if (event.target.tagName === 'svg') {
        setSelectedLineIndex(null)
        setSelectedLine(null)
      }

      return;
    }

    if (hoverFirstPoint) {
      if (points.length <= 2) {
        return;
      }
      const newPoint = points[0]
      const newline = drawLineFromPoints(points[points.length - 1], newPoint, points.length - 1)

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
    const newline = drawLineFromPoints(points[points.length - 1], newPoint, points.length - 1)
    if (newline) {
      setLines([...lines, newline]);
    }
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

  const handleLineLengthChange = (index, newLength) => {

    // get points indexes 
    let firstPointIndex = selectedLineIndex
    let lastPointIndex = selectedLineIndex + 1
    if (selectedLineIndex === lines.length - 1) {
      firstPointIndex = selectedLineIndex
      lastPointIndex = 0
    }

    const updatedPoints = [...points];
    const newCord = getNewCoordinateOnLineLengthChange(index, newLength);

    updatedPoints[firstPointIndex].x = newCord.x1
    updatedPoints[firstPointIndex].y = newCord.y1
    updatedPoints[lastPointIndex].x = newCord.x2
    updatedPoints[lastPointIndex].y = newCord.y2
    setPoints(updatedPoints);

    // lines should be updated after updating points 
    updateLinesAfterPointsUpdate(updatedPoints);
  };

  const handleBevelChange = (index, value) => {
    const updatedLines = [...lines]
    updatedLines[index].bevel = value
    setLines(updatedLines);
  }

  const handleExportDwg = () => {
    const svgContent = svgRef.current.outerHTML;

    // Convert SVG to DWG format
    convertSvgToDwg(svgContent);
  }

  const handleExportDxf = () => {
    const svgContent = svgRef.current.outerHTML;

    // Convert SVG to DXF format
    const dxfContent = convertSvgToDxf(svgContent);

    // Create a Blob object with the DXF content
    const blob = new Blob([dxfContent], { type: "application/dxf" });

    // Trigger download
    saveAs(blob, 'drawing.dxf');
  }

  const getSvgPosition = (event) => {
    const svgRect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - svgRect.left;
    const y = event.clientY - svgRect.top;

    return { x, y }
  }

  // New function to render the grid
  const renderGrid = () => {
    const gridLines = [];
    const gridSpacing = 48; // 12 inches per grid unit, 2 pixels per inch

    // Horizontal lines
    for (let y = 0; y <= 720; y += gridSpacing) {
      gridLines.push(
        <line key={`horizontal-${y}`}
          className='grid-line'
          x1={0} y1={y} x2={960} y2={y}
          stroke="#ddd"
          strokeWidth={1}
        />
      );
    }

    // Vertical lines
    for (let x = 0; x <= 960; x += gridSpacing) {
      gridLines.push(
        <line key={`vertical-${x}`}
          className='grid-line'
          x1={x} y1={0} x2={x} y2={720}
          stroke="#ddd"
          strokeWidth={1}
        />
      );
    }

    return gridLines;
  };

  // render shapes and elements
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
      const line = lines[i];
      const isSelected = selectedLineIndex === i;

      // Draw main line
      rlines.push(
        <line key={`line-${i}`}
          x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
          stroke={isSelected ? '#ff0000' : 'black'}
          strokeWidth={isSelected ? 6 : 4}
          cursor={"pointer"}
          onClick={() => handleLineClick(i)}
        />
      );

      // draw bevel 
      const bevel = renderBevel(line, i)
      if (bevel) {
        rlines.push(bevel)
      }

      // Draw text
      const text = renderMarkerText(line.x1, line.y1, line.x2, line.y2, line.length, i)
      rlines.push(text);
    }

    // Draw line between last point and current point if not closed
    if (currentPoint !== null && points.length > 0 && !isClosed) {
      const lastPoint = points[points.length - 1];

      rlines.push(
        <line key={points.length}
          x1={lastPoint.x} y1={lastPoint.y} x2={currentPoint.x} y2={currentPoint.y}
          stroke={'black'}
          strokeWidth={4}
        />
      );

      // Calculate text position
      const length = Math.round(Math.sqrt((currentPoint.x - lastPoint.x) ** 2 + (currentPoint.y - lastPoint.y) ** 2))
      const text = renderMarkerText(lastPoint.x, lastPoint.y, currentPoint.x, currentPoint.y, length, points.length)
      rlines.push(text);
    }

    return rlines;
  };

  const renderBevel = (line, index) => {
    // Calculate perpendicular vector
    const dx = line.x2 - line.x1;
    const dy = line.y2 - line.y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const perpendicularX = -dy / length * 4; // 4 pixels offset
    const perpendicularY = dx / length * 4; // 4 pixels offset
    let bevel = null;

    // Draw shadow line for bevel
    if (line.bevel === 'yellow') {
      bevel = <line
        key={`line-shadow-yellow-${index}`}
        className='bevel'
        x1={line.x1 - perpendicularX}
        y1={line.y1 - perpendicularY}
        x2={line.x2 - perpendicularX}
        y2={line.y2 - perpendicularY}
        stroke={'yellow'}
        strokeWidth={6}
      />
    } else if (line.bevel === 'black') {
      bevel = <line
        key={`line-shadow-black-${index}`}
        className='bevel'
        x1={line.x1 - perpendicularX}
        y1={line.y1 - perpendicularY}
        x2={line.x2 - perpendicularX}
        y2={line.y2 - perpendicularY}
        stroke={'gray'}
        strokeWidth={6}
      />
    }

    return bevel;
  }

  const renderMarkerText = (x1, y1, x2, y2, lineLength, index) => {
    const textStyles = {
      fontSize: '14px',
      fill: '#000',
      pointerEvents: 'none',
    };

    // Calculate text position
    const textX = (x1 + x2) / 2;
    const textY = (y1 + y2) / 2;

    // Calculate perpendicular vector
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const perpendicularX = dy / length * 20; // Perpendicular vector x-component for text placement
    const perpendicularY = -dx / length * 20; // Perpendicular vector y-component for text placement

    // Draw text
    return <text key={`text-${index}`}
      x={textX + perpendicularX} y={textY + perpendicularY}
      textAnchor="middle"
      dominantBaseline="middle"
      style={textStyles}
    >
      {lineLength / PIXEL_PER_INCH}"
    </text>
  }

  const renderPolygon = () => {
    if (points.length < 3 || !isClosed) return null;

    const pointsString = points.map(point => `${point.x},${point.y}`).join(' ');
    return <polygon points={pointsString} fill="#00D2FF" />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'start' }}>
      <svg width="960px"
        height="60px"
        style={{ marginLeft: "60px", display: 'none' }}
      >
        <defs>
          <marker id="arrowup" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="black" />
          </marker>
        </defs>
        <line x1="450" y1="30" x2="10" y2="30" stroke="red" markerEnd="url(#arrowup)" />
        <text
          x={500} y={30}
          textAnchor="middle"
          dominantBaseline="middle"
          // transform="translate(-320,380) rotate(270)"
          style={{ textWeight: "bold" }}
        >
          240 inches
        </text>
        <line x1="550" y1="30" x2="950" y2="30" stroke="red" markerEnd="url(#arrow)" />
      </svg>

      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <svg width="60px"
          height="720px"
          style={{ display: 'none' }}
        >
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="black" />
            </marker>
          </defs>
          <line x1="30" y1="400" x2="30" y2="715" stroke="red" markerEnd="url(#arrow)" />
          <text
            x={30} y={350}
            textAnchor="middle"
            dominantBaseline="middle"
            transform="translate(-320,380) rotate(270)"
            style={{ textWeight: "bold" }}
          >
            180 inches
          </text>
          <line x1="30" y1="300" x2="30" y2="10" stroke="red" markerEnd="url(#arrow)" />
        </svg>
        <svg
          ref={svgRef}
          width="960px"
          height="720px"
          style={{ border: '4px solid #D7DC3C', background: '#fff' }}
          onClick={handlePointClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {renderGrid()}
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
          height="720px"
          style={{ border: '4px solid #D7DC3C', background: '#fff', padding: '30px', marginLeft: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div>
            <h1>Line Metrics</h1>
            {selectedLine && (
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: 'bold' }}>Line {selectedLineIndex + 1} is selected</p>
                <p><span style={{ fontWeight: 'bold' }}>(X1, Y1):</span> {selectedLine.x1 / PIXEL_PER_INCH + ', ' + selectedLine.y1 / PIXEL_PER_INCH}</p>
                <p><span style={{ fontWeight: 'bold' }}>(X2, Y2):</span> {selectedLine.x2 / PIXEL_PER_INCH + ', ' + selectedLine.y2 / PIXEL_PER_INCH}</p>
                <p>
                  <span style={{ fontWeight: 'bold' }}>Length: </span>
                  <span>{selectedLine.length / PIXEL_PER_INCH} inches</span>
                </p>
                <p>
                  <input
                    type="range"
                    min={48}
                    max={960}
                    value={selectedLine.length}
                    onChange={(e) => handleLineLengthChange(selectedLineIndex, e.target.value)}
                  />
                </p>
                <p>
                  <span style={{ fontWeight: 'bold' }}>Bevel: </span>
                  <input
                    type="radio"
                    value="none"
                    checked={selectedLine.bevel === "none"}
                    onChange={(e) => handleBevelChange(selectedLineIndex, e.target.value)}
                  />
                  <span style={{ marginRight: "10px" }}>None</span>
                  <input
                    type="radio"
                    value="yellow"
                    checked={selectedLine.bevel === "yellow"}
                    onChange={(e) => handleBevelChange(selectedLineIndex, e.target.value)}
                  />
                  <span style={{ marginRight: "10px" }}>Yellow</span>
                  <input
                    type="radio"
                    value="black"
                    checked={selectedLine.bevel === "black"}
                    onChange={(e) => handleBevelChange(selectedLineIndex, e.target.value)}
                  />
                  <span>Black</span>
                </p>
              </div>
            )}
          </div>
          {/* button for export  */}
          <div>
            <button style={{ marginRight: '20px' }} onClick={handleExportDxf}>Export as DXF</button>
            <button onClick={handleExportDwg}>Export as DWG</button>
          </div>

        </div>
      </div >
    </div>

  );
}

export default PolygonDrawer;