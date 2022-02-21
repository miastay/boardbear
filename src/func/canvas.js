var canvas = $("#canvas")[0];
paper.install(window);
paper.setup('canvas');
canvas.style.width = '';
canvas.style.height = '';

canvas.position = {'x': 0, 'y': 0};

const M1DEFAULT = 1;
const M1CTRL = 2;
const M1SHIFT = 3;
const M1SHIFTCTRL = 4;

var mouse_state;

canvas.canUndo = true;
canvas.loading = false;
canvas.response_time = Number.MAX_SAFE_INTEGER;
canvas.min_response = Number.MAX_SAFE_INTEGER;
canvas.name = "";

canvas.setInfo = (text) => {
    $("#info").text(text);
}

canvas.loadImg = (url, callback) => {
    if(userHasAuth()) {
        var image = new Image();
        image.onload = function () {
            callback();
            canvas.sendCanvas(image.width, image.height, image.src);
        };
        image.onerror = function(err) { console.log( err)};
        image.src = url;
    }
}
canvas.setImg = (url) => {
    canvas.url = url;
    canvas.style.background = `url(${url}) no-repeat local white`;
}
canvas.clearCanvas = () => {
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}
canvas.sendCanvas = (width, height, src) => {
    wsend(JSON.stringify({'type':'canvas', 'data': {'dim': {'width': width, 'height': height}, 'url': src}}));
}
canvas.setCanvas = (cdata, reset, callback) => {
    canvas.clearCanvas();
    canvas.setImg(cdata.url);
    if(reset) {
        canvas.width = cdata.dim.width;
        canvas.height = cdata.dim.height;
        canvas.position.x = 0.2 * $("#scroll_field")[0].clientWidth;
        canvas.position.y = 0.2 * $("#scroll_field")[0].clientHeight;
        canvas.scale = (0.8 * $("#scroll_field")[0].clientWidth / canvas.width);
        canvas.setTransform();
    }
    for(bulkop of cdata.image) {
        canvas.drawMany(bulkop.data.operation);
    }
    callback();
}
canvas.receiveUndo = (didUndo) => {
    canvas.canUndo = didUndo;
}
canvas.draw = function(pos) {
    if (canvas.getContext && !canvas.loading) {
      if(pos.type == 'point') {
          var ctx = canvas.getContext('2d');
          ctx.fillStyle = pos.brush.color;
          ctx.fillRect(pos.x, pos.y, 10, 10);
      } else {
          var ctx = canvas.getContext('2d');
          ctx.lineWidth = pos.brush.scaleWithCanvas ? pos.brush.radius/canvas.scale : pos.brush.radius;
          ctx.beginPath();
          ctx.moveTo(pos.last.x, pos.last.y)
          ctx.strokeStyle = pos.brush.color;
          ctx.lineTo(pos.new.x, pos.new.y);
          ctx.stroke();
      }
    }
  }
  canvas.drawMany = (data) => {
      for(op of data) {
          canvas.draw(op.data);
      }
  }
  canvas.drawPoint = function(pos) {
      if (canvas.getContext && !canvas.loading) {
          var ctx = canvas.getContext('2d');
          ctx.fillStyle = pos.brush.color;
          ctx.fillRect(pos.x, pos.y, 10, 10);
      }
    }
var csx = 0, csy = 0;
canvas.shift = -1;

var render_bezier = true;
var bezier_buffer = [];
var bezier_points = [];
var bezier_step = 50;
var bezier_throttle = 5;
var b_count = 0;
var b_type = 'line';
var last_bez = 0;


// $('body').on("mousedown touchstart mouseup touchend mousemove touchmove mousewheel keydown keyup",function(evt){

//     if(canvas.loading) {
//         return;
//     }
//     var cx = evt.pageX - $("#canvas").offset().left + $('#scroll_field')[0].scrollLeft;
//     cx /= canvas.scale;
//     var cy = evt.pageY - $("#canvas").offset().top + $('#scroll_field')[0].scrollTop;
//     cy /= canvas.scale;

    

//     switch(evt.type) {
        
//         case 'touchmove':
//         case 'mousemove':
//             {

//                 if(mouse_state && evt.target == canvas) {
//                     if((evt.shiftKey || evt.buttons == 4) && !mouse_state.drawing) {
            
//                         //move event
//                         canvas.position.x += (cx - last_transform.x);
//                         canvas.position.y += (cy - last_transform.y);
            
//                     }
//                     else {
                        
//                         //draw event
//                         mouse_state.drawing = true;
//                         if(canvas.shift == 1) {
//                             cx = csx;
//                         } else
//                         if(canvas.shift == 0) {
//                             cy = csy;
//                         } else {
//                             //bezier curve
//                             b_count++;
//                             if(render_bezier) {
//                                 if(last_bez = 0) {
//                                     last_bez = {x: cx, y: cy};
//                                 }
//                                 if(bezier_buffer.length == 4) {
//                                     for(let step = 0; step < bezier_step; step++) {
//                                         var t = step/bezier_step;
//                                         var bx =    Math.pow((1 - t), 3)*bezier_buffer[0].x
//                                                     + (3*t*Math.pow((1-t), 2))*bezier_buffer[1].x
//                                                     + (3*t*t*(1-t))*bezier_buffer[2].x
//                                                     + (t**3)*bezier_buffer[3].x;
    
//                                         var by =    Math.pow((1 - t), 3)*bezier_buffer[0].y
//                                                     + (3*t*Math.pow((1-t), 2))*bezier_buffer[1].y
//                                                     + (3*t*t*(1-t))*bezier_buffer[2].y
//                                                     + (t**3)*bezier_buffer[3].y;
//                                         bezier_points.push({x: bx, y: by});
//                                         var x1 = last_bez.x;
//                                         var y1 = last_bez.y;
//                                         var x2 = bx * 1;
//                                         var y2 = by * 1;

//                                         if(b_type == 'point') {
//                                             var db = {'type': 'draw', 'data': {x: bx, y: by, 'id': getMe().id, 'brush': getMe().brush, 'type':'point'}}
//                                             canvas.drawPoint(db.data)
//                                             //canvas.draw(db.data)
//                                             operation.push(db);
//                                             wsend(JSON.stringify(db))
//                                         } else {
//                                             var db = {'type': 'draw', 'data': {'last': {x: x1, y: y1}, 'new': {x: x2, y: y2}, 'id': getMe().id, 'brush': getMe().brush}};
//                                             canvas.draw(db.data)
//                                             operation.push(db);
//                                             wsend(JSON.stringify(db))
//                                         }
//                                         last_bez = {x: bx, y: by};
                                        
//                                         /*
//                                         if(step > 0) {
//                                             var x1 = bezier_points[bezier_points.length-1].x;
//                                             var y1 = bezier_points[bezier_points.length-1].y;
//                                             var x2 = bezier_points[bezier_points.length-2].x;
//                                             var y2 = bezier_points[bezier_points.length-2].y;
//                                             var db = {'type': 'draw', 'data': {'last': {x: x1, y: y1}, 'new': {x: x2, y: y2}, 'id': getMe().id, 'brush': getMe().brush}};
//                                             console.log("distance: "+ Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2)))
//                                             console.log("slope: " + (y2 - y1)/(x2 - x1));
//                                             canvas.draw(db.data)
//                                             operation.push(db);
//                                             wsend(JSON.stringify(db))
//                                         }*/
//                                     }
//                                     // for(op of bezier_points) {
//                                     //     canvas.draw(op.data)
//                                     // }
//                                     last_point = bezier_points[bezier_points.length-1];
//                                     bezier_buffer = [];
//                                     bezier_buffer.push(last_point);
//                                     bezier_points = [];
//                                 } else {
//                                     if((b_count % bezier_throttle == 0)) {
//                                         bezier_buffer.push({x: cx, y: cy})
//                                         //canvas.drawPoint({x: cx, y: cy, 'brush': {'color': 'red'}})
//                                     }
//                                 }
                                
//                             } else {
//                                 const messageBody = {'type': 'draw', 'data': {'last': {x: lastpos.x, y: lastpos.y}, 'new': {x: cx, y: cy}, 'id': getMe().id, 'brush': getMe().brush}};
//                                 operation.push(messageBody);
//                                 canvas.draw(messageBody.data);
//                                 wsend(JSON.stringify(messageBody));
//                             }
//                         }
//                     }
//                 } else {
//                     last_transform = {x: (cx), y: (cy)};
//                 }
//                 setTimeout(function(){lastpos = {x: (cx), y: (cy)}}, 0);
//             }
//         break;
//         case 'touchstart':
//         case 'mousedown':
//             {
//                 operation = [];
//                 evt.mdown = true;
//                 mouse_state = evt;
//             }
//         break;
//         case 'touchend' :
//         case 'mouseup' :
//             {
//                 b_count = 0;
//                 bezier_buffer = [];
//                 mouse_state = null;
//                 if(operation.length > 0) {
//                     wsend(JSON.stringify({'type': 'bulkdraw', 'data': {operation}}));
//                     canvas.canUndo = true;
//                 }
//             }
//         break;
//         case 'mousewheel' :
//             {
//                 canvas.scale += (-0.1 * (canvas.scale/2) * (evt.originalEvent.deltaY)/Math.abs((evt.originalEvent.deltaY)));
//                 canvas.scale = Math.min(10, Math.max(0.05, canvas.scale))
//             }
//         break;
//         case 'keydown' :
//             {
//                 if( evt.key == " " || (evt.ctrlKey && window.navigator.userAgent.search("Mac") != -1)) 
//                 {
//                     evt.preventDefault();
//                 }
//                 if(evt.key == 'z' && evt.ctrlKey && canvas.canUndo) {
//                     evt.preventDefault();
//                     wsend(JSON.stringify({'type':'op', 'data':{'type':'userundo'}}));
//                 }
//                 if(evt.shiftKey && canvas.shift == -1) {
//                     canvas.shift = (Math.abs(lastpos.x - csx) < Math.abs(lastpos.y - csy)) ? 1 : 0;
//                     csx = lastpos.x;
//                     csy = lastpos.y;
//                 }
//                 if(evt.key == 'x') {
//                     render_bezier = !render_bezier;
//                 }
//             }
//         break;
//         case 'keyup': {
//             if(canvas.shift >= 0) {
//                 canvas.shift = -1;
//             }
//             break;
//         }
//     }
//     canvas.setTransform();
// });
canvas.operations = []; 

canvas.getChange = (data) => {
    //data.delta == -1 ? canvas.operations.splice()
}

canvas.setTransform = () => {
    canvas.style.transformOrigin = '0px 0px';
    canvas.style.transform = `scale(${canvas.scale}) translateX(${canvas.position.x}px) translateY(${canvas.position.y}px)`;
}

canvas.changeBasis = (x, y) => {
    var dx = x - $("#canvas").offset().left + $('#scroll_field')[0].scrollLeft;
    dx /= canvas.scale;
    var dy = y - $("#canvas").offset().top + $('#scroll_field')[0].scrollTop;
    dy /= canvas.scale;
    return new Point(dx, dy)
}

var cx = 0; var cy = 0;

paper.tools = {
    'default' : new Tool(),
    'move' : new Tool(),
    'brush' : new Tool(),
    'highlight' : new Tool(), 
    'erase': new Tool()
}
var ptools = paper.tools;
ptools.arr = [ptools['default'], ptools['move'], ptools['brush'], ptools['highlight'], ptools['erase']]
ptools.setActiveTool = function(tool) {
    tool.activate();
    {
        $("#toolbar_left").find("*").removeClass('selected');
        $(`#${tool.id}`).addClass('selected');
    }
    return ptools.activeTool = tool;
}
ptools.drawCursor = (tool) => {
    tool.minDistance = 0;
    tool.cursor.position = new Point(cx, cy);
    view.draw();
}



$('body').on("mousedown touchstart mouseup touchend mousemove touchmove mousewheel keydown keyup contextmenu",function(evt){
        
        if((ptools.activeTool == ptools.move && ptools.move.drag) || evt.buttons == 2) {
            canvas.position.x += (cx - last_transform.x);
            canvas.position.y += (cy - last_transform.y);
        }


        switch(evt.type) {


            case 'mousewheel' : {
                canvas.transformOrigin = `center`;
                canvas.scale += (-0.1 * (canvas.scale/2) * (evt.originalEvent.deltaY)/Math.abs((evt.originalEvent.deltaY)));
                canvas.scale = Math.min(10, Math.max(0.05, canvas.scale));
            } break;

            case 'keyup' : {
                if(evt.key) {
                    ptools.setActiveTool(ptools.arr.filter(x => x.key == evt.key)[0])
                }
            } break;

            case 'contextmenu' : {
                return false;
            } break;

            case 'mousemove' : {
                ptools.drawCursor(ptools.activeTool);
            } break;

            default : {
                
            }

        }


        if(!ptools.move.mouse_state ) {
            last_transform = {x: (cx), y: (cy)};
        }
        canvas.setTransform();
        cx = evt.pageX - $("#canvas").offset().left + $('#scroll_field')[0].scrollLeft;
        cx /= canvas.scale;
        cy = evt.pageY - $("#canvas").offset().top + $('#scroll_field')[0].scrollTop;
        cy /= canvas.scale;
        
});

/*      Move Tool
*/

let m = ptools.move;
    m.minDistance = 1;
    m.key = "m";
    m.id = "bt_move";
    m.cursor = new Path.Circle(new Point(cx, cy), 2);

ptools.move.on('mousedrag', function(event) {
    ptools.move.drag = true;
});
ptools.move.on('mouseup', function(event) {
    ptools.move.mouse_state = false;
    ptools.move.drag = false;
}); 
ptools.move.on('mousedown', function(event) {
    ptools.move.mouse_state = true;
});
ptools.setActiveTool(ptools.move);


/*      Brush Tool
*/

let b = ptools.brush;
    b.key = "b";
    b.cursor = new Path.Circle(new Point(cx, cy), 2);
    b.id = "bt_brush";
    b.strokeColor = 'red';
    b.blendMode = 'normal';
    b.strokeWidth = 8;

b.on('mousedrag', function(event) {
    if(event.event.buttons == 1) {
        b.minDistance = 5;
        path = canvas.operations[canvas.operations.length-1];
        path.strokeColor = b.strokeColor;
        path.blendMode = b.blendMode;
        path.strokeWidth = b.strokeWidth;
        var point = canvas.changeBasis(event.event.pageX, event.event.pageY);
        path.add(point, point);
    }
        
});
b.on('mousemove', function(event) {
    view.draw();
});
b.on('mouseup', function(event) {
    path = path.reduce();
    console.log(canvas.operations[canvas.operations.length-1])
}); 
b.on('mousedown', function(event) {
    if(event.event.buttons == 1) {
        path = new Path();
        canvas.operations.push(path.reduce());
    }
});


/*      Highlight Tool
*/

let h = ptools.highlight;
    h.key = "h";
    h.cursor = new Path.Circle(new Point(cx, cy), 5);
    h.id = "bt_highlight";
    h.strokeColor = 'yellow';
    h.blendMode = 'darken';
    h.strokeWidth = 45;
    h.opacity = 0.3;
h.on('mousedrag', function(event) {
    if(event.event.buttons == 1) {
        h.minDistance = 5;
        path = canvas.operations[canvas.operations.length-1];
        path.opacity = h.opacity;
        path.strokeColor = h.strokeColor;
        path.blendMode = h.blendMode;
        path.strokeWidth = h.strokeWidth;
        var point = canvas.changeBasis(event.event.pageX, event.event.pageY);
        path.add(point, point);
    }
        
});
ptools.highlight.on('mousemove', function(event) {
    view.draw();
});
ptools.highlight.on('mouseup', function(event) {
    path = path.reduce();
    console.log(canvas.operations[canvas.operations.length-1])
}); 
ptools.highlight.on('mousedown', function(event) {
    if(event.event.buttons == 1) {
        path = new Path();
        canvas.operations.push(path.reduce());
    }
});

/*
*/

let e = ptools.erase;
    e.minDistance = 0;
    e.key = "e";
    e.radius = 50;
    e.cursor = new Path.Circle(new Point(cx, cy), e.radius);
    e.id = "bt_erase";
    let minp;
    let segs = [];
e.on('mousedrag', function(event) {
    segs = [];
    for(path of canvas.operations) {
        if(path.getNearestLocation(new Point(cx, cy))._distance < e.radius) {
            path.visible = false;
        }
    }
    
});
e.on('mouseup', function(event) {
    console.log(canvas.operations)
    segs = []; minp = null;
    view.draw();
}); 

e.on('mousedown', function(event) {
    
});



canvas.tick = (n = 0) => {
    canvas.connect_time = Number.parseInt(n*0.015)
    canvas.setInfo(`${canvas.name} (${canvas.response_time}ms)`);
    canvas.min_response = Math.min(canvas.min_response, canvas.response_time)
    setTimeout(function(){return canvas.tick(n+1)}, 15);
}
canvas.tick();

function tactiv(elem, tool) {
    console.log(elem)
    ptools.setActiveTool(tool); 
    //[...$("#left_toolbar").find("*")].forEach(x => x.removeClass('selected'))
    $("#toolbar_left").find("*").removeClass('selected')
    elem.addClass('selected');
}


/*
document.onmousemove = (evt) => {
    var cx = evt.pageX - $("#canvas").offset().left + $('#scroll_field')[0].scrollLeft;
    cx /= canvas.scale;
    var cy = evt.pageY - $("#canvas").offset().top + $('#scroll_field')[0].scrollTop;
    cy /= canvas.scale;
    if(mouse_state) {
        if(evt.shiftKey || evt.buttons == 4) {

            //move event
            canvas.position.x += (cx - last_transform.x);
            canvas.position.y += (cy - last_transform.y);

        }
        else {

            //draw event
            const messageBody = {'type': 'draw', 'data': {'last': {x: lastpos.x, y: lastpos.y}, 'new': {x: cx, y: cy}, 'id': myUser.id, 'brush': myUser.brush}};
            canvas.draw(messageBody.data);
            wsend(JSON.stringify(messageBody));
            
        }
    } else {
        last_transform = {x: (cx), y: (cy)};
    }
    canvas.style.transform = `scale(${canvas.scale}) translateX(${canvas.position.x}px) translateY(${canvas.position.y}px)`;
    setTimeout(function(){lastpos = {x: (cx), y: (cy)}}, 10);
}
document.onmousedown = (evt) => { 
    evt.mdown = true;
    mouse_state = evt;
}
document.onmouseup = (evt) => { mouse_state = null; }

document.onwheel = (evt) => {
    console.log(evt);
    canvas.scale += (0.1 * (evt.deltaY)/Math.abs((evt.deltaY)));
    canvas.style.transform = `scale(${canvas.scale}) translateX(${canvas.position.x}px) translateY(${canvas.position.y}px)`;
}

window.addEventListener('keydown', function(e) {
    if( e.key == " " || 
        (e.ctrlKey && this.navigator.userAgent.search("Mac") != -1)) 
    {
        e.preventDefault();
    }
});
*/

// segs = [];
//     for(path of canvas.operations) {
//         if(path.getNearestLocation(new Point(cx, cy)) == null) { canvas.operations = canvas.operations.filter(x => x != path); continue; }
//         let d = path.getNearestLocation(new Point(cx, cy))._distance;
//         if(d < 50) { 
//             segs.push(path.getNearestLocation(new Point(cx, cy)));
//         }
//     }
//     if(event.event.buttons == 1) {
//         /*
//         for(minp of segs) {
//             console.log(canvas.operations, "before")
//             canvas.operations = canvas.operations.filter(x => x != minp);
//             console.log(canvas.operations, "after")
//             path = minp;
//             path_before = path.splitAt(path.getNearestLocation(new Point(cx, cy))._segment1);
//             if(path_before) {
//                 path_after = path_before.splitAt(path_before.getNearestLocation(new Point(cx, cy))._segment2);
//             }
//             path.strokeColor = 'blue';
//             //path_before.strokeColor = 'red';
//             //path_after.strokeColor = 'green';
//             path_before.visible = false;
//             if(path != null) { canvas.operations.push(path); }
//             if(path_after != null) { canvas.operations.push(path_after); }
//             // path2 = path.splitAt(path.getNearestLocation(new Point(cx, cy))._segment1);
//             // path3 = path2.splitAt(path.getNearestLocation(new Point(cx, cy))._segment2);
//             // canvas.operations.push(path3); 
//             // path2.strokeColor = 'yellow';
//             // path2.strokeWidth = 500;
//             // path3.strokeColor = 'green';
//             console.log(path_before, path, path_after)
//             //path.visible = false;
//         }
//         */
//        for(curve of segs) {
//            console.log(curve);
//            curve.strokeColor = 'green';
//        }
//     }