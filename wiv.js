function wiv(params) {
  params = params || {}
  let isMobile = false;
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    isMobile = true;
  }
  let mobileCompressionFactor = validatePositiveInteger(params.mobileCompressionFactor, 2);
  let globalCompressionFactor = validatePositiveInteger(params.globalCompressionFactor);
  if (isMobile) {
    globalCompressionFactor *= mobileCompressionFactor;
  }
  let cache = {}
  let wivCounter = 0;

  const speeds = {
    "slow": .15,
    "standard": .55,
    "fast": 1.55,
    "faster": 3.15,
    "turbo": 6.15
  }

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

    cache[canvas.id] = parseParamsFromWiv(wiv, canvas)
  }
  function parseParamsFromWiv(wiv, canvas) {
    let color = wiv.dataset.wivColor != undefined ? wiv.dataset.wivColor : "#FF0000";
    let speed = speeds[wiv.dataset.wivSpeed] || parseFloat(wiv.dataset.wivSpeed) || speeds.standard;
    let height = parseFloat(wiv.dataset.wivHeight)
    let tightness = parseFloat(wiv.dataset.wivTightness)
    let thickness = parseFloat(wiv.dataset.wivThickness)
    let increment = validatePositiveInteger(wiv.dataset.wivCompressionFactor);
    increment *= globalCompressionFactor;
    let image = wiv.dataset.wivImage;
    let imageSize = wiv.dataset.wivImageSize;
    let imageFrequency = wiv.dataset.wivImageFrequency;
    let ctx = canvas.getContext("2d");
    return {
      'speed': speed,
      'height': height,
      'tightness': tightness,
      'thickness': thickness,
      'increment': increment,
      'color': color,
      'imageMode': image !== undefined, 
      'image': image,
      'imageSize': imageSize || height * 2,
      'imageFrequency': imageFrequency || tightness * 2,
      'context': ctx,
      'frame': 0
    };
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
      curveCache.frame = drawLines(wivCurve, curveCache)
    }
    // reanimate 
    window.requestAnimationFrame(processWivs);
  }

  /**
  Represents the logic to draw a single frame. Animates all wivs
  */
  function drawLines(canvas, params) {
    let speed = params.speed;
    let height = params.height;
    let tightness = params.tightness;
    let thickness = params.thickness;
    let increment = params.increment;
    let frame = params.frame;
    let color = params.color;
    let imageMode = params.imageMode;
    let image = params.image;
    let imageSize = params.imageSize;
    let imageFrequency = params.imageFrequency;
    let canvasImage = new Image();
    canvasImage.src = image;
    let ctx = params.context;
    if (ctx === null) {
      ctx = canvas.getContext("2d");
    }
    ctx.beginPath();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let x = height * 2 + thickness
    let y = height - Math.sin(((x - frame) * tightness) * Math.PI / 180) * height + thickness;

    //draw top
    for (x = height * 3; x <= canvas.width - (height * 3); x += increment) {
      imageMode && Math.floor(x % imageFrequency) == 0 && ctx.drawImage(canvasImage, x, y , imageSize, imageSize);
      y = height - Math.sin(((x - frame) * tightness) * Math.PI / 180) * height + thickness;
      ctx.lineTo(x, y);
    }

    //draw right
    for (y = y; y <= canvas.height - (height * 3); y += increment) {
      imageMode && Math.floor(y % imageFrequency) == 0 && ctx.drawImage(canvasImage, x - (imageSize / 4), y , imageSize, imageSize);
      x = (canvas.width - height * 3) + height - Math.cos(((y - frame) * tightness) * Math.PI / 180) * height + thickness;
      ctx.lineTo(x, y);
    }

    //draw bottom
    for (x = x; x >= (height * 3); x -= increment) {
      imageMode && Math.floor(x % imageFrequency) == 0 && ctx.drawImage(canvasImage, x, y - (imageSize / 4 ) , imageSize, imageSize);
      y = (canvas.height - height * 3) + height - Math.sin(((x - frame) * tightness) * Math.PI / 180) * height + thickness;
      ctx.lineTo(x, y);
    }

    //draw left
    for (y = y; y >= (height * 2) + thickness; y -= increment) {
      imageMode && Math.floor(y % imageFrequency) == 0 && ctx.drawImage(canvasImage, x + (imageSize / 8), y , imageSize, imageSize);
      x = height - Math.cos(((y - frame) * tightness) * Math.PI / 180) * height + thickness;
      ctx.lineTo(x, y);
    }

    //draw top
    for (x = x; x <= (height * 3) + increment; x += increment) {
      y = height - Math.sin(((x - frame) * tightness) * Math.PI / 180) * height + thickness;
      ctx.lineTo(x, y);
    }

    //pull color from dataset
    ctx.strokeStyle = color
    ctx.lineWidth = thickness;
    if(thickness != 0 ){
      ctx.stroke();
    }

    //current frame is tracked on per wiv basis. This is to help with speed calculations 
    if (frame > 100000) {
      frame = 0;
    }

    frame = (frame ? frame : 0) + speed;
    return frame;
  }

  function validatePositiveInteger(value, defaultVal) {
    defaultVal = defaultVal || 1;
    value = parseInt(value);
    if (!value || value < 1) {
      value = defaultVal;
    }
    return value;
  }

  return {
    initWivs,
    drawLines
  }
}
