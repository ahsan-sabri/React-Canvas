import React, { useEffect, useRef } from "react";
import { fabric } from "fabric";

const FabricCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Initialize Fabric.js canvas
    const canvas = new fabric.Canvas("test", {
      // Add your canvas options here
    });

    canvas.on("mouse:down", (event) => {
      console.log(event);
    });

    const rect = new fabric.Rect({
      left: 50,
      top: 50,
      width: 100,
      height: 100,
      fill: "red",
      selectable: true, // Enable selection and dragging
      hasControls: true // Enable resizing handles
    });

    canvas.add(rect);
    canvasRef.current = canvas;
    console.log(canvas.getObjects());
  }, []);

  return (
    <>
      <canvas id="test" width={1200} height={600} style={{ border: '4px solid #D7DC3C', borderRadius: '4px' }} />
    </>
  );
};

export default FabricCanvas;