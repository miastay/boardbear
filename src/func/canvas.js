var canvas = $("#canvas")[0];
canvas.width = 5000;
canvas.height = 5000;

canvas.clearCanvas = () => {
    console.log("clearingcanvas")
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}
canvas.sendCanvas = () => {
    var img = canvas.getContext('2d').getImageData(0, 0, 500, 500);
    wsend(JSON.stringify({'type':'canvas', 'data': { img }}));
}

canvas.onmousemove = (evt) => {
    if(pressed) {
        const messageBody = {'type': 'draw', 'data': {'last': {x: lastpos.x, y: lastpos.y}, 'new': {x: evt.clientX + $('#scroll_field')[0].scrollLeft , y: evt.clientY + $('#scroll_field')[0].scrollTop }, 'id': myUser.id, 'color': myUser.color}};
        canvas.draw(messageBody.data);
        wsend(JSON.stringify(messageBody));
    }
    lastpos = {x: evt.clientX + $('#scroll_field')[0].scrollLeft , y: evt.clientY + $('#scroll_field')[0].scrollTop};
}
document.onmousedown = (evt) => { pressed = true; console.log(field) }
document.onmouseup = (evt) => { pressed = false; }
window.addEventListener('keydown', function(e) {
    if(e.key == "Space" && e.target == document.body) {
      e.preventDefault();
    }
  });

canvas.draw = function(pos) {
  if (canvas.getContext) {
      var ctx = canvas.getContext('2d');
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(pos.last.x, pos.last.y )
      ctx.strokeStyle = pos.color;
      ctx.lineTo(pos.new.x, pos.new.y);
      ctx.stroke();
  }
}
canvas.drawMany = (data) => {
    for(op of data) {
        canvas.draw(op.data);
    }
}
