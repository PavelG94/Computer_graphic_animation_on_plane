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
function DrawPoint(ctx, point, color, radius) {
    ctx.save();
    
    ctx.beginPath();
    ctx.fillStyle = color.toString();
    radius = radius || 1;
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
function TranslatePolygon(/**/)
{

}
function Rotate(point, center, alphaInRad)
{
    //Два сдвига вып. для вращения относительно точки center;
    var resPoint = {x: point.x, y: point.y};
    resPoint.x -= center.x;    resPoint.y -= center.y;

    var sinAlpha = Math.sin(alphaInRad), cosAlpha = Math.cos(alphaInRad);
    
    var p = {x: 0, y: 0};
    p.x = resPoint.x; p.y = resPoint.y;
    resPoint.x = p.x*cosAlpha - p.y*sinAlpha;
    resPoint.y = p.x*sinAlpha + p.y*cosAlpha;

    resPoint.x += center.x;    resPoint.y += center.y;
    return resPoint;

    // point.x -= center.x;
    // point.y -= center.y;

    // p = point.x * Math.cos(1 * Math.PI / 180) - point.y * Math.sin(1 * Math.PI / 180);
    // point.y = point.x * Math.sin(1 * Math.PI / 180) + point.y * Math.cos(1 * Math.PI / 180);
    // point.x = p;

    // point.x += center.x;
    // point.y += center.y;
}
function RotatePolygon(/**/)
{


}
function ToRadians(angleInDegrees)
{
    return 2*Math.PI/360 * angleInDegrees;
}
function StartAnimation(ctx, polygon, route) {
    var canvasWidth = ctx.canvas.width, canvasHeight = ctx.canvas.height;
    var polygonCopy = new Polygon();
    polygonCopy.borderColor = polygon.borderColor;
    polygonCopy.fillColor = polygon.fillColor

    var startPointId = 0, endPointId = 1;
    var t = 0; deltaT = 1/100, deltaAlpha = 5, deltaAlphaInRad = ToRadians(deltaAlpha);
    var center = polygon.barycenter();
    function AnimationStep() {
        for (var i = 0; i < polygon.points.length; ++i) {
            var resPoint = Rotate(polygon.points[i], center, deltaAlphaInRad);
            polygon.points[i] = resPoint;
            //Rotate(polygon.points[i], c, deltaAlphaInRad);
        }
        // ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        // DrawPolygon(ctx, route);
        // DrawPolygon(ctx, polygon);
        
        //Движение
        var nextPoint = Object.create(null);
        nextPoint.x = (1 - t)*route.points[startPointId].x + t*route.points[endPointId].x;
        nextPoint.y = (1 - t)*route.points[startPointId].y + t*route.points[endPointId].y;
        
        polygonCopy.points = [].concat(polygon.points);
        //var c = polygonCopy.barycenter(); //учет предыдущего поворота
        var xDist = nextPoint.x - center.x, yDist = nextPoint.y - center.y;
        for (var i = 0; i < polygonCopy.points.length; ++i) {
            var resPoint = Translate(polygonCopy.points[i], xDist, yDist);
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
        window.requestAnimationFrame(AnimationStep);
    }
    window.requestAnimationFrame(AnimationStep);
}