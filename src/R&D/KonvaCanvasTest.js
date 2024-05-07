import React, { useState } from 'react';
import { Stage, Shape, Layer } from 'react-konva';

const SketchApp = () => {

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <Shape
          width={260}
          height={170}
          draggable
          sceneFunc={function (context, shape) {
            const width = shape.width();
            const height = shape.height();
            context.beginPath();
            context.moveTo(200, 80);
            context.lineTo(100, 100);
            context.quadraticCurveTo(100, 300, width, height);
            context.closePath();

            // (!) Konva specific method, it is very important
            context.fillStrokeShape(shape);
          }}
          fill="#00D2FF"
          stroke="black"
          strokeWidth={4}
        />
      </Layer>
    </Stage>
  );
};

export default SketchApp;
