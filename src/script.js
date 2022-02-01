const appendMessage = (msg) => {
    console.log(msg);
}

window.onload = async () => {
    const serverAddress = 'ws://3.84.15.164:8091/';
  
    appendMessage(`Connecting to ${serverAddress}`);
  
    try {
      let retries = 0;
      while (retries < 50) {
        appendMessage(`establishing connection... retry #${retries}`);
        await runSession(serverAddress);
        await Time.sleep(1500);
        retries++;
      }
  
      appendMessage("Reached maximum retries, giving up.");
    } catch (e) {
      appendMessage(e.message || e);
    }
  };

  var pressed = false;
  var lastpos = {x: 0, y: 0}
  var id;
  
  async function runSession(address) {
    const ws = new WebSocket(address);
  
    ws.addEventListener("open", () => {
      appendMessage("connected to server");
    });
  
    ws.addEventListener("message", ({ data }) => {
        try {
            data.text().then(text => {
                console.log(JSON.parse(text));
                draw(JSON.parse(text), lastpos);
            });
        } catch(err) {
            document.getElementById("id").innerText = JSON.parse(data).auth + "_" + JSON.parse(data).id
        }
        
    });
    document.body.onmousemove = (evt) => {
        if(pressed) {
            const messageBody = {'last': {x: lastpos.x, y: lastpos.y }, 'new': {x: evt.clientX, y: evt.clientY }};
            ws.send(JSON.stringify(messageBody));
        }
        lastpos = { x: evt.clientX, y: evt.clientY };
    }
    document.body.onmousedown = (evt) => { pressed = true; }
    document.body.onmouseup = (evt) => { pressed = false; }
    document.body.onmouseout = (evt) => { pressed = false; }

    return new Promise((resolve) => {
      ws.addEventListener("close", () => {
        appendMessage("Connection lost with server.");
        window.open('/', '_self')
        resolve();
      });
    });
  }
  

  ////////////
  function draw(pos) {
    var canvas = document.getElementById('canvas');
    if (canvas.getContext) {
        var ctx = canvas.getContext('2d');
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(pos.last.x, pos.last.y)
        ctx.strokeStyle = 'blue';
        ctx.lineTo(pos.new.x, pos.new.y);
        ctx.stroke();
        console.log("drew " + pos.last.x + ", " + pos.last.y + " to " + pos.new.x + ", " + pos.new.y)
    }
  }