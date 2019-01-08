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

    const directions = {
      "default": {
        "top": -1,
        "right": -1,
        "bottom": -1,
        "left": -1
      },
      "reverse": {
        "top": 1,
        "right": 1,
        "bottom": 1,
        "left": 1
      },
      "diverging": {
        "top": -1,
        "right": 1,
        "bottom": 1,
        "left": -1
      },
      "converging": {
        "top": 1,
        "right": -1,
        "bottom": -1,
        "left": 1
      },
      "clockwise": {
        "top": -1,
        "right": -1,
        "bottom": 1,
        "left": 1
      },
      "counterClockwise": {
        "top": 1,
        "right": 1,
        "bottom": -1,
        "left": -1
      }
    };

    function initWiv(wiv) {
      // style wiv elements
      wiv.meta = {};
      wiv.style.display = "inline-block";
      let wivContent = document.createElement('div');
      wivContent.className = 'wiv-content';
      while (wiv.firstChild) {
        wivContent.appendChild(wiv.firstChild);
      }
      wiv.meta.content = wivContent;
      wiv.appendChild(wivContent);

      // insert wiv canvas element
      let canvas = document.createElement('canvas');
      canvas.id = "wiv-curves-" + wivCounter++;
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
      };
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
          sizeWiv(elem);
        }
      } while (elem = elem.parentElement);
    }

    function cacheAttributes(cacheId, elem) {
      let color = elem.dataset.wivColor != undefined ? elem.dataset.wivColor : "#FF0000";
      let speed = speeds[elem.dataset.wivSpeed] || parseFloat(elem.dataset.wivSpeed) || speeds.standard;
      let direction = directions[elem.dataset.wivDirection] || directions.default;
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
        'direction': direction,
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
        curveCache.frame = drawLines(wivCurve, curveCache);
      }
      // reanimate
      window.requestAnimationFrame(processWivs);
    }

    /**
     * Represents the logic to draw a single frame. Animates all wivs
     */
    function drawLines(canvas, {speed, direction, height, tightness, thickness, increment, frame, color, image, imageSize, imageFrequency, ctx}={}) {
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

      // range of the sin function will be [-1 -> 1] * height. Since the logic will never want negative values for y (or clipping), it must have a vertical offset that takes all parameters into account
      let offset = height + Math.max(thickness, imageMode ? imageSize : 0);

      function calculateTopYValue(x) {
        return offset + (Math.sin(((x + (frame * direction.top)) * tightness) * Math.PI / 180) * height);
      }

      function calculateRightXValue(y) {
        return (canvas.width - offset) - (Math.cos(((y + (frame * direction.right)) * tightness) * Math.PI / 180) * height);
      }

      function calculateBottomYValue(x) {
        return (canvas.height - offset) + (Math.sin(((x + (frame * direction.bottom)) * tightness) * Math.PI / 180) * height);
      }

      function calculateLeftXValue(y) {
        return offset + (Math.cos(((y + (frame * direction.left)) * tightness) * Math.PI / 180) * height);
      }

      function findIntersection(start, end, firstFunc, secondFunc, trim = 2) {
        let reverse = (end < start);
        let coordList = [];
        for (let x = start; (reverse && x >= end) || (!reverse && x <= end); x += reverse ? -1 : 1) {
          let y = firstFunc(x);
          let newX = secondFunc(y);
          coordList.unshift({
            x: x,
            y: y
          });
          coordList = coordList.slice(0, trim);
          if ((reverse && newX >= x) || (!reverse && newX <= x)) {
            return coordList.pop();
          }
        }
        return coordList.pop();
      }

      let topLeft = findIntersection(height * 4, 0, calculateTopYValue, calculateLeftXValue);
      let topRight = findIntersection(canvas.width - height * 4, canvas.width, calculateTopYValue, calculateRightXValue);
      let bottomRight = findIntersection(canvas.width - height * 4, canvas.width, calculateBottomYValue, calculateRightXValue);
      let bottomLeft = findIntersection(height * 4, 0, calculateBottomYValue, calculateLeftXValue);

      let x, y;
      let thicknessPadding = (thickness / 4);

      // draw top
      for (x = topLeft.x; x <= topRight.x; x += increment) {
        y = calculateTopYValue(x);
        imageMode && Math.floor(x % imageFrequency) == 0 && ctx.drawImage(canvasImage, x, y , imageSize, imageSize);
        ctx.lineTo(x, y);
      }

      // draw right
      for (; y <= bottomRight.y - thicknessPadding; y += increment) {
        x = calculateRightXValue(y);
        imageMode &&  Math.floor(y % imageFrequency) == 0 && ctx.drawImage(canvasImage, x , y , imageSize, imageSize);
        ctx.lineTo(x, y);
      }

      // draw bottom
      for (; x >= bottomLeft.x + thicknessPadding; x -= increment) {
        y = calculateBottomYValue(x);
        imageMode && Math.floor(x % imageFrequency) == 0 && ctx.drawImage(canvasImage, x, y  , imageSize, imageSize);
        ctx.lineTo(x, y);
      }

      // draw left
      for (; y >= topLeft.y; y -= increment) {
        x = calculateLeftXValue(y);
        imageMode && Math.floor(y % imageFrequency) == 0 && ctx.drawImage(canvasImage, x , y , imageSize, imageSize);
        ctx.lineTo(x, y);
      }
      // complete connection
      ctx.closePath();

      // pull color from dataset
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      if(thickness != 0 ){
        ctx.stroke();
      }

      // current frame is tracked on per wiv basis. This is to help with speed calculations
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
