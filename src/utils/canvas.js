import { GRID_SPACING } from './constant';

export const getAvaragePoint = (points) => {
  let totalX = 0;
  let totalY = 0;
  for (let i = 0; i < points.length; i += 2) {
    totalX += points[i];
    totalY += points[i + 1];
  }
  return {
    x: totalX / (points.length / 2),
    y: totalY / (points.length / 2),
  };
};

export const getDistance = (node1, node2) => {
  let diffX = Math.abs(node1[0] - node2[0]);
  let diffY = Math.abs(node1[1] - node2[1]);
  const distaneInPixel = Math.sqrt(diffX * diffX + diffY * diffY);
  return Number.parseFloat(distaneInPixel).toFixed(2);
};

export const dragBoundFunc = (stageWidth, stageHeight, vertexRadius, pos) => {
  let x = pos.x;
  let y = pos.y;
  if (pos.x + vertexRadius > stageWidth) x = stageWidth;
  if (pos.x - vertexRadius < 0) x = 0;
  if (pos.y + vertexRadius > stageHeight) y = stageHeight;
  if (pos.y - vertexRadius < 0) y = 0;
  return { x, y };
};

export const minMax = (points) => {
  return points.reduce((acc, val) => {
    acc[0] = acc[0] === undefined || val < acc[0] ? val : acc[0];
    acc[1] = acc[1] === undefined || val > acc[1] ? val : acc[1];
    return acc;
  }, []);
};

// Function to calculate distance between two points
export const distance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function distanceToLineSegment(x, y, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);

  if (t <= 0) {
    return Math.sqrt((x - x1) ** 2 + (y - y1) ** 2);
  } else if (t >= 1) {
    return Math.sqrt((x - x2) ** 2 + (y - y2) ** 2);
  } else {
    const nearestX = x1 + t * dx;
    const nearestY = y1 + t * dy;
    return Math.sqrt((x - nearestX) ** 2 + (y - nearestY) ** 2);
  }
}

export const getSvgPosition = (event, zoomLevel, magneticSnap, activeTool) => {
  const svgRect = event.currentTarget.getBoundingClientRect();
  let x = (event.clientX - svgRect.left) / zoomLevel;
  let y = (event.clientY - svgRect.top) / zoomLevel;

  // magnietic snap point for nearest intersection
  if (magneticSnap) {
    const nearestX = Math.round(x / GRID_SPACING) * GRID_SPACING;
    const nearestY = Math.round(y / GRID_SPACING) * GRID_SPACING;

    x = nearestX
    y = nearestY
  }

  // seam points on the line only if active tool is seam 
  if (activeTool === 'seam' || activeTool === 'measure') {
    const lines = document.getElementsByClassName('line');
    const nearestPoint = findNearestPointOnLines(lines, { x, y });

    x = nearestPoint.x
    y = nearestPoint.y
  }

  return { x, y }
}

export const checkCurrentPointInsideShape = (point) => {
  const shapePolygon = document.getElementById('shapePolygon')
  return shapePolygon.isPointInFill(point)
}

// Function to find the nearest point on the lines from a given point
function findNearestPointOnLines(lines, point) {
  let nearestPoint;
  let minDistance = Infinity;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const x1 = parseFloat(line.getAttribute('x1'));
    const y1 = parseFloat(line.getAttribute('y1'));
    const x2 = parseFloat(line.getAttribute('x2'));
    const y2 = parseFloat(line.getAttribute('y2'));

    // Calculate the distance from the point to the line segment
    const dist = distanceToLineSegment(point.x, point.y, x1, y1, x2, y2);

    // Update nearest point if the current distance is smaller
    if (dist < minDistance) {
      minDistance = dist;
      const t = ((point.x - x1) * (x2 - x1) + (point.y - y1) * (y2 - y1)) /
        ((x2 - x1) ** 2 + (y2 - y1) ** 2);
      nearestPoint = {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1)
      };
    }
  }

  return nearestPoint;
}