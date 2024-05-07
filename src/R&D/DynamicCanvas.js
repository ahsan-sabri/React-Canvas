import React, { useRef, useState, useEffect } from 'react';

const SketchApp = () => {
  const canvasRef = useRef(null);
  const [prevMouseX, setPrevMouseX] = useState(0);
  const [prevMouseY, setPrevMouseY] = useState(0);
  const [snapshot, setSnapshot] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedTool, setSelectedTool] = useState('brush');
  const [brushWidth, setBrushWidth] = useState(5);
  // const [fillColor, setFillColor] = useState(true);
  const [selectedColor, setSelectedColor] = useState('#000');

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const setCanvasBackground = () => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = selectedColor;
    };

    const startDraw = (e) => {
      setIsDrawing(true);
      setPrevMouseX(e.offsetX);
      setPrevMouseY(e.offsetY);
      ctx.beginPath();
      ctx.lineWidth = brushWidth;
      ctx.strokeStyle = selectedColor;
      ctx.fillStyle = selectedColor;
      setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };

    const drawing = (e) => {
      if (!isDrawing) return;
      ctx.putImageData(snapshot, 0, 0);

      if (selectedTool === "brush" || selectedTool === "pencil" || selectedTool === "eraser") {
        ctx.strokeStyle = selectedTool === "eraser" ? "#fff" : selectedColor;
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
      } else if (selectedTool === "rectangle") {
        drawRect(e);
      } else if (selectedTool === "circle") {
        drawCircle(e);
      } else if (selectedTool === "triangle") {
        drawTriangle(e);
      } else if (selectedTool === "square") {
        drawSquare(e);
      } else if (selectedTool === "hexagon") {
        drawHexagon(e);
      } else if (selectedTool === "pentagon") {
        drawPentagon(e);
      } else if (selectedTool === "line") {
        drawLine(e);
      } else if (selectedTool === "arrow") {
        drawArrow(e);
      } else if (selectedTool === "curve") {
        // drawCurve(e);
      } else {
        drawPencil(e);
      }
    };

    const drawRect = (e) => {
      if (!fillColor.checked) {
        const width = prevMouseX - e.offsetX;
        const height = prevMouseY - e.offsetY;
        ctx.strokeRect(e.offsetX, e.offsetY, width, height);
      } else {
        const width = prevMouseX - e.offsetX;
        const height = prevMouseY - e.offsetY;
        ctx.fillRect(e.offsetX, e.offsetY, width, height);
      }
    };

    const drawCircle = (e) => {
      ctx.beginPath();
      const radius = Math.sqrt(Math.pow((prevMouseX - e.offsetX), 2) + Math.pow((prevMouseY - e.offsetY), 2));
      ctx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI);
      fillColor.checked ? ctx.fill() : ctx.stroke();
    };

    const drawTriangle = (e) => {
      ctx.beginPath();
      ctx.moveTo(prevMouseX, prevMouseY);
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.lineTo(prevMouseX * 2 - e.offsetX, e.offsetY);
      ctx.closePath();
      fillColor.checked ? ctx.fill() : ctx.stroke();
    };

    const drawSquare = (e) => {
      const sideLength = Math.abs(prevMouseX - e.offsetX);
      ctx.beginPath();
      ctx.rect(e.offsetX, e.offsetY, sideLength, sideLength);
      fillColor.checked ? ctx.fill() : ctx.stroke();
    };

    const drawHexagon = (e) => {
      const sideLength = Math.abs(prevMouseX - e.offsetX);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (2 * Math.PI / 6) * i;
        const x = e.offsetX + sideLength * Math.cos(angle);
        const y = e.offsetY + sideLength * Math.sin(angle);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      fillColor.checked ? ctx.fill() : ctx.stroke();
    };

    const drawPentagon = (e) => {
      const sideLength = Math.abs(prevMouseX - e.offsetX);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (2 * Math.PI / 5) * i - Math.PI / 2;
        const x = e.offsetX + sideLength * Math.cos(angle);
        const y = e.offsetY + sideLength * Math.sin(angle);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      fillColor.checked ? ctx.fill() : ctx.stroke();
    };

    const drawLine = (e) => {
      ctx.beginPath();
      ctx.moveTo(prevMouseX, prevMouseY);
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
    };

    const drawArrow = (e) => {
      const headLength = 10;
      const angle = Math.atan2(e.offsetY - prevMouseY, e.offsetX - prevMouseX);
      ctx.beginPath();
      ctx.moveTo(prevMouseX, prevMouseY);
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();

      // Draw arrowhead
      ctx.beginPath();
      ctx.moveTo(e.offsetX - headLength * Math.cos(angle - Math.PI / 6), e.offsetY - headLength * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.lineTo(e.offsetX - headLength * Math.cos(angle + Math.PI / 6), e.offsetY - headLength * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    };

    const drawPencil = (e) => {
      console.log(e);
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
    }

    const endDraw = () => {
      setIsDrawing(false);
      setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    setCanvasBackground();

    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", drawing);
    canvas.addEventListener("mouseup", endDraw);

    return () => {
      canvas.removeEventListener("mousedown", startDraw);
      canvas.removeEventListener("mousemove", drawing);
      canvas.removeEventListener("mouseup", endDraw);
    };
  }, [isDrawing, snapshot, selectedColor, fillColor, brushWidth, selectedTool, prevMouseX, prevMouseY]);

  const handleToolSelection = (tool) => {
    setSelectedTool(tool);
  };

  const handleBrushWidthChange = (value) => {
    setBrushWidth(value);
  };

  // const handleFillColorChange = (e) => {
  //   setFillColor(e.target.checked);
  // };

  return (
    <div className="container">
      <section className="tools-board">
        {/* Tool options */}
        <div className="row">
          <label className="title"><strong>Tools</strong></label>
          <ul className="options">
            <li className="option tool" id="pencil" onClick={() => handleToolSelection('pencil')}>
              <i className="fas fa-pencil" id="icon"></i>
              <span>Pencil</span>
            </li>
            <li className="option tool" id="brush" onClick={() => handleToolSelection('brush')}>
              <i className="fas fa-brush" id="icon"></i>
              <span>Brush</span>
            </li>
            <li className="option tool" id="eraser" onClick={() => handleToolSelection('eraser')}>
              <i className="fas fa-eraser" id="icon"></i>
              <span>Eraser</span>
            </li>
          </ul>
        </div>

        {/* Color options */}
        <div className="row colors">
          <label className="title">Colors</label>
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            style={{ marginRight: '10px' }}
          />
        </div>

        {/* Brush size slider */}
        <div className="row">
          <label className="title"> <strong>Brush Size</strong></label>
          <input type="range" id="size-slider" min="1" max="30" value={brushWidth} onChange={(e) => handleBrushWidthChange(e.target.value)} />
        </div>

        <div className="row">
          <label className="title"> <strong>Shapes</strong></label>
          <ul className="options">
            <li className="option tool" id="rectangle" onClick={() => handleToolSelection('rectangle')}>
              <i className="fa-solid fa-dice-one"></i>
              <span>Rectangle</span>
            </li>
            <li className="option tool" id="circle" onClick={() => handleToolSelection('circle')}>
              <i className="fa-regular fa-circle"></i>
              <span>Circle</span>
            </li>
            <li className="option tool" id="triangle" onClick={() => handleToolSelection('triangle')}>
              <i className="fa-solid fa-mountain"></i>
              <span>Triangle</span>
            </li>
            <li className="option tool" id="square" onClick={() => handleToolSelection('square')}>
              <i className="far fa-square"></i>
              <span>Square</span>
            </li>

            <li className="option tool" id="line" onClick={() => handleToolSelection('line')}>
              <i className="fa-solid fa-grip-lines"></i>
              <span>Line</span>
            </li>
            {/* <li className="option tool" id="arrow" onClick={() => handleToolSelection('arrow')}>
              <i className="fa-solid fa-arrow-up"></i>
              <span>Arrow</span>
            </li> */}
            {/* <li className="option">
              <input
                type="checkbox"
                id="fill-color"
                checked={fillColor}
                onChange={handleFillColorChange}
              />
              <label htmlFor="fill-color"> Fill Color</label>
            </li> */}
          </ul>
        </div>

        {/* Buttons */}
        {/* <div className="row buttons">
          <button className="clear-canvas">Clear Canvas</button>
          <button className="save-img">Save As Image</button>
        </div> */}
      </section>
      <section className="drawing-board">
        <canvas ref={canvasRef}
          style={{ border: '4px solid #D7DC3C', borderRadius: '20px', background: '#fff' }}>
        </canvas>
      </section>
    </div>
  );
};

export default SketchApp;
