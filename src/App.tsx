import React, { useRef, useState } from 'react';
import './App.css';

let a = 0;

type Point = {
  x: number
  y: number
}

type Rect = {
  start: Point
  finish: Point
}

const canvasRenderWidth = 300
const canvasRenderHeight = 150

function App() {
  const [startPoints, setStartPoints] = useState<Point | null>(null)
  const [savedPoints, setSavedPoints] = useState<Rect[]>([])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)

  function drawImageScaled(img: any, ctx: any) {
    let canvas = ctx.canvas
    let hRatio = canvas.width  / img.width
    let vRatio =  canvas.height / img.height  
    let ratio  = Math.min ( hRatio, vRatio )
    let centerShift_x = (canvas.width - img.width * ratio) / 2
    let centerShift_y = (canvas.height - img.height * ratio) / 2; 
    ctx.clearRect(0,0,canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, img.width, img.height,
                       centerShift_x,centerShift_y,img.width*ratio, img.height*ratio)
 }

  const inputOnChange = (e: any) => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      const image = new Image()
      image.src = URL.createObjectURL(e.target.files[0])
      image.onload = () => {
        drawImageScaled(image, ctx)
      }
    }
  }

  const onMouseDownHandler = (e: React.MouseEvent) => {
    const bb = overlayCanvasRef.current!.getBoundingClientRect()
    setStartPoints({x: e.pageX - bb.left, y: e.pageY - bb.top})
  }

  const onMouseUpHandler = (e: React.MouseEvent) => {
    const bb = overlayCanvasRef.current!.getBoundingClientRect()
    
    const finishPoints = {
      x: e.pageX - bb.left,
      y: e.pageY - bb.top
    }
    if (overlayCanvasRef.current) {
      const xProportion = canvasRenderWidth / window.innerWidth
      const yProportion = canvasRenderHeight / window.innerHeight
      let ctx = overlayCanvasRef.current.getContext("2d")
      if (ctx && startPoints) {
        const x1 = startPoints.x * xProportion
        const y1 = startPoints.y * yProportion
        const x2 = finishPoints.x * xProportion
        const y2 = finishPoints.y * yProportion
        ctx.strokeRect(x1, 
          y1, 
          Math.abs(finishPoints.x - startPoints.x) * xProportion, 
          Math.abs(finishPoints.y - startPoints.y) * yProportion
        )
        setStartPoints(null)
        setSavedPoints(points => [...points, {
          start: {
            x: x1,
            y: y1
          },
          finish: {
            x: x2,
            y: y2
          }
        }])
      }
    }
  }

  const clearRects = () => {
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext("2d")
      ctx?.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height)
    }
  }

  const sendPoints = async () => {
    console.log(savedPoints)
    const data = {
      rects: savedPoints
    }
    const resp = await fetch("http://127.0.0.1:3080/", {
      method: "POST",
      mode: "cors",
      body: JSON.stringify(data)
    })
  }

  return (
    <div className="app">
      <canvas className='app__canvas' ref={canvasRef}></canvas>
      <canvas 
        className='app__overlay-canvas' 
        ref={overlayCanvasRef} 
        onMouseDown={onMouseDownHandler}
        onMouseUp={onMouseUpHandler}
      ></canvas>
      <div className='app__input-panel'>
        <input type="file" onChange={inputOnChange}/>
        <button onClick={clearRects}>Отчистить</button>
        <button onClick={sendPoints}>Отправить</button>
      </div>
    </div>
  );
}

export default App;
