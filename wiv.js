function initWiv(wiv) {
  //style wiv elements 
  wiv.style.display = "inline-block";
  wiv.style.borderRadius = parseFloat(wiv.dataset.wivHeight) + "px";
  wiv.children[0].style.padding = (parseFloat(wiv.dataset.wivHeight) * 4) + "px";

  //insert wiv canvas element
  var canvas = document.createElement('canvas');
  canvas.className = "wiv-curves";
  canvas.width = wiv.offsetWidth;
  canvas.height = wiv.offsetHeight;
  canvas.style.zIndex = 16;
  canvas.style.position = "absolute";
  canvas.style.pointerEvents ="none";
  wiv.insertBefore(canvas, wiv.firstChild);
  console.log(document.getElementsByClassName("wiv")[1].offsetHeight,"beforeinit")
}

/**
 * Initialize all wiv elements. Going in reverse makes sure heights adjust to children wivs. 
 */
function initWivs() {
  var wivs = document.getElementsByClassName("wiv");
  for (i = wivs.length - 1; i >= 0; i--) {
    initWiv(wivs[i]);
    // resetting the previous' wiv canvas size for responsive views
    if (i < wivs.length-1) {
      var canvas = document.getElementsByTagName("canvas")[i+1]
      canvas.height = wivs[i+1].offsetHeight;
      canvas.width = wivs[i+1].offsetWidth;
    }
    console.log(document.getElementsByClassName("wiv")[1].offsetHeight,"ininit")
  }
}

/**
Represents the logic to draw a single frame. Animates all wivs
*/
function animateLines() {
  var wivCurves = document.getElementsByClassName("wiv-curves");

  for (var wivCurve of wivCurves) {
    var speed = parseFloat(wivCurve.parentNode.dataset.wivSpeed)
    var height = parseFloat(wivCurve.parentNode.dataset.wivHeight)
    var tightness = parseFloat(wivCurve.parentNode.dataset.wivTightness)
    var thickness = parseFloat(wivCurve.parentNode.dataset.wivThickness)

    var ctx = wivCurve.getContext("2d");
    ctx.beginPath();
    ctx.clearRect(0, 0, wivCurve.width, wivCurve.height);

    var x = height * 2 + thickness
    var y = height - Math.sin(((x - parseFloat(wivCurve.dataset.count)) * tightness) * Math.PI / 180) * height + thickness;

    // keep track of original location of x and y to complete the loop later on 
    let oX = x;
    let oY = y;

    //draw top
    for (x = height * 3; x <= wivCurve.width - (height * 3); x += 1) {
      y = height - Math.sin(((x - parseFloat(wivCurve.dataset.count)) * tightness) * Math.PI / 180) * height + thickness;

      ctx.lineWidth = thickness;

      ctx.lineTo(x, y);

    }

    //draw right
    for (y = y; y <= wivCurve.height - (height * 3); y += 1) {
      x = (wivCurve.width - height * 3) + height - Math.cos(((y - parseFloat(wivCurve.dataset.count)) * tightness) * Math.PI / 180) * height + thickness;
      ctx.lineWidth = thickness;
      ctx.lineTo(x, y);
    }

		//draw bottom
    for (x = x; x >= (height * 3); x -= 1) {
      y = (wivCurve.height - height * 3) + height - Math.sin(((x - parseFloat(wivCurve.dataset.count)) * tightness) * Math.PI / 180) * height + thickness;

      ctx.lineWidth = thickness;

      ctx.lineTo(x, y);
    }

		//draw left
    for (y = y; y >= (height * 2) + thickness; y -= 1) {
      x = height - Math.cos(((y - parseFloat(wivCurve.dataset.count)) * tightness) * Math.PI / 180) * height + thickness;

      ctx.lineWidth = thickness;

      ctx.lineTo(x, y);
    }
  
        //draw top
        for (x = x; x <= wivCurve.width - (height * 3); x += 1) {
          y = height - Math.sin(((x - parseFloat(wivCurve.dataset.count)) * tightness) * Math.PI / 180) * height + thickness;
    
          ctx.lineWidth = thickness;
    
          ctx.lineTo(x, y);
    
        }

		//pull color from dataset
    ctx.strokeStyle = wivCurve.parentNode.dataset.wivColor != undefined ? wivCurve.parentNode.dataset.wivColor : "#FF0000"
    ctx.stroke();

		//current frame is tracked on per wiv basis. This is to help with speed calculations 
    if (parseFloat(wivCurve.dataset.count) > 100000) {
      wivCurve.dataset.count = "0";
    }
    wivCurve.dataset.count = (wivCurve.dataset.count ? parseFloat(wivCurve.dataset.count) : 0) + speed;
  }

	//reanimate 
  window.requestAnimationFrame(animateLines);
}
//initial wivs and call initial frame render
initWivs();
console.log(document.getElementsByClassName("wiv")[1].offsetHeight,"afterinit")
window.requestAnimationFrame(animateLines);
