import makerjs from "makerjs";

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

export const convertSvgToDxf = (svgContent) => {

  // Convert SVG to DXF using Marker.js
  const model = {};
  const inchPerPixel = 4;
  let li = 0;
  // let bi = 0;

  // // Extract lines
  const lines = svgContent.match(/<line(?!.*\bclass\s*=\s*["']?\bgrid-line\b).*?<\/line>/g);

  lines.forEach((line, index) => {
    const x1 = parseFloat(line.match(/x1="([\d.]+)"/)[1] / inchPerPixel);
    const y1 = parseFloat(line.match(/y1="([\d.]+)"/)[1] / inchPerPixel);
    const x2 = parseFloat(line.match(/x2="([\d.]+)"/)[1] / inchPerPixel);
    const y2 = parseFloat(line.match(/y2="([\d.]+)"/)[1] / inchPerPixel);
    const point1 = [x1, -y1];
    const point2 = [x2, -y2];

    const newLine = new makerjs.paths.Line(point1, point2);

    const classMatch = line.match(/class="([^"]+)"/);
    const className = classMatch ? classMatch[1] : '';

    // add layer
    if (className === 'bevel') {
      // bi++;
      const strokeMatch = line.match(/stroke="([^"]+)"/);
      const stroke = strokeMatch ? strokeMatch[1] : 'black';
      // newLine.layer = 'bevel-' + bi;
      newLine.layer = stroke;
    }
    else {
      li++;
      newLine.layer = 'line-' + li
    }

    // add to model
    makerjs.model.addPath(model, newLine, "line")
  });

  return makerjs.exporter.toDXF(model);
}

export const convertSvgToDwg = async (svgContent) => {
  // Convert SVG to DXF
  const dxfContent = convertSvgToDxf(svgContent);

  // Create a Blob object with the DXF content
  const blob = new Blob([dxfContent], { type: "application/dxf" });

  // Create FormData object
  const formData = new FormData();
  formData.append('file', blob, 'drawing.dxf');

  // Send the file to the Node.js API
  try {
    const response = await fetch('http://localhost:3001/convert', {
      method: 'POST',
      body: formData,
      mode: 'cors', // Enable CORS
    });

    if (!response.ok) {
      throw new Error('Failed to convert file');
    }

    // Parse the response JSON
    const data = await response.json();

    // Return the URL of the converted file
    const downloadLink = document.createElement('a');
    downloadLink.href = data.downloadUrl;
    downloadLink.download = 'drawing.dwg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

  } catch (error) {
    console.error('Error converting file:', error);
    alert('Export failed!')
    // throw error;
  }
}