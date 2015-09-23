function Rgba(red, green, blue, alpha) {
    this.red = red || 0;
    this.green = green || 0;
    this.blue = blue || 0;
    this.alpha = alpha || 0;
    this.toString = function() {
        var colorStr = 'rgba(' + (this.red || 0) + "," 
                              + (this.green || 0) + ","
                              + (this.blue || 0) + ","
                              + (this.alpha || 0) + ")";
        return colorStr;
    };
}
function getCoords(elem) {
  var box = elem.getBoundingClientRect();
  return {
    top: box.top + pageYOffset,
    left: box.left + pageXOffset
  };
}
function DrawPoint(ctx, point, color) {
    // var colorStr = 'rgba(' + (color.red || 0) + "," 
    //                       + (color.green || 0) + ","
    //                       + (color.blue || 0) + ","
    //                       + (color.alpha || 0) + ")";
    ctx.save();
    
    ctx.beginPath();
    ctx.fillStyle = color.toString();
    var radius = 1;
    ctx.arc(point.x, point.y, radius, 0, 2*Math.PI);
    ctx.fill();
    
    ctx.restore();
}
function DrawLine(ctx, p1, p2, color) {
    var width = parseFloat(getComputedStyle(ctx.canvas).width),
        height = parseFloat(getComputedStyle(ctx.canvas).height);
    var imgData = ctx.getImageData(0, 0, width, height);
    var length = Math.sqrt((p1.x - p2.x)*(p1.x - p2.x) + (p1.y - p2.y)*(p1.y - p2.y));
    var step = 1/length, tMin = 0, tMax = 1;
    for (var t = tMin; t <= tMax; t+= step) {
        var x = Math.round((1 - t)*p1.x + t*p2.x),
            y = Math.round((1 - t)*p1.y + t*p2.y);
        var pixelIndex = 4*(x + y*imgData.width);
        imgData.data[pixelIndex + 0] = color.red; //r
        imgData.data[pixelIndex + 1] = color.green; //g
        imgData.data[pixelIndex + 2] = color.blue; //b
        imgData.data[pixelIndex + 3] = color.alpha; //a
    }
    ctx.putImageData(imgData,0,0);
}