import makerjs from "makerjs";

export const convertSvgToDxf = (svgContent) => {

  // Convert SVG to DXF using Marker.js
  const model = {};
  const inchPerPixel = 4;
  let li = 0;
  let pi = 0;
  let bi = 0;
  let si = 0;

  const lines = getClassMatchElements(svgContent, 'line', 'export');

  if (lines) {
    lines.forEach((line, index) => {
      const x1 = parseFloat(line.getAttribute('x1') / inchPerPixel);
      const y1 = parseFloat(line.getAttribute('y1') / inchPerPixel);
      const x2 = parseFloat(line.getAttribute('x2') / inchPerPixel);
      const y2 = parseFloat(line.getAttribute('y2') / inchPerPixel);
      const point1 = [x1, -y1];
      const point2 = [x2, -y2];

      const newLine = new makerjs.paths.Line(point1, point2);

      const classList = line.getAttribute('class');
      const bevelClassMatch = classList && classList.includes('bevel');
      const seamClassMatch = classList && classList.includes('seam-line');

      // add layer
      if (bevelClassMatch) {
        bi++;
        const stroke = line.getAttribute('stroke')
        // newLine.layer = stroke;
        newLine.layer = stroke + '-bevel-' + bi;
      }
      else if (seamClassMatch) {
        si++;
        newLine.layer = 'seam-' + si;
      }
      else {
        li++;
        newLine.layer = 'line-' + li
      }

      //add to model
      makerjs.model.addPath(model, newLine, "line")
    });
  }

  const paths = getClassMatchElements(svgContent, 'path', 'export');

  if (paths) {
    paths.forEach((path, index) => {
      const d = path.getAttribute('d');
      const match = d.match(/M\s*([\d.]+)\s+([\d.]+)\s*Q\s*([\d.]+)\s+([\d.]+)\s*,\s*([\d.]+)\s+([\d.]+)/);

      if (!match) {
        return
      }

      const point1 = [parseFloat(match[1]) / inchPerPixel, - parseFloat(match[2] / inchPerPixel)];
      const controlPoint = [parseFloat(match[3]) / inchPerPixel, - parseFloat(match[4]) / inchPerPixel];
      const point2 = [parseFloat(match[5]) / inchPerPixel, - parseFloat(match[6]) / inchPerPixel];
      const points = [point1, controlPoint, point2];

      const newPath = new makerjs.models.BezierCurve(points, .01);

      const classList = path.getAttribute('class');
      const bevelClassMatch = classList && classList.includes('bevel');

      // add layer
      if (bevelClassMatch) {
        bi++;
        const stroke = path.getAttribute('stroke')
        // newPath.layer = stroke;
        newPath.layer = stroke + '-bevel-' + bi;
      }
      else {
        pi++;
        newPath.layer = 'path-' + pi
      }

      // add to model
      makerjs.model.addModel(model, newPath, "bezier-seed")

    });
  }

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

export const getClassMatchElements = (source, tag, className) => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = source;

  // Query for all elements with class containing "export"
  const exportLineElements = tempDiv.querySelectorAll(`${tag}[class*="${className}"]`);

  // Convert NodeList to Array for easier manipulation
  return Array.from(exportLineElements);
} 