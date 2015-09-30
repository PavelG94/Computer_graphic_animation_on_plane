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
function Polygon(points, borderRgbaColor, fillRgbaColor) {
    this.points = points || [];
    var transparent = new Rgba(0, 0, 0, 0).toString();
    //this.borderColor = borderRgbaColor.toString() || transparent; - WRONG!
    this.borderColor = (borderRgbaColor instanceof Rgba)? borderRgbaColor.toString(): transparent;
    this.fillColor = (fillRgbaColor instanceof Rgba)? fillRgbaColor.toString(): transparent;
    this.barycenter = function() {
        var points = this.points;
        if (points.length == 0) return 0;
        var xSum = 0, ySum = 0;
        for (var i = 0; i < points.length; ++i) {
            xSum += points[i].x;
            ySum += points[i].y;
        }    
        var c = Object.create(null); 
        c.x = Math.round(1/points.length * xSum);
        c.y = Math.round(1/points.length * ySum);
        return c;
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
function DrawPolygon(ctx, polygon)
{
    var points = polygon.points;
    if (points.length < 3) return;
    ctx.save();

    //Необходим, когда на холсте рисуетя более одного объекта!
    ctx.beginPath(); 

    ctx.moveTo(points[0].x, points[0].y);
    var currPointId = 1;
    while (currPointId < points.length) {
        var p = points[currPointId];
        ctx.lineTo(p.x, p.y);
        currPointId++;
    }
    ctx.lineTo(points[0].x, points[0].y);
    ctx.strokeStyle = polygon.borderColor;
    ctx.fillStyle = polygon.fillColor;
    ctx.stroke();
    ctx.fill();

    ctx.restore();
}
function Translate(point, dx, dy)
{
    return {x: point.x+dx, y: point.y+dy};
}
function StartAnimation(ctx, polygon, route) {
    /*
        * setTimeout, setInterval;
        * requestAnimationFrame;
        * Рекурсия;
    */
    var canvasWidth = ctx.canvas.width, canvasHeight = ctx.canvas.height;
    var c = polygon.barycenter(), polygonCopy = new Polygon();
    polygonCopy.points = [].concat(polygon.points);
    polygonCopy.borderColor = polygon.borderColor;
    polygonCopy.fillColor = polygon.fillColor
    // for (var i = 0; i < polygon.length; ++i) {
    //     polygon[i].x = polygon[i].x - c.x;
    //     polygon[i].y = polygon[i].y - c.y;
    // }
    var startPointId = 0, endPointId = 1;
    var t = 0; deltaT = 1/100;
    function AnimationStep() {
        var nextPoint = Object.create(null);
        nextPoint.x = (1 - t)*route.points[startPointId].x + t*route.points[endPointId].x;
        nextPoint.y = (1 - t)*route.points[startPointId].y + t*route.points[endPointId].y;
        var xDist = nextPoint.x - c.x, yDist = nextPoint.y - c.y;
        for (var i = 0; i < polygon.points.length; ++i) {
            var resPoint = Translate(polygon.points[i], xDist, yDist);
            polygonCopy.points[i] = resPoint;
        }
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        DrawPolygon(ctx, route);
        DrawPolygon(ctx, polygonCopy);
        t += deltaT;
        if (t > 1) {
            t = 0;
            startPointId = endPointId; 
            endPointId = (endPointId == route.points.length - 1)? 0: endPointId + 1;
        }
        //setTimeout(requestAnimationFrame(AnimationStep), 500);
        setTimeout(window.requestAnimationFrame(AnimationStep), 1000);
    }
    window.requestAnimationFrame(AnimationStep);
}