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

export const getSvgPosition = (event, zoomLevel, magneticSnap) => {
  const svgRect = event.currentTarget.getBoundingClientRect();
  let x = (event.clientX - svgRect.left) / zoomLevel;
  let y = (event.clientY - svgRect.top) / zoomLevel;

  // magnietic snap point for nearest intersection
  if (magneticSnap) {
    const nearestX = Math.round(x / GRID_SPACING) * GRID_SPACING;
    const nearestY = Math.round(y / GRID_SPACING) * GRID_SPACING;

    return { x: nearestX, y: nearestY }
  }

  return { x, y }
}

export const checkCurrentPointInsideShape = (point) => {
  const shapePolygon = document.getElementById('shapePolygon')
  return shapePolygon.isPointInFill(point)
}