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


class ActionStack {
    ActionStack() {
        this.actions = [];
        this.max = 50;
    }
    undo() {
        let action = this.actions.at(-1);
        return action.backward();
    }
    redo() {
        let action = this.actions.at(0);
        return action.forward();
    }
    push(item) {
        this.actions.push(item);
        while(this.actions.length() > this.max) {
            this.actions.shift();
        }
        return item;
    }
    empty() {
        this.actions = [];
    }
}
class UndoAction {
    UndoAction(tool, forwardFunc, backwardFunc) {
        this.forward = forwardFunc;
        this.backward = backwardFunc;
        this.tool = tool;
    }
    backward() {
        return this.backward();
    }
    forward() {
        return this.forward();
    }
    tool() {
        return this.tool;
    }
}

canvas.action_stack = new ActionStack();


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

paper.tools = {
    'default' : new Tool(),
    'move' : new Tool(),
    'brush' : new Tool(),
    'highlight' : new Tool(), 
    'erase': new Tool(),
    'picker': new Tool()
}
var ptools = paper.tools;
ptools.arr = [ptools['default'], ptools['move'], ptools['brush'], ptools['highlight'], ptools['erase'], ptools['picker']];
ptools.colors = [{'color':'red','x':'0','y':'-10','l':'50'}, {'color':'black','x':'0','y':'0','l':'0'}];
ptools.activeColor = 0;
ptools.showColor = false;
ptools.color = ptools.colors[ptools.activeColor];
ptools.switchColors = function() {
    ptools.activeColor = Math.abs(ptools.activeColor - 1);
    ptools.color = ptools.colors[ptools.activeColor];
}
ptools.setActiveTool = function(tool) {
    if(!tool) return;
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


var cx = 0; var cy = 0;
var mx = 0; var my = 0;
var last_transform = null;
$('body').on("mousedown touchstart mouseup touchend mousemove touchmove mousewheel keydown keyup contextmenu",function(evt){
        
        if(evt.pageX && evt.pageY) {
            mx = evt.pageX; my = evt.pageY;
            cx = evt.pageX - $("#canvas").offset().left + $('#scroll_field')[0].scrollLeft;
            cx /= canvas.scale;
            cy = evt.pageY - $("#canvas").offset().top + $('#scroll_field')[0].scrollTop;
            cy /= canvas.scale;
            if(last_transform) { ptools.axis = Math.abs(cx - last_transform.x) > Math.abs(cy - last_transform.y) ? 'x' : 'y' };
        }

        if(ptools.revertTemp) {
            ptools.setActiveTool(ptools.tempTool);
            ptools.tempTool = null;
            ptools.revertTemp = false;
        }

        if(ptools.move.drag) {
            canvas.position.x += (cx - last_transform.x);
            canvas.position.y += (cy - last_transform.y);
        } 
        //if(evt.type != 'mousemove')

        switch(evt.type) {


            case 'mousewheel' : {
                canvas.transformOrigin = `center`;
                let diff = (-0.1 * (canvas.scale/2) * (evt.originalEvent.deltaY)/Math.abs((evt.originalEvent.deltaY)));
                canvas.scale += diff;
                canvas.scale = Math.min(10, Math.max(0.05, canvas.scale));
            } break;

            case 'keyup' : {
                if(evt.key) {
                    ptools.setActiveTool(ptools.arr.filter(x => x.key == evt.key)[0])
                }
            } break;

            case 'keydown' : {
                if(evt.shiftKey && ptools.shiftKey == null) {
                    ptools.shiftKey = new Point(mx, my);
                }
            } break;

            case 'contextmenu' : {
                return false;
            } break;

            case 'mousemove' : {
                ptools.drawCursor(ptools.activeTool);
            } break;

            case 'mousedown' : {
                if(evt.which == 2) {
                    ptools.move.drag = true;
                    ptools.tempTool = ptools.activeTool;
                    ptools.activeTool = ptools.move;
                }
            } break;

            case 'mouseup' : {
                if(evt.which == 2) {
                    ptools.move.drag = false;
                    ptools.revertTemp = true;
                }
                ptools.shiftKey = null;
            } break;

            default : {
                
            }

        }

        if(!ptools.move.drag) {
            last_transform = {x: (cx), y: (cy)};
        }
        canvas.setTransform();
        
        
});

/*      Move Tool
*/

let m = ptools.move;
    m.minDistance = 1;
    m.key = "m";
    m.id = "bt_move";
    m.cursor = new Path.Circle(new Point(cx, cy), 2);

m.on('mousedrag', function(event) {
});
m.on('mouseup', function(event) {
    m.mouse_state = false;
}); 
m.on('mousedown', function(event) {
    m.mouse_state = true;
});
ptools.setActiveTool(m);


/*      Brush Tool
*/

let b = ptools.brush;
    b.key = "b";
    b.cursor = new Path.Circle(new Point(cx, cy), 2);
    b.id = "bt_brush";
    b.strokeColor = ptools.color;
    b.blendMode = 'normal';
    b.strokeWidth = 8;
    b.simplify = true;
    b.simplifyTolerance = 5;
    var path = null;

b.on('mousedrag', function(event) {
    if(ptools.revertTemp || !path) return;
    if(event.event.button == 0) {
        b.minDistance = 5;
        path.strokeColor = ptools.colors[ptools.activeColor]['color'];
        path.blendMode = b.blendMode;
        path.strokeWidth = b.strokeWidth;
        if(event.event.shiftKey) {
            point = canvas.changeBasis(event.event.pageX, ptools.shiftKey.y);
        } else {
            point = canvas.changeBasis(event.event.pageX, event.event.pageY);
        }
        path.add(point);
    }
        
});
b.on('mousemove', function(event) {
    view.draw();
});
b.on('mouseup', function(event) {
    if(ptools.revertTemp || !path) return;
    var x = path.segments.length < 25 ? -1 : path.segments.length-2;
    while(x > 0) {
        path.removeSegment(x);
        x-=2;
    }
    if(b.simplify) {
        path.simplify(5);
        console.log(`points added: ${path.segments.length}`);
    }
    path = null;
}); 
b.on('mousedown', function(event) {
    switch(event.event.button) {
        case 0: {
            path = new Path();
            canvas.operations.push(path.reduce());
            b.firstY = event.event.pageY;
        } break;
        case 2 : {
            ptools.switchColors();
        } break;
        default: {};
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
    h.opacity = 0.4;
h.on('mousedrag', function(event) {
    if(ptools.revertTemp || !path) return;
    if(event.event.button == 0) {
        h.minDistance = 5;
        path.opacity = h.opacity;
        path.strokeColor = ptools.colors[ptools.activeColor]['color'];
        path.blendMode = h.blendMode;
        path.strokeWidth = h.strokeWidth;
        var point = canvas.changeBasis(event.event.pageX, event.event.pageY);
        path.add(point);
    }
});
h.on('mousemove', function(event) {
    view.draw();
});
h.on('mouseup', function(event) {
    if(ptools.revertTemp || !path) return;
    var x = path.segments.length < 25 ? -1 : path.segments.length-2;
    while(x > 0) {
        path.removeSegment(x);
        x-=2;
    }
    if(b.simplify) {
        path.simplify(5);
        console.log(`points added: ${path.segments.length}`);
    }
    path = null;
}); 
h.on('mousedown', function(event) {
    switch(event.event.button) {
        case 0: {
            path = new Path();
            canvas.operations.push(path.reduce());
        } break;
        case 2 : {
            ptools.switchColors();
        } break;
        default: {};
    }
});

/*
*/

let e = ptools.erase;
    e.minDistance = 0;
    e.key = "e";
    e.radius = 15;
    e.cursor = new Path.Circle(new Point(cx, cy), e.radius);
    e.id = "bt_erase";
    let minp;
    let segs = [];
e.on('mousedrag', function(event) {
    segs = [];
    for(path of canvas.operations) {
        if(path.getNearestLocation(new Point(cx, cy))._distance < e.radius) {
            path.visible = false;
            canvas.operations = canvas.operations.filter(x => x != path);
        }
    }
    
});
e.on('mouseup', function(event) {
    if(ptools.revertTemp) return;
    segs = []; minp = null;
    view.draw();
}); 

e.on('mousedown', function(event) {
    
});


let p = ptools.picker;
    p.minDistance = 0;
    p.key = 'p';
    p.radius = 15;
    p.cursor = new Path.Circle(new Point(cx, cy), p.radius);
    p.id = "bt_picker";
p.on('mousedown', function(event) {
    if(event.event.button == 0) {
        let x = cx; let y = cy;
        let data = canvas.getContext("2d").getImageData(x, y, 1, 1).data;
        let rgb = `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
        ptools.colors[ptools.activeColor]['color'] = rgb;
    }
});

canvas.tick = (n = 0) => {
    canvas.connect_time = Number.parseInt(n*0.015)
    canvas.setInfo(`${canvas.name} (${canvas.response_time}ms)`);
    canvas.min_response = Math.min(canvas.min_response, canvas.response_time)
    setTimeout(function(){return canvas.tick(n+1)}, 15);
}
canvas.tick();

function tactiv(elem, tool) {
    ptools.setActiveTool(tool); 
    //[...$("#left_toolbar").find("*")].forEach(x => x.removeClass('selected'))
    $("#toolbar_left").find("*").removeClass('selected')
    elem.addClass('selected');
}

function swcolor(which) {
    if(!ptools.showColor || ptools.activeColor != which) {
        ptools.showColor = true;
        ptools.activeColor = which;
        document.documentElement.style.setProperty(`--tool-color-0`, `var(--tool-color-${which+1})`);
        setColorN(ptools.color);
        document.querySelector('.colorwheel').style.setProperty('display', 'block');
    } else {
        ptools.showColor = false;
        document.querySelector('.colorwheel').style.setProperty('display', 'none');
    }
}
function updateColor(which, color) {
    ptools.colors[which] = {'color':color,'x':cwx,'y':cwy, 'l': cwlight};
    ptools.color = ptools.colors[ptools.activeColor]['color'];
    document.documentElement.style.setProperty(`--tool-color-${which+1}`, `${color}`);
}
function updateCWLight() {
    cwlight = Number.parseInt(document.querySelector('#cw_light_slider_input').value);
    document.getElementById('cw_light').style.setProperty('opacity', `${(cwlight-50)/50}`);
    document.getElementById('cw_dark').style.setProperty('opacity', `${(50-cwlight)/50}`);
    if(cwlight > 50) { document.querySelector('#cw_picker').style.setProperty('border-color', `black`); } 
    else { document.querySelector('#cw_picker').style.setProperty('border-color', `white`); }
    updateColorN();
}

let cwspace = document.getElementById('cw_space');
let cwpick = document.getElementById('cw_picker');
let cwdown = false;
let cwradius = 10;
let cwx, cwy, cwt, cwr, cwhsl;
let cwlight = 1;
cwspace.addEventListener('mousemove', function(evt) {
    if(cwdown) {
        cwpick.style.setProperty('transform', `translateX(${evt.offsetX - cwradius}px) translateY(${evt.offsetY - cwradius}px)`);
        cwx = evt.offsetX - cwradius - 80; cwy = evt.offsetY - cwradius - 80;
        updateColorN();
    } 
})
cwspace.addEventListener('mousedown', function(evt) {
    cwdown = true;
})
cwspace.addEventListener('mouseup', function(evt) {
    cwdown = false;
})
cwspace.addEventListener('mouseout', function(evt) {
    cwdown = false;
})

function updateColorN() {
    cwt = Math.atan2(cwy,cwx); cwr = Math.sqrt(cwx*cwx + cwy*cwy);
    cwhsl = `hsl(${(cwt*-180 / Math.PI) - 90}, 100%, ${cwlight}%)`
    updateColor(ptools.activeColor, cwhsl, cwx, cwy);
}
function setColorN() {
    cwpick.style.setProperty('transform', `translateX(${Number.parseFloat(ptools.colors[ptools.activeColor]['x']+80)}px) translateY(${Number.parseFloat(ptools.colors[ptools.activeColor]['y']+80)}px)`);
    cwx = Number.parseFloat(ptools.colors[ptools.activeColor]['x']); cwy =Number.parseFloat(ptools.colors[ptools.activeColor]['y']);
    document.querySelector('#cw_light_slider_input').value = Number.parseFloat(ptools.colors[ptools.activeColor]['l']);
    updateCWLight();
}