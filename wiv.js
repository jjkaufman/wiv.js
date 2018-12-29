function wiv() {
  let cache = {}
  let wivCounter = 0;

  function initWiv(wiv) {
    //style wiv elements 
    wiv.style.display = "inline-block";
    wiv.style.borderRadius = parseFloat(wiv.dataset.wivHeight) + "px";
    wiv.children[0].style.padding = (parseFloat(wiv.dataset.wivHeight) * 4) + "px";

    //insert wiv canvas element
    let canvas = document.createElement('canvas');
    canvas.id = "wiv-curves-" + wivCounter++
    canvas.className = "wiv-curves";
    canvas.width = wiv.offsetWidth;
    canvas.height = wiv.offsetHeight;
    canvas.style.zIndex = 16;
    canvas.style.position = "absolute";
    canvas.style.pointerEvents = "none";
    wiv.insertBefore(canvas, wiv.firstChild);


    let color = wiv.dataset.wivColor != undefined ? wiv.dataset.wivColor : "#FF0000";
    let speed = parseFloat(wiv.dataset.wivSpeed)
    let height = parseFloat(wiv.dataset.wivHeight)
    let tightness = parseFloat(wiv.dataset.wivTightness)
    let thickness = parseFloat(wiv.dataset.wivThickness)

    let ctx = canvas.getContext("2d");
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;

    cache[canvas.id] = {
      'speed': speed,
      'height': height,
      'tightness': tightness,
      'thickness': thickness,
      'color': color,
      'context': ctx,
      'count': 0
    }

  }

  /**
   * Initialize all wiv elements. Going in reverse makes sure heights adjust to children wivs. 
   */
  function initWivs() {
    let wivs = document.getElementsByClassName("wiv");
    for (i = wivs.length - 1; i >= 0; i--) {
      initWiv(wivs[i]);
    }
    // reset the previous' wiv canvas size for responsive views
    for (i = 0; i < wivs.length; i++) {
      let canvas = document.getElementsByTagName("canvas")[i];
      canvas.height = wivs[i].offsetHeight;
      canvas.width = wivs[i].offsetWidth;
    }
    window.requestAnimationFrame(processWivs);
  }

  function processWivs() {
    let wivCurves = document.getElementsByClassName("wiv-curves");

    for (let wivCurve of wivCurves) {
      let curveCache = cache[wivCurve.id];
      let speed = curveCache.speed;
      let height = curveCache.height;
      let tightness = curveCache.tightness;
      let thickness = curveCache.thickness;
      let count = curveCache.count;
      let color = curveCache.color;
      let ctx = curveCache.context;
      curveCache.count = drawLines(wivCurve, speed, height, tightness, thickness, count, color, ctx)
    }
    // reanimate 
    window.requestAnimationFrame(processWivs);
  }

  /**
  Represents the logic to draw a single frame. Animates all wivs
  */
  function drawLines(canvas, speed, height, tightness, thickness, frame, color, ctx = null) {
    if(ctx === null){
      ctx = canvas.getContext("2d");
    }
    ctx.beginPath();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let x = height * 2 + thickness
    let y = height - Math.sin(((x - frame) * tightness) * Math.PI / 180) * height + thickness;

    // keep track of original location of x and y to complete the loop later on 
    let oX = x;
    let oY = y;

    //draw top
    for (x = height * 3; x <= canvas.width - (height * 3); x += 1) {
      y = height - Math.sin(((x - frame) * tightness) * Math.PI / 180) * height + thickness;
      ctx.lineTo(x, y);
    }

    //draw right
    for (y = y; y <= canvas.height - (height * 3); y += 1) {
      x = (canvas.width - height * 3) + height - Math.cos(((y - frame) * tightness) * Math.PI / 180) * height + thickness;
      ctx.lineTo(x, y);
    }

    //draw bottom
    for (x = x; x >= (height * 3); x -= 1) {
      y = (canvas.height - height * 3) + height - Math.sin(((x - frame) * tightness) * Math.PI / 180) * height + thickness;
      ctx.lineTo(x, y);
    }

    //draw left
    for (y = y; y >= (height * 2) + thickness; y -= 1) {
      x = height - Math.cos(((y - frame) * tightness) * Math.PI / 180) * height + thickness;
      ctx.lineTo(x, y);
    }

    //draw top
    for (x = x; x <= canvas.width - (height * 3); x += 1) {
      y = height - Math.sin(((x - frame) * tightness) * Math.PI / 180) * height + thickness;
      ctx.lineTo(x, y);
    }

    //pull color from dataset
    ctx.strokeStyle = color
    ctx.lineWidth = thickness;

    ctx.stroke();

    //current frame is tracked on per wiv basis. This is to help with speed calculations 
    if (frame > 100000) {
      frame = 0;
    }

    frame = (frame ? frame : 0) + speed;
    return frame;
  }

  return {
    initWivs,
    drawLines
  }
}
