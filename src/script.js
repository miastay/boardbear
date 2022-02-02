canvases = [];

var randomColor = () => {
  return 'rgb(' + Number.parseInt((Math.random()*100) + 155) + ', ' + Number.parseInt((Math.random()*100) + 155) + ', ' + Number.parseInt((Math.random()*100) + 155) + ')';
  //return 'hsl(' + Number.parseInt(Math.random()*360) + ', ' + Number.parseInt((Math.random()*40) + 60) + ', ' + Number.parseInt((Math.random()*40) + 60) + ')';
}

window.onload = async () => {
    const serverAddress = 'ws://3.84.15.164:8091/';
  
    console.log(`Connecting to ${serverAddress}`);
  
    try {
      let retries = 0;
      while (retries < 50) {
        console.log(`establishing connection... retry #${retries}`);
        await runSession(serverAddress);
        await Time.sleep(1500);
        retries++;
      }
  
      console.log("Reached maximum retries, giving up.");
    } catch (e) {
      console.log(e.message || e);
    }
  };

  var pressed = false;
  var lastpos = {x: 0, y: 0}
  var id;
  var myUser = {'id': 0, 'auth': 0, 'color': 'rgb(0, 0, 0)'};
  var users = []
  
  async function runSession(address) {
    const ws = new WebSocket(address);

    var container = document.getElementById("main");
    var canvas = document.getElementById("canvas");

    var userElem = document.getElementById("users");

    var sendColor = (color) => {
      ws.send(JSON.stringify({'type':'op', 'data':{'type':'usercolor', 'data':{color}}}))
    }
    var receiveColor = (color) => {
      myUser.color = color[0].color;
      console.log(document.getElementById(myUser.id).style.setProperty('box-shadow', `10px 0px 0px ${myUser.color} inset`));
    }
    
    var setUsers =(usersdata)=> {
      console.log(usersdata);
      userElem.innerHTML = "";
      users = [];
      for(user of usersdata.userset) {
        if(user.id == id) { myUser = user; }
        var c = "";
        c += (user.auth == "guest" ? " guest" : "");
        c += (user.id == id ? " me" : "");
        c += (user.auth == "owner" ? " owner" : "");
        c.trim();
        users.push(user);
        console.log(user.color)
        userElem.innerHTML += `<div id=${user.id} class="c${c}">${user.id == id ? user.id + " (me)" : (user.auth == "owner" ? user.id + " (owner)" : user.id)}</div><br>`;
        document.getElementById(user.id).style.setProperty('box-shadow', `10px 0px 0px ${user.color} inset`);
      }
    }

    canvas.width = 1000;
  
    ws.addEventListener("open", () => {
      console.log("connected to server");
      sendColor(randomColor());
    });
  
    ws.addEventListener("message", ({ data }) => {
      if(data instanceof Blob) {
        try {
          data.text().then(text => {
            text = JSON.parse(text);
            if(text.type == 'canvas') {
              /*
              var ctx = canvas.getContext('2d');
              var palette = ctx.getImageData(0,0,500,500);
              palette.data.set(new Uint8ClampedArray(text.data.img.data));
              console.log(palette);
              ctx.putImageData(palette, 0, 0);
              */
            } else
            {
              canvas.draw(text.data);
            }
          });
        } catch(err) {
            console.log(err)
        }
      } else 
      {
        
        data = JSON.parse(data);
        console.log(data)
        switch(data.type) {
          case 'auth':

            id = data.data.id;
            auth = data.data.auth;
            document.getElementById("id").innerText = data.data.auth + "_" + data.data.id
            
            break;
          case 'image':

            for(op of data.data.img) {
              canvas.draw(op.data);
            }

            break;
          case 'get':

            console.log("sending canvas")
            var img = canvas.getContext('2d').getImageData(0, 0, 500, 500);
            console.log(img)
            ws.send(JSON.stringify({'type':'canvas', 'data': { img }}));

            break;
          case 'users':

            console.log("got users")
            setUsers(data.data);

            break;
          case 'op':
            switch(data.data.type) {
              case 'usercolor':
                receiveColor(data.data.data);
                break;
              default:
                break;
            }
            break;
          default:
            break;
        }
      }
    });

    var drawBlob =(data)=> {
      try {
        data.text().then(text => {
          text = JSON.parse(text);
          canvas.draw(text.data);
        });
      } catch(err) {
          console.log(err)
      }
    }

    canvas.onmousemove = (evt) => {
        if(pressed) {
            const messageBody = {'type': 'draw', 'data': {'last': {x: lastpos.x, y: lastpos.y }, 'new': {x: evt.clientX, y: evt.clientY }, 'color': myUser.color}};
            canvas.draw(messageBody.data);
            ws.send(JSON.stringify(messageBody));
        }
        lastpos = { x: evt.offsetX, y: evt.offsetY };
    }
    canvas.onmousedown = (evt) => { pressed = true; }
    canvas.onmouseup = (evt) => { pressed = false; }
    canvas.onmouseout = (evt) => { pressed = false; }

    canvas.draw = function(pos) {
      if (canvas.getContext) {
          var ctx = canvas.getContext('2d');
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(pos.last.x, pos.last.y)
          ctx.strokeStyle = pos.color;
          ctx.lineTo(pos.new.x, pos.new.y);
          ctx.stroke();
      }
    }

    window.onkeyup = function(evt) {
      if(evt.code == 'Space') {
        sendColor(randomColor());
      }
    }

    window.onclose = () => {
      ws.close();
    }

    return new Promise((resolve) => {
      ws.addEventListener("close", () => {
        console.log("Connection lost with server.");
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