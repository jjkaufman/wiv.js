(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.wiv = {}));
}(this, function (exports) { 'use strict';

  function wiv(params) {
    params = params || {};
    let isMobile = false;
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      isMobile = true;
    }
    let mobileCompressionFactor = validatePositiveInteger(params.mobileCompressionFactor, 2);
    let globalCompressionFactor = validatePositiveInteger(params.globalCompressionFactor);
    if (isMobile) {
      globalCompressionFactor *= mobileCompressionFactor;
    }
    let cache = {};
    let wivCounter = 0;

    const speeds = {
      "slow": .15,
      "standard": .55,
      "fast": 1.55,
      "faster": 3.15,
      "turbo": 6.15
    };

    function initWiv(wiv) {
      //style wiv elements
      wiv.style.display = "inline-block";
      wiv.style.borderRadius = parseFloat(wiv.dataset.wivHeight) + "px";
      let imageSize = parseFloat(wiv.dataset.wivImageSize) || 0;
      wiv.children[0].style.padding = imageSize + (parseFloat(wiv.dataset.wivHeight) * 4) + "px";

      //insert wiv canvas element
      let canvas = document.createElement('canvas');
      canvas.id = "wiv-curves-" + wivCounter++;
      canvas.className = "wiv-curves";
      canvas.width = wiv.offsetWidth;
      canvas.height = wiv.offsetHeight;
      canvas.style.zIndex = 16;
      canvas.style.position = "absolute";
      canvas.style.pointerEvents = "none";
      wiv.insertBefore(canvas, wiv.firstChild);
      cache[canvas.id] = parseParamsFromWiv(wiv, canvas);
    }
    
    function parseParamsFromWiv(wiv, canvas) {
      let color = wiv.dataset.wivColor !== undefined ? wiv.dataset.wivColor : "#FF0000";
      let speed = speeds[wiv.dataset.wivSpeed] || parseFloat(wiv.dataset.wivSpeed) || speeds.standard;
      let height = parseFloat(wiv.dataset.wivHeight);
      let tightness = parseFloat(wiv.dataset.wivTightness);
      let thickness = parseFloat(wiv.dataset.wivThickness);
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
        'image': image,
        'imageSize': imageSize || height ,
        'imageFrequency': imageFrequency || tightness * 2,
        'ctx': ctx,
        'frame': 0
      };
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
        curveCache.frame = drawLines(wivCurve, curveCache);
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

      let x = height * 2 + thickness;
      let y = height - Math.sin(((x - frame) * tightness) * Math.PI / 180) * height + thickness;

      //range of the sin function will be [-1 -> 1] * height. Since we never want negative values for y (or clipping), we must have a vertical offset that takes all parameters into account
      let offset = height + Math.max(thickness, imageMode ? imageSize : 0);
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
        y = (Math.sin(((x - frame) * tightness) * Math.PI / 180) * height) + offset ;
        ctx.lineTo(x, y);
      }

      //pull color from dataset
      ctx.strokeStyle = color;
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

  exports.wiv = wiv;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=wiv.js.map
