export const getNewCoordinateOnLineLengthChange = (linesArray, index, newLength) => {

  // newLength = 120
  const line = linesArray[index]
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

export const getBezierControlPoint = (x1, y1, x2, y2, curvature) => {
  // Calculate midpoint
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  // Calculate angle
  const angle = Math.atan2(y2 - y1, x2 - x1);

  // Calculate distance from midpoint to control point based on curvature
  const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / 2 * (-curvature / 100);

  // Calculate control point coordinates
  const controlX = midX + distance * Math.cos(angle + Math.PI / 2);
  const controlY = midY + distance * Math.sin(angle + Math.PI / 2);

  return { x: controlX.toFixed(2), y: controlY.toFixed(2) };
}

export const drawLineFromPoints = (linesArray, point1, point2, index, isClosedFlag) => {
  if (!point1 || !point2) return null;

  const line = linesArray[index]

  const newLine = {
    x1: Math.round(point1.x),
    y1: Math.round(point1.y),
    x2: Math.round(point2.x),
    y2: Math.round(point2.y),
    length: Math.round(Math.sqrt((point2.x - point1.x) ** 2 + (point2.y - point1.y) ** 2)),
    bevel: line ? line.bevel : 'none',
    bezierCurvature: isClosedFlag && line ? line.bezierCurvature : 0,
  };

  return newLine;
}

export const drawPolygonPath = (linesArray, pointsArray, setLinesArray, isClosedFlag) => {
  if (pointsArray.length <= 2) return;

  const firstPoint = pointsArray[0];
  const newline = drawLineFromPoints(linesArray, pointsArray[pointsArray.length - 1], firstPoint, pointsArray.length - 1, isClosedFlag);

  if (newline) {
    setLinesArray([...linesArray, newline]);
  }
  isClosedFlag(true);
};