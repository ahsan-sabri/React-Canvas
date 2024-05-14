import React, { useState, useRef, useEffect } from 'react';
import { saveAs } from 'file-saver';
import { convertSvgToDxf, convertSvgToDwg, getBezierControlPoint } from '../utils/canvas';
import { getShapePoints } from '../utils/shapes';

function PolygonDrawer() {
  const svgRef = useRef(null);
  const [activeShape, setActiveShape] = useState('freeDrawing');
  const [activeTool, setActiveTool] = useState(null);
  const [magneticSnap, setMagneticSnap] = useState(true);
  const [points, setPoints] = useState([]);
  const [cutoutPoints, setCutoutPoints] = useState([]);
  const [lines, setLines] = useState([]);
  const [cutoutLines, setCutoutLines] = useState([]);
  const [currentPoint, setCurrentPoint] = useState(null);
  const [selectedLineIndex, setSelectedLineIndex] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);
  const [dragPoint, setDragPoint] = useState(null);
  const [isDragged, setIsDragged] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [isCutoutClosed, setIsCutoutClosed] = useState(false);
  const [hoverFirstPoint, setHoverFirstPoint] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(.8);
  const [actionHistory, setActionHistory] = useState([]);

  const PIXEL_PER_INCH = 4 // 4 inch per pixel
  const GRID_SPACING = 12 * PIXEL_PER_INCH; // 12 inch per grid

  useEffect(() => {

    // update selected lline on change line index
    const updateSelectedLine = (newIndex) => {
      const newSelectedLine = lines[newIndex];
      if (newSelectedLine) {
        setSelectedLine(newSelectedLine);
      }
      else {
        setSelectedLine(null);
      }
    };

    updateSelectedLine(selectedLineIndex)

    // if points and lines are not same then draw the closing line
    if (isClosed && points.length !== lines.length) {
      const updatedLines = [...lines]
      const newLine = drawLineFromPoints(points[points.length - 1], points[0], points.length - 1);
      updatedLines.push(newLine);
      setLines(updatedLines)
    }

    if (activeShape && activeShape !== 'freeDrawing') {
      //
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClosed, lines, points, selectedLineIndex]);

  const drawLineFromPoints = (point1, point2, index) => {
    if (!point1 || !point2) return null;

    const line = !activeTool ? lines[index] : cutoutLines[index]

    const newLine = {
      x1: Math.round(point1.x),
      y1: Math.round(point1.y),
      x2: Math.round(point2.x),
      y2: Math.round(point2.y),
      length: Math.round(Math.sqrt((point2.x - point1.x) ** 2 + (point2.y - point1.y) ** 2)),
      bevel: line ? line.bevel : 'none',
      bezierCurvature: isClosed && line ? line.bezierCurvature : 0,
    };

    return newLine;
  }

  const drawReadyShape = (value) => {

    const shapePoints = getShapePoints(value, PIXEL_PER_INCH)

    // set points 
    setPoints(shapePoints)
    // draw lines
    updateLinesAfterPointsUpdate(shapePoints)
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

  const getSvgPosition = (event) => {
    const svgRect = event.currentTarget.getBoundingClientRect();
    let x = (event.clientX - svgRect.left) / zoomLevel;
    let y = (event.clientY - svgRect.top) / zoomLevel;

    if (magneticSnap) {
      const nearestX = Math.round(x / GRID_SPACING) * GRID_SPACING;
      const nearestY = Math.round(y / GRID_SPACING) * GRID_SPACING;

      return { x: nearestX, y: nearestY }
    }

    return { x, y }
  }

  // Function to add an action to history
  const addActionToHistory = (action) => {
    let prevHistory = [...actionHistory]
    prevHistory.push(action)
    setActionHistory(prevHistory);
  };

  // New function to render the grid
  const renderGrid = () => {
    const gridLines = [];

    // Horizontal lines
    for (let y = 0; y <= 720; y += GRID_SPACING) {
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
    for (let x = 0; x <= 960; x += GRID_SPACING) {
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

  const handleActiveShapeChange = (value) => {
    // const confirmed = window.confirm("Are you sure you want to clear and change the active shape?");
    // if (!confirmed) {
    //   return; // Do nothing if not confirmed
    // }

    handleClear()
    setActiveShape(value)
    if (value === 'freeDrawing') return;

    setIsClosed(true)
    //draw the shape
    drawReadyShape(value)
  }

  const handleActiveTool = (value) => {
    setActiveTool(value);
  };

  const handleMagneticSnapChange = (value) => {
    setMagneticSnap(value);
  };

  const handleLineClick = (index) => {
    if (activeTool) {
      return
    }
    setSelectedLineIndex(index);
  };

  const handlePointClick = (event) => {
    const svgPos = getSvgPosition(event);
    const newPoint = svgPos;

    if (isClosed) {
      if (event.target.tagName === 'svg') {
        setSelectedLineIndex(null)
        setSelectedLine(null)
      }

      if (activeTool) {
        const el = event.target;
        if (el.tagName === 'path' && el.classList.contains('polygon')) {

          if (isCutoutClosed) return

          if (hoverFirstPoint) {
            if (cutoutPoints.length <= 2) {
              return;
            }
            const newPoint = cutoutPoints[0]
            const newline = drawLineFromPoints(cutoutPoints[cutoutPoints.length - 1], newPoint, cutoutPoints.length - 1)

            if (newline) {
              setCutoutLines([...cutoutLines, newline]);
            }
            setIsCutoutClosed(true);
            // addActionToHistory({ type: 'closePolygon' })
            return;
          }

          // set new point 
          setCutoutPoints([...cutoutPoints, newPoint]);
          // addActionToHistory({ type: 'addPoint', point: newPoint })
          setCurrentPoint(null);

          //draw line
          const newline = drawLineFromPoints(cutoutPoints[cutoutPoints.length - 1], newPoint, cutoutPoints.length - 1)
          if (newline) {
            setCutoutLines([...cutoutLines, newline]);
          }


        }
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
      addActionToHistory({ type: 'closePolygon' })
      return;
    }

    // set new point 
    // const svgPos = getSvgPosition(event);
    // const newPoint = svgPos;

    setPoints([...points, newPoint]);
    addActionToHistory({ type: 'addPoint', point: newPoint })
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

      if (activeTool) {
        if (isCutoutClosed) {
          return
        }
        setCurrentPoint(svgPos);

        const withinRadius = cutoutPoints.length > 0 && Math.abs(cutoutPoints[0].x - svgPos.x) < 15 && Math.abs(cutoutPoints[0].y - svgPos.y) < 15;
        setHoverFirstPoint(withinRadius);
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

  const handleMouseOutOfCanvas = (event) => {
    setCurrentPoint(null)
  }

  const handleZoom = (event) => {
    const newZoomLevel = event.target.value;
    setZoomLevel(newZoomLevel);
  }

  const handlePointDrag = (index, point) => {
    if (!isClosed) {
      return;
    }

    const oldPoint = { ...point }
    if (!dragPoint) {
      addActionToHistory({ type: 'movePoint', index: index, point: oldPoint })
    }

    setIsDragged(true)
    const draggedPoint = points[index]
    setDragPoint(draggedPoint)

  }

  const handlePointDragEnd = (event) => {
    setIsDragged(false)
    setDragPoint(null)
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

  // Update the handleBezierCurvatureChange function
  const handleBezierCurvatureChange = (index, value) => {
    const updatedLines = [...lines];
    updatedLines[index].bezierCurvature = value;
    setLines(updatedLines);
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

  // Function to handle undo action
  const handleUndo = () => {
    if (actionHistory.length === 0) return;

    const lastAction = actionHistory[actionHistory.length - 1];
    const newHistory = actionHistory.slice(0, -1);

    switch (lastAction.type) {
      case 'addPoint':
        if (lastAction.isClosed) {
          setIsClosed(false)
        }
        const updatedPoints = points.slice(0, -1);
        setPoints(updatedPoints);
        updateLinesAfterPointsUpdate(updatedPoints)
        break;
      case 'movePoint':
        console.log(lastAction);
        const movedPoint = lastAction.point
        const newPoints = [...points]
        newPoints[lastAction.index] = movedPoint;
        setPoints(newPoints);
        updateLinesAfterPointsUpdate(newPoints)
        break;
      // case 'addBevel':
      //   break;
      // case 'changeLineLength':
      //   break;
      case 'closePolygon':
        setIsClosed(false);
        const updatedLines = lines.slice(0, -1);
        setLines(updatedLines);
        break;
      default:
        // Default action here
        break;
    }

    setActionHistory(newHistory);
  };

  const handleClear = () => {
    setIsClosed(false)
    setIsCutoutClosed(false)
    setActiveTool(null)
    setPoints([])
    setCutoutPoints([])
    setLines([])
    setCutoutLines([])
    setSelectedLineIndex(null)
    setActionHistory([])
    setZoomLevel(.8)
    setActiveShape('freeDrawing')
  }

  const handleResetZoom = () => {
    setZoomLevel(.8)
  }

  // render shapes and elements
  const renderCurrentPoint = () => {
    if (currentPoint) {
      return <circle
        cx={currentPoint.x}
        cy={currentPoint.y}
        r={8}
        fill="transparent"
        stroke="#bed929"
        strokeWidth="4"
      />
    }
  };

  const renderPoints = () => {
    return points.map((point, index) => (
      <circle key={index}
        cx={point.x}
        cy={point.y}
        r={index === 0 && hoverFirstPoint && !isClosed ? 15 : 10}
        fill="#bed929"
        cursor={"move"}
        onMouseDown={() => handlePointDrag(index, point)}
      />
    ));
  };

  const renderCutoutPoints = () => {
    return cutoutPoints.map((point, index) => (
      <circle key={`cutout-point-${index}`}
        cx={point.x}
        cy={point.y}
        r={index === 0 && hoverFirstPoint && !isCutoutClosed ? 15 : 10}
        fill="#bed929"
        cursor={"move"}
      // onMouseDown={() => handlePointDrag(index, point)}
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
      if (line.bezierCurvature === 0) {
        rlines.push(
          <line key={`line-${i}`}
            x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
            stroke={isSelected ? '#ff0000' : 'black'}
            strokeWidth={isSelected ? 6 : 4}
            cursor={"pointer"}
            onClick={() => handleLineClick(i)}
          />
        );
      }
      else {
        const controlPoint = getBezierControlPoint(line.x1, line.y1, line.x2, line.y2, line.bezierCurvature)
        rlines.push(
          <path key={`line-${i}`}
            d={`M ${line.x1} ${line.y1} Q ${controlPoint.x} ${controlPoint.y}, ${line.x2} ${line.y2}`}
            stroke={isSelected ? '#ff0000' : 'black'}
            fill={"transparent"}
            strokeWidth={isSelected ? 6 : 4}
            cursor={"pointer"}
            onClick={() => handleLineClick(i)}
          />
        );
      }

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


  const renderCutoutLines = () => {
    const rlines = [];

    // Draw lines between consecutive points
    for (let i = 0; i < cutoutLines.length; i++) {
      const line = cutoutLines[i];
      // const isSelected = selectedLineIndex === i;

      // Draw main line
      if (line.bezierCurvature === 0) {
        rlines.push(
          <line key={`cutout-line-${i}`}
            x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
            stroke={'black'}
            strokeWidth={4}
            cursor={"pointer"}
          // onClick={() => handleLineClick(i)}
          />
        );
      }
      // else {
      //   const controlPoint = getBezierControlPoint(line.x1, line.y1, line.x2, line.y2, line.bezierCurvature)
      //   rlines.push(
      //     <path key={`line-${i}`}
      //       d={`M ${line.x1} ${line.y1} Q ${controlPoint.x} ${controlPoint.y}, ${line.x2} ${line.y2}`}
      //       stroke={isSelected ? '#ff0000' : 'black'}
      //       fill={"transparent"}
      //       strokeWidth={isSelected ? 6 : 4}
      //       cursor={"pointer"}
      //       onClick={() => handleLineClick(i)}
      //     />
      //   );
      // }


      // Draw text
      const text = renderMarkerText(line.x1, line.y1, line.x2, line.y2, line.length, i)
      rlines.push(text);
    }

    // Draw line between last point and current point if not closed
    if (currentPoint !== null && cutoutPoints.length > 0 && isClosed) {
      const lastPoint = cutoutPoints[cutoutPoints.length - 1];

      rlines.push(
        <line key={cutoutPoints.length}
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
    const perpendicularX = (-dy / length * 4).toFixed(2); // 4 pixels offset
    const perpendicularY = (dx / length * 4).toFixed(2); // 4 pixels offset
    let bevel = null;
    let stroke = ''
    if (line.bevel !== 'none') {
      stroke = line.bevel

      // Draw shadow line for bevel
      if (line.bezierCurvature === 0) {
        bevel = <line
          key={`line-shadow-${stroke}-${index}`}
          className='bevel'
          x1={line.x1 - perpendicularX}
          y1={line.y1 - perpendicularY}
          x2={line.x2 - perpendicularX}
          y2={line.y2 - perpendicularY}
          stroke={stroke}
          strokeWidth={6}
        />
      } else {
        const controlPoint = getBezierControlPoint(
          line.x1 - perpendicularX,
          line.y1 - perpendicularY,
          line.x2 - perpendicularX,
          line.y2 - perpendicularY,
          line.bezierCurvature
        )

        bevel = <path
          key={`path-shadow-${stroke}-${index}`}
          className='bevel'
          d={`M ${line.x1 - perpendicularX} ${line.y1 - perpendicularY} Q ${controlPoint.x} ${controlPoint.y}, ${line.x2 - perpendicularX} ${line.y2 - perpendicularY}`}
          fill={"transparent"}
          stroke={stroke}
          strokeWidth={6}
        />
      }
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

    let pathString = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i <= points.length; i++) {
      const previousPoint = points[i - 1];
      let currentPoint = points[i];
      let line = lines[i - 1];

      if (i === points.length) {
        currentPoint = points[0]
        line = lines[i - 1]
      }

      if (line && line.bezierCurvature !== 0) {
        // Calculate control points for Bezier curve
        const controlPoint = getBezierControlPoint(previousPoint.x, previousPoint.y, currentPoint.x, currentPoint.y, line.bezierCurvature);

        // Append Bezier curve to path string
        pathString += ` Q ${controlPoint.x},${controlPoint.y}, ${currentPoint.x},${currentPoint.y}`;
      } else {
        // Append line to path string
        pathString += ` L ${currentPoint.x},${currentPoint.y}`;
      }
    }

    // Close the path
    pathString += ' Z';

    // Return the path element
    return <path className='polygon' d={pathString} fill={cutoutPoints.length > 0 ? 'rgba(0, 210, 255, .5)' : '#00D2FF'} />;
  };

  const renderCutoutPolygon = () => {
    const cpoints = [...cutoutPoints]
    // cpoints.reverse()
    // console.log(cpoints);
    if (cpoints.length < 3 || !isCutoutClosed) return null;

    let pathString = `M ${cpoints[0].x} ${cpoints[0].y}`;
    for (let i = 1; i <= cpoints.length; i++) {
      const previousPoint = cpoints[i - 1];
      let currentPoint = cpoints[i];
      let line = cutoutLines[i - 1];

      if (i === cpoints.length) {
        currentPoint = cpoints[0]
        line = cutoutLines[i - 1]
      }

      if (line && line.bezierCurvature !== 0) {
        // Calculate control points for Bezier curve
        const controlPoint = getBezierControlPoint(previousPoint.x, previousPoint.y, currentPoint.x, currentPoint.y, line.bezierCurvature);

        // Append Bezier curve to path string
        pathString += ` Q ${controlPoint.x},${controlPoint.y}, ${currentPoint.x},${currentPoint.y}`;
      } else {
        // Append line to path string
        pathString += ` L ${currentPoint.x},${currentPoint.y}`;
      }
    }

    // Close the path
    pathString += ' Z';

    // Return the path element
    return <path className='polygon' d={pathString} fill="rgba(255, 255, 255, .4)" />;
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
        {/* drawing canvas  */}
        <div style={{ overflow: 'scroll', border: '4px dotted #D7DC3C' }}>
          <svg
            ref={svgRef}
            width="960px"
            height="720px"
            style={{
              background: '#fff',
              transform: `scale(${zoomLevel})`, transformOrigin: '480 360'
            }}
            onClick={handlePointClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseOutOfCanvas}
          >
            {renderGrid()}
            {renderPolygon()}
            {renderLines()}
            {renderPoints()}
            {renderCutoutPolygon()}
            {renderCutoutLines()}
            {renderCutoutPoints()}

            {renderCurrentPoint()}
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
        </div>
        {/* drawing canvas  */}
        <div
          width="500px"
          height="720px"
          style={{ border: '4px solid #D7DC3C', background: '#fff', padding: '30px', marginLeft: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left' }}
        >
          <div>
            <h2>Line Metrics</h2>
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
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', marginRight: '20px' }}>Curvature: {selectedLine.bezierCurvature}</span>
                  <input
                    type="range"
                    min={-50}
                    max={50}
                    value={selectedLine.bezierCurvature}
                    onChange={(e) => handleBezierCurvatureChange(selectedLineIndex, parseInt(e.target.value))}
                  />

                </div>
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
            {
              !selectedLine && (
                <p>No line selected.</p>
              )
            }
          </div>
          <div>
            <h3>Drawing Board Setting</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <input
                type="range"
                min={.5}
                max={3}
                step={.1}
                value={zoomLevel}
                onChange={(e) => handleZoom(e)}
              />
              <span>Zoom Scale: {zoomLevel}</span>
            </div>
            <div >
              <input
                type="checkbox"
                checked={magneticSnap}
                onChange={(e) => handleMagneticSnapChange(e.target.checked)}
              />
              <span style={{ marginLeft: '5px' }}>Snap To Grid</span>
            </div>
            <div>
              <h4 style={{ marginBottom: '10px' }}>Active Shape: </h4>
              <input
                type="radio"
                value="freeDrawing"
                checked={activeShape === "freeDrawing"}
                onChange={(e) => handleActiveShapeChange(e.target.value)}
              />
              <span style={{ marginRight: "10px" }}>Free Drawing</span>
              <input
                type="radio"
                value="rectangle"
                checked={activeShape === "rectangle"}
                onChange={(e) => handleActiveShapeChange(e.target.value)}
              />
              <span style={{ marginRight: "10px" }}>Rectangle</span>
              <input
                type="radio"
                value="ushape"
                checked={activeShape === "ushape"}
                onChange={(e) => handleActiveShapeChange(e.target.value)}
              />
              <span style={{ marginRight: "10px" }}>U-Shape</span>
              <input
                type="radio"
                value="lshape"
                checked={activeShape === "lshape"}
                onChange={(e) => handleActiveShapeChange(e.target.value)}
              />
              <span style={{ marginRight: "10px" }}>L-Shape</span>
              <input
                type="radio"
                value="jshape"
                checked={activeShape === "jshape"}
                onChange={(e) => handleActiveShapeChange(e.target.value)}
              />
              <span>J-Shape</span>
            </div>
            <div>
              <h4 style={{ marginBottom: '10px' }}>Tools: </h4>
              <input
                type="radio"
                value="cutout"
                checked={activeTool === 'cutout'}
                disabled={!isClosed}
                onChange={(e) => handleActiveTool(e.target.value)}
              />
              <span style={{ marginRight: "10px" }}>Cutout</span>
              <input
                type="radio"
                value="measure"
                checked={activeTool === 'measure'}
                disabled={!isClosed}
                onChange={(e) => handleActiveTool(e.target.value)}
              />
              <span style={{ marginRight: "10px" }}>Tape Measure</span>
              <input
                type="radio"
                value="seam"
                checked={activeTool === 'seam'}
                disabled={!isClosed}
                onChange={(e) => handleActiveTool(e.target.value)}
              />
              <span style={{ marginRight: "10px" }}>Seam</span>
              <input
                type="radio"
                value="cable"
                checked={activeTool === 'cable'}
                disabled={!isClosed}
                onChange={(e) => handleActiveTool(e.target.value)}
              />
              <span style={{ marginRight: "10px" }}>Cable Cover</span>

            </div>

          </div>
          {/* button for export  */}
          <div>
            <h3 >Action</h3>
            <button onClick={handleResetZoom} style={{ marginRight: '20px' }}>Reset Zoom</button>
            <button onClick={handleUndo} style={{ marginRight: '20px' }}>Undo</button>
            <button onClick={handleClear}>Clear</button>

            <h3 >Export</h3>
            <button style={{ marginRight: '20px' }} onClick={handleExportDxf}>Export as DXF</button>
            <button onClick={handleExportDwg}>Export as DWG</button>
          </div>

        </div>
      </div>
    </div>

  );
}

export default PolygonDrawer;
