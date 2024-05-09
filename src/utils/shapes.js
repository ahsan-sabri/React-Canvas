export const getShapePoints = (value, pixelRatio) => {
  let points = []
  switch (value) {
    case 'rectangle':
      points = rectangle(pixelRatio)
      break;

    case 'ushape':
      points = ushape(pixelRatio)
      break;

    case 'lshape':
      points = lshape(pixelRatio)
      break;

    case 'jshape':
      points = jshape(pixelRatio)
      break;

    default:
      //
      break;
  }

  return points
};

export const rectangle = (pixelRatio) => {
  const points = [
    { x: 60 * pixelRatio, y: 48 * pixelRatio },
    { x: 180 * pixelRatio, y: 48 * pixelRatio },
    { x: 180 * pixelRatio, y: 132 * pixelRatio },
    { x: 60 * pixelRatio, y: 132 * pixelRatio }
  ]
  return points;
};

export const ushape = (pixelRatio) => {
  const points = [
    { x: 60 * pixelRatio, y: 36 * pixelRatio },
    { x: 96 * pixelRatio, y: 36 * pixelRatio },
    { x: 96 * pixelRatio, y: 120 * pixelRatio },
    { x: 144 * pixelRatio, y: 120 * pixelRatio },
    { x: 144 * pixelRatio, y: 36 * pixelRatio },
    { x: 180 * pixelRatio, y: 36 * pixelRatio },
    { x: 180 * pixelRatio, y: 156 * pixelRatio },
    { x: 60 * pixelRatio, y: 156 * pixelRatio }
  ]
  return points;
};

export const lshape = (pixelRatio) => {
  const points = [
    { x: 60 * pixelRatio, y: 36 * pixelRatio },
    { x: 96 * pixelRatio, y: 36 * pixelRatio },
    { x: 96 * pixelRatio, y: 120 * pixelRatio },
    { x: 168 * pixelRatio, y: 120 * pixelRatio },
    { x: 168 * pixelRatio, y: 156 * pixelRatio },
    { x: 60 * pixelRatio, y: 156 * pixelRatio }
  ]
  return points;
};

export const jshape = (pixelRatio) => {
  const points = [
    { x: 144 * pixelRatio, y: 36 * pixelRatio },
    { x: 180 * pixelRatio, y: 36 * pixelRatio },
    { x: 180 * pixelRatio, y: 156 * pixelRatio },
    { x: 72 * pixelRatio, y: 156 * pixelRatio },
    { x: 72 * pixelRatio, y: 120 * pixelRatio },
    { x: 144 * pixelRatio, y: 120 * pixelRatio }
  ]
  return points;
};

