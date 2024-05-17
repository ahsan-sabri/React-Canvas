import React, { useState, useRef, useEffect } from 'react';
import { saveAs } from 'file-saver';
import MeasuringLine from './MeasuringLine';
import { getSvgPosition, checkCurrentPointInsideShape } from '../utils/canvas';
import { getBezierControlPoint, drawLineFromPoints, getNewCoordinateOnLineLengthChange, drawPolygonPath } from '../utils/line';
import { convertSvgToDxf, convertSvgToDwg } from '../utils/export';
import { getShapePoints } from '../utils/shapes';
import { GRID_SPACING, PIXEL_PER_INCH } from '../utils/constant';

function PolygonDrawer() {
  const svgRef = useRef(null);
  const [activeShape, setActiveShape] = useState('freeDrawing');
  const [activeTool, setActiveTool] = useState(null);
  const [magneticSnap, setMagneticSnap] = useState(true);
  const [points, setPoints] = useState([]);
  const [cutoutPoints, setCutoutPoints] = useState([]);
  const [seamPoints, setSeamPoints] = useState([]);
  const [measurePoints, setMeasurePoints] = useState([]);
  const [lines, setLines] = useState([]);
  const [cutoutLines, setCutoutLines] = useState([]);
  const [seamLines, setSeamLines] = useState([]);
  const [measureLines, setMeasureLines] = useState([]);
  const [currentPoint, setCurrentPoint] = useState(null);
  const [selectedLineIndex, setSelectedLineIndex] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);
  const [dragPointIndex, setDragPointIndex] = useState(null);
  const [pointerTarget, setPointerTarget] = useState(null);
  const [isDragged, setIsDragged] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [isCutoutClosed, setIsCutoutClosed] = useState(false);
  const [hoverFirstPoint, setHoverFirstPoint] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(.8);
  const [actionHistory, setActionHistory] = useState([]);

  useEffect(() => {

    // update selected lline on change line index
    const updateSelectedLine = (newIndex, target) => {
      const linesArray = target === 'shape' ? lines : cutoutLines
      const newSelectedLine = linesArray[newIndex];
      if (newSelectedLine) {
        setSelectedLine(newSelectedLine);
      }
      else {
        setSelectedLine(null);
      }
    };

    updateSelectedLine(selectedLineIndex, pointerTarget)

    // if points and lines are not same then draw the closing line
    if (isClosed && points.length !== lines.length) {
      const updatedLines = [...lines]
      const newLine = drawLineFromPoints(lines, points[points.length - 1], points[0], points.length - 1);
      updatedLines.push(newLine);
      setLines(updatedLines)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClosed, lines, points, selectedLineIndex, pointerTarget]);

  // // COMPONENT FUNCTIONS ======================>>

  const updatePointsAndLines = (updatedPoints, lineArray, setPointArray, setLineArray) => {
    // set points
    setPointArray(updatedPoints)
    // draw lines
    updateLinesAfterPointsUpdate(updatedPoints, lineArray, setLineArray)
  }

  const drawReadyShape = (value) => {
    // get shape points for selected shape 
    const shapePoints = getShapePoints(value, PIXEL_PER_INCH)
    // create points and lines
    updatePointsAndLines(shapePoints, lines, setPoints, setLines)
  }

  const drawRenderLines = (rlines, lineArray, target) => {
    for (let i = 0; i < lineArray.length; i++) {
      const line = lineArray[i];
      const isSelected = selectedLineIndex === i && target === pointerTarget;

      // Draw main line
      if (line.bezierCurvature === 0) {
        rlines.push(
          <line key={`${target}-line-${i}`}
            className={`line export ${target}-line`}
            x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
            stroke={isSelected ? '#ff0000' : 'black'}
            strokeWidth={isSelected ? 6 : 4}
            cursor={"pointer"}
            onClick={() => handleLineClick(i, target)}
          />
        );
      }
      else {
        const controlPoint = getBezierControlPoint(line.x1, line.y1, line.x2, line.y2, line.bezierCurvature)
        rlines.push(
          <path key={`${target}-line-${i}`}
            className={`path export ${target}-path`}
            d={`M ${line.x1} ${line.y1} Q ${controlPoint.x} ${controlPoint.y}, ${line.x2} ${line.y2}`}
            stroke={isSelected ? '#ff0000' : 'black'}
            fill={"transparent"}
            strokeWidth={isSelected ? 6 : 4}
            cursor={"pointer"}
            onClick={() => handleLineClick(i, target)}
          />
        );
      }

      // draw bevel 
      const bevel = renderBevel(line, i)
      if (bevel) {
        rlines.push(bevel)
      }

      // Draw text
      const text = renderMarkerText(line.x1, line.y1, line.x2, line.y2, line.length, i, target)
      rlines.push(text);
    }
  }

  const updateLinesAfterPointsUpdate = (updatedPoints, lineArray, setLineArray) => {
    const updatedLines = [];
    for (let i = 0; i < updatedPoints.length - 1; i++) {
      const newLine = drawLineFromPoints(lineArray, updatedPoints[i], updatedPoints[i + 1], i, isClosed);
      updatedLines.push(newLine);
    }

    // Add line between last and first point for closed polygon
    if (isClosed && updatedPoints.length > 2) {
      const newLine = drawLineFromPoints(lineArray, updatedPoints[updatedPoints.length - 1], updatedPoints[0], updatedPoints.length - 1, isClosed);
      updatedLines.push(newLine);
    }

    // update lines 
    setLineArray(updatedLines);
    setSelectedLine(lineArray[selectedLineIndex]);
  }

  // Function to add an action to history
  const addActionToHistory = (action) => {
    let prevHistory = [...actionHistory]
    prevHistory.push(action)
    setActionHistory(prevHistory);
  };

  // // DOM INTERACTION FUNCTION ============================>>

  const handleActiveShapeChange = (value) => {
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

  const handleLineClick = (index, target) => {
    setPointerTarget(target)
    setSelectedLineIndex(index);
  };

  const handlePointClick = (event) => {
    const svgPos = getSvgPosition(event, zoomLevel, magneticSnap, activeTool);
    const newPoint = svgPos;

    if (isClosed) {
      if (event.target.tagName === 'svg') {
        setSelectedLineIndex(null)
        setSelectedLine(null)
      }

      if (activeTool) {
        // check the point in inside shape polygon
        const isInsideShape = checkCurrentPointInsideShape(svgPos)
        if (isInsideShape) {
          switch (activeTool) {
            case 'cutout':
              // if cutout close then return 
              if (isCutoutClosed) return

              // check first point hover to close cutout 
              if (hoverFirstPoint) {
                drawPolygonPath(cutoutLines, cutoutPoints, setCutoutLines, setIsCutoutClosed)
                setActiveTool(null)
                setCurrentPoint(null);
                addActionToHistory({ type: 'closeCutoutPolygon' });

                return;
              }

              // set new point 
              setCutoutPoints([...cutoutPoints, newPoint]);
              addActionToHistory({ type: 'addCutoutPoint', point: newPoint })


              //draw line
              const newline = drawLineFromPoints(cutoutLines, cutoutPoints[cutoutPoints.length - 1], newPoint, cutoutPoints.length - 1, isCutoutClosed)
              if (newline) {
                setCutoutLines([...cutoutLines, newline]);
              }
              break;

            case 'seam':
              // set new point 
              setSeamPoints([...seamPoints, newPoint]);
              addActionToHistory({ type: 'addSeamPoint', point: newPoint })

              //draw line
              if (seamPoints.length % 2) {
                const newSeamline = drawLineFromPoints(seamLines, seamPoints[seamPoints.length - 1], newPoint, seamPoints.length - 2, isCutoutClosed)
                if (newSeamline) {
                  setSeamLines([...seamLines, newSeamline]);
                }
              }

              break;

            case 'measure':
              // set new point 
              setMeasurePoints([...measurePoints, newPoint]);
              addActionToHistory({ type: 'addMeasurePoint', point: newPoint })

              //draw line
              if (measurePoints.length % 2) {
                const newMeasureline = drawLineFromPoints(measureLines, measurePoints[measurePoints.length - 1], newPoint, measurePoints.length - 2, isCutoutClosed)
                if (newMeasureline) {
                  setMeasureLines([...measureLines, newMeasureline]);
                }
              }

              break;

            default:
              break;
          }
        }
      }

      return;
    }

    if (hoverFirstPoint) {
      drawPolygonPath(lines, points, setLines, setIsClosed)
      setCurrentPoint(null);
      addActionToHistory({ type: 'closePolygon' })

      return;
    }

    // set new point

    setPoints([...points, newPoint]);
    addActionToHistory({ type: 'addPoint', point: newPoint })

    //draw line
    const newline = drawLineFromPoints(lines, points[points.length - 1], newPoint, points.length - 1, isClosed)
    if (newline) {
      setLines([...lines, newline]);
    }
  };

  const handleDragging = (svgPos, pointsArray, setPointsArray, linesArray, setLinesArray) => {
    if (isDragged) {
      const updatedPoints = [...pointsArray];
      updatedPoints[dragPointIndex] = svgPos;
      updatePointsAndLines(updatedPoints, linesArray, setPointsArray, setLinesArray);
    }
  };

  const handleMouseMove = (event) => {
    // get mouse position on svg 
    const svgPos = getSvgPosition(event, zoomLevel, magneticSnap, activeTool);

    // check shape is closed 
    if (isClosed) {
      // check cutout is closed 
      if (isCutoutClosed && pointerTarget === 'cutout') {
        // drag points for closed cutout 
        handleDragging(svgPos, cutoutPoints, setCutoutPoints, cutoutLines, setCutoutLines)
        return
      }

      // check tool is active
      if (activeTool) {
        // move point with mouse move if not closed 
        setCurrentPoint(svgPos);
        // if mouse is near the initial point then suggest to close cutout polygon 
        const withinRadius = cutoutPoints.length > 0 && Math.abs(cutoutPoints[0].x - svgPos.x) < 15 && Math.abs(cutoutPoints[0].y - svgPos.y) < 15;
        setHoverFirstPoint(withinRadius);
      }

      // if tool is not active then move the shape points 
      handleDragging(svgPos, points, setPoints, lines, setLines)
      return
    }

    // if shape is not closed then move the drawing point 
    setCurrentPoint(svgPos);

    // if mouse is near the initial point then suggest to close polygon
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

  const handlePointDrag = (index, point, target) => {
    // add history 
    const oldPoint = { ...point }
    if (!dragPointIndex) {
      if (target === 'shape') {
        addActionToHistory({ type: 'movePoint', index: index, point: oldPoint })
      }
      else {
        addActionToHistory({ type: 'moveCutoutPoint', index: index, point: oldPoint })
      }
    }

    // set Drag faetures 
    setIsDragged(true)
    setPointerTarget(target)
    setDragPointIndex(index)
  }

  const handlePointDragEnd = (event) => {
    setIsDragged(false)
    setPointerTarget(null)
    setDragPointIndex(null)
  }

  const handleMouseEnterFirstPoint = () => {
    setHoverFirstPoint(true);
  };

  const handleMouseLeaveFirstPoint = () => {
    setHoverFirstPoint(false);
  };

  const handleLineLengthChange = (index, newLength) => {
    const pointArray = pointerTarget === 'shape' ? points : cutoutPoints
    const lineArray = pointerTarget === 'shape' ? lines : cutoutLines
    const setPointArray = pointerTarget === 'shape' ? setPoints : setCutoutPoints
    const setLineArray = pointerTarget === 'shape' ? setLines : setCutoutLines

    // get points indexes 
    let firstPointIndex = selectedLineIndex
    let lastPointIndex = selectedLineIndex + 1
    if (selectedLineIndex === lineArray.length - 1) {
      firstPointIndex = selectedLineIndex
      lastPointIndex = 0
    }

    const updatedPoints = [...pointArray];
    const newCord = getNewCoordinateOnLineLengthChange(lineArray, index, newLength);

    updatedPoints[firstPointIndex].x = newCord.x1
    updatedPoints[firstPointIndex].y = newCord.y1
    updatedPoints[lastPointIndex].x = newCord.x2
    updatedPoints[lastPointIndex].y = newCord.y2

    updatePointsAndLines(updatedPoints, lineArray, setPointArray, setLineArray)
  };

  // Update the handleBezierCurvatureChange function
  const handleBezierCurvatureChange = (index, value) => {
    const lineArray = pointerTarget === 'shape' ? lines : cutoutLines
    const setLineArray = pointerTarget === 'shape' ? setLines : setCutoutLines
    const updatedLines = [...lineArray];
    updatedLines[index].bezierCurvature = value;
    setLineArray(updatedLines);
  };

  const handleBevelChange = (index, value) => {
    const lineArray = pointerTarget === 'shape' ? lines : cutoutLines;
    const setLineArray = pointerTarget === 'shape' ? setLines : setCutoutLines;
    const updatedLines = [...lineArray]
    updatedLines[index].bevel = value
    setLineArray(updatedLines);
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
        updatePointsAndLines(updatedPoints, lines, setPoints, setLines)
        break;
      case 'movePoint':
        console.log(lastAction);
        const movedPoint = lastAction.point
        const newPoints = [...points]
        newPoints[lastAction.index] = movedPoint;
        updatePointsAndLines(newPoints, lines, setPoints, setLines)
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
    setSeamPoints([])
    setMeasurePoints([])
    setLines([])
    setCutoutLines([])
    setSeamLines([])
    setMeasureLines([])
    setSelectedLineIndex(null)
    setActionHistory([])
    setZoomLevel(.8)
    setActiveShape('freeDrawing')
  }

  const handleResetZoom = () => {
    setZoomLevel(.8)
  }

  // // RENDER FUNCTIONS =======================>>

  // render current point
  const renderCurrentPoint = () => {
    if (currentPoint) {
      if (activeTool === 'seam' || activeTool === 'measure') {
        return (
          <g>
            <line
              x1={currentPoint.x - 6}
              y1={currentPoint.y - 6}
              x2={currentPoint.x + 6}
              y2={currentPoint.y + 6}
              stroke="grey"
              strokeWidth={2}
            />
            <line
              x1={currentPoint.x + 6}
              y1={currentPoint.y - 6}
              x2={currentPoint.x - 6}
              y2={currentPoint.y + 6}
              stroke="grey"
              strokeWidth={2}
            />
          </g>
        );
      } else {
        return (
          <circle
            id="currentPoint"
            cx={currentPoint.x}
            cy={currentPoint.y}
            r={8}
            fill="transparent"
            stroke="#bed929"
            strokeWidth={4}
          />
        );
      }
    }
    return null;
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

  const renderPoints = () => {
    return points.map((point, index) => (
      <circle key={index}
        cx={point.x}
        cy={point.y}
        r={index === 0 && hoverFirstPoint && !isClosed ? 15 : 10}
        fill="#bed929"
        cursor={"move"}
        onMouseDown={() => handlePointDrag(index, point, 'shape')}
      />
    ));
  };

  const renderCutoutPoints = () => {
    return cutoutPoints.map((cpoint, index) => (
      <circle key={`cutout-point-${index}`}
        cx={cpoint.x}
        cy={cpoint.y}
        r={index === 0 && hoverFirstPoint && !isCutoutClosed ? 15 : 10}
        fill="#bed929"
        cursor={"move"}
        onMouseDown={() => handlePointDrag(index, cpoint, 'cutout')}
      />
    ));
  };

  const renderLines = () => {
    const rlines = [];

    // Draw lines between consecutive points
    drawRenderLines(rlines, lines, 'shape');

    // Draw line between last point and current point if not closed
    if (currentPoint && points.length > 0 && !isClosed) {
      const lastPoint = points[points.length - 1];

      rlines.push(
        <line key={`shape-line-${points.length}`}
          x1={lastPoint.x} y1={lastPoint.y} x2={currentPoint.x} y2={currentPoint.y}
          stroke={'black'}
          strokeWidth={4}
        />
      );

      // Calculate text position
      const length = Math.round(Math.sqrt((currentPoint.x - lastPoint.x) ** 2 + (currentPoint.y - lastPoint.y) ** 2))
      const text = renderMarkerText(lastPoint.x, lastPoint.y, currentPoint.x, currentPoint.y, length, points.length, 'shape')
      rlines.push(text);
    }

    return rlines;
  };


  const renderCutoutLines = () => {
    const rlines = [];

    // Draw cutout lines between consecutive points
    drawRenderLines(rlines, cutoutLines, 'cutout')

    // Draw line between last point and current point if not closed
    if (currentPoint && cutoutPoints.length > 0 && !isCutoutClosed) {
      const lastPoint = cutoutPoints[cutoutPoints.length - 1];

      rlines.push(
        <line key={`shape-line-${cutoutPoints.length}`}
          x1={lastPoint.x} y1={lastPoint.y} x2={currentPoint.x} y2={currentPoint.y}
          stroke={'black'}
          strokeWidth={4}
        />
      );

      // Calculate text position
      const length = Math.round(Math.sqrt((currentPoint.x - lastPoint.x) ** 2 + (currentPoint.y - lastPoint.y) ** 2))
      const text = renderMarkerText(lastPoint.x, lastPoint.y, currentPoint.x, currentPoint.y, length, points.length, 'cutout')
      rlines.push(text);
    }

    return rlines;
  };

  const renderSeamLines = () => {
    const rlines = [];

    // Draw seam lines between consecutive points
    for (let i = 0; i < seamLines.length; i++) {
      const line = seamLines[i];

      // Draw main line
      rlines.push(
        <line key={`seam-line-${i}`}
          className='line export seam-line'
          x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
          stroke={'grey'}
          strokeWidth={3}
          strokeDasharray={[7, 7]}
        />
      );
    }

    // Draw line between last point and current point if not closed
    if (currentPoint && seamPoints.length % 2 !== 0) {
      const lastPoint = seamPoints[seamPoints.length - 1];

      rlines.push(
        <line key={`seam-${seamPoints.length}`}
          x1={lastPoint.x} y1={lastPoint.y} x2={currentPoint.x} y2={currentPoint.y}
          stroke={'grey'}
          strokeWidth={4}
          strokeDasharray={[7, 7]}
        />
      );
    }

    return rlines;
  };

  const renderMeasureLines = () => {
    const rlines = [];

    // Draw seam lines between consecutive points
    for (let i = 0; i < measureLines.length; i++) {
      const line = measureLines[i];

      // Draw main line
      rlines.push(
        <MeasuringLine key={`measure-line-${i}`}
          x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
        // stroke={'grey'}
        // strokeWidth={3}
        />
      );
    }

    // Draw line between last point and current point if not closed
    if (currentPoint && measurePoints.length % 2 !== 0) {
      const lastPoint = measurePoints[measurePoints.length - 1];

      rlines.push(
        <MeasuringLine key={`measure-${measurePoints.length}`}
          x1={lastPoint.x} y1={lastPoint.y} x2={currentPoint.x} y2={currentPoint.y}
        // stroke={'grey'}
        // strokeWidth={4}
        />
      );
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
          className='line export bevel'
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
          className='path export bevel'
          d={`M ${line.x1 - perpendicularX} ${line.y1 - perpendicularY} Q ${controlPoint.x} ${controlPoint.y}, ${line.x2 - perpendicularX} ${line.y2 - perpendicularY}`}
          fill={"transparent"}
          stroke={stroke}
          strokeWidth={6}
        />
      }
    }

    return bevel;
  }

  const renderMarkerText = (x1, y1, x2, y2, lineLength, index, target) => {
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
    return <text key={`${target}-text-${index}`}
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
    return <path id="shapePolygon" className='polygon' d={pathString} fill={cutoutPoints.length > 0 ? 'rgba(0, 210, 255, .7)' : '#00D2FF'} />;
  };

  const renderCutoutPolygon = () => {
    const cpoints = [...cutoutPoints]
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
    return <path className='polygon' d={pathString} fill="rgba(255, 255, 255, .8)" />;
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
            {renderSeamLines()}
            {renderMeasureLines()}
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
            {hoverFirstPoint && !isCutoutClosed && (
              <circle
                cx={points.length > 0 ? points[0].x : 0}
                cy={points.length > 0 ? points[0].y : 0}
                r="10"
                fill="#dfe561"
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
                value=""
                checked={!activeTool}
                disabled={!isClosed}
                onChange={(e) => handleActiveTool(null)}
              />
              <span style={{ marginRight: "10px" }}>None</span>
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
              {/* <input
                type="radio"
                value="cable"
                checked={activeTool === 'cable'}
                disabled={!isClosed}
                onChange={(e) => handleActiveTool(e.target.value)}
              />
              <span style={{ marginRight: "10px" }}>Cable Cover</span> */}

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
