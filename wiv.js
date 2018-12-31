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
    wiv.meta = {};
    wiv.style.display = "inline-block";
    let wivContent = document.createElement('div');
    wivContent.className = 'wiv-content';
    while (wiv.firstChild) {
      wivContent.appendChild(wiv.firstChild);
    }
    wiv.meta.content = wivContent;
    wiv.appendChild(wivContent);

    //insert wiv canvas element
    let canvas = document.createElement('canvas');
    canvas.id = "wiv-curves-" + wivCounter++
    canvas.className = "wiv-curves";
    canvas.style.zIndex = 16;
    canvas.style.position = "absolute";
    canvas.style.pointerEvents = "none";
    wiv.meta.canvas = canvas;
    wiv.insertBefore(canvas, wivContent);

    sizeWiv(wiv);

    let ctx = canvas.getContext("2d");

    cache[canvas.id] = {
      'ctx': ctx,
      'frame': 0
    }
    cacheAttributes(canvas.id, wiv);
    ctx.strokeStyle = cache[canvas.id].color;
    ctx.lineWidth = cache[canvas.id].thickness;

    let observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type == "attributes") {
          cacheAttributes(canvas.id, mutation.target);
          sizeWivTree(mutation.target);
        }
      });
    });
    observer.observe(wiv, {
      attributes: true
    });
  }

  function sizeWiv(wiv) {
    let imageSize = parseFloat(wiv.dataset.wivImageSize) || 0;
    wiv.meta.content.style.padding = imageSize + (parseFloat(wiv.dataset.wivHeight) * 4) + "px";
    wiv.meta.canvas.width = wiv.offsetWidth;
    wiv.meta.canvas.height = wiv.offsetHeight;
  }

  function sizeWivTree(elem) {
    do {
      if (elem.classList.contains('wiv')) {
        sizeWiv(elem)
      }
    } while (elem = elem.parentElement);
  }

  function cacheAttributes(cacheId, elem) {
    let color = elem.dataset.wivColor != undefined ? elem.dataset.wivColor : "#FF0000";
    let speed = speeds[elem.dataset.wivSpeed] || parseFloat(elem.dataset.wivSpeed) || speeds.standard;
    let height = parseFloat(elem.dataset.wivHeight);
    let tightness = parseFloat(elem.dataset.wivTightness);
    let thickness = parseFloat(elem.dataset.wivThickness);
    let increment = validatePositiveInteger(elem.dataset.wivCompressionFactor);
    increment *= globalCompressionFactor;
    let image = elem.dataset.wivImage;
    let imageSize = elem.dataset.wivImageSize;
    let imageFrequency = elem.dataset.wivImageFrequency;

    cache[cacheId] = Object.assign(cache[cacheId], {
      'speed': speed,
      'height': height,
      'tightness': tightness,
      'thickness': thickness,
      'color': color,
      'image': image,
      'imageSize': imageSize || height ,
      'imageFrequency': imageFrequency || tightness * 2,
      'increment': increment
    });
  }
  /**
   * Initialize all wiv elements. Going in reverse makes sure heights adjust to children wivs.
   */
  function initWivs() {
    let wivs = document.getElementsByClassName("wiv");
    for (let i = wivs.length - 1; i >= 0; i--) {
      initWiv(wivs[i]);
    }
    // reset the previous' wiv canvas size for responsive views
    for (let i = 0; i < wivs.length; i++) {
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
 function drawLines(canvas, {speed, height, tightness, thickness, increment, frame, color, image, imageSize, imageFrequency, ctx}={}) {
    var canvasImage = null;
    let imageMode = image !== undefined;
    if(imageMode){
      canvasImage = new Image();
      canvasImage.src = image;
    }

    if (ctx === null) {
      ctx = canvas.getContext("2d");
    }
    ctx.beginPath();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let x = height * 2 + thickness
    let y = height - Math.sin(((x - frame) * tightness) * Math.PI / 180) * height + thickness;

    //range of the sin function will be [-1 -> 1] * height. Since the logic will never want negative values for y (or clipping), it must have a vertical offset that takes all parameters into account
    let offset = height + Math.max(thickness, imageMode ? imageSize : 0)

    //draw top
    for (x = height * 3; x <= canvas.width - (height * 3); x += increment) {
      y =  offset + (Math.sin(((x - frame) * tightness) * Math.PI / 180) * height);
      imageMode && Math.floor(x % imageFrequency) == 0 && ctx.drawImage(canvasImage, x, y , imageSize, imageSize);
      ctx.lineTo(x, y);
    }

    //draw right
    for (; y <= canvas.height - (height * 3); y += increment) {
      x = (canvas.width - offset) - (Math.cos(((y - frame) * tightness) * Math.PI / 180) * height);
      imageMode &&  Math.floor(y % imageFrequency) == 0 && ctx.drawImage(canvasImage, x , y , imageSize, imageSize);
      ctx.lineTo(x, y);
    }

    //draw bottom
    for (; x >= (height * 3); x -= increment) {
      y = (canvas.height - offset) + (Math.sin(((x - frame) * tightness) * Math.PI / 180) * height);
      imageMode && Math.floor(x % imageFrequency) == 0 && ctx.drawImage(canvasImage, x, y  , imageSize, imageSize);
      ctx.lineTo(x, y);
    }

    //draw left
    for (; y >= (height * 2) + thickness; y -= increment) {
      x = offset + Math.cos(((y - frame) * tightness) * Math.PI / 180) * height;
      imageMode && Math.floor(y % imageFrequency) == 0 && ctx.drawImage(canvasImage, x , y , imageSize, imageSize);
      ctx.lineTo(x, y);
    }

    //draw top
    for (; x <= (height * 3) + increment; x += increment) {
      y = offset + (Math.sin(((x - frame) * tightness) * Math.PI / 180) * height);
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
    drawLines,
    defaultSpeeds: speeds,
  }
}

export { wiv }
