
var randomColor = () => {
  return 'rgb(' + Number.parseInt((Math.random()*100) + 155) + ', ' + Number.parseInt((Math.random()*100) + 155) + ', ' + Number.parseInt((Math.random()*100) + 155) + ')';
  //return 'hsl(' + Number.parseInt(Math.random()*360) + ', ' + Number.parseInt((Math.random()*40) + 60) + ', ' + Number.parseInt((Math.random()*40) + 60) + ')';
}

function wsend(msg) {
  if(ws && ws.readyState == 1) {
    ws.send(msg);
  }
}

function getCookie(index) {return document.cookie.split(';').length < index ? "" : document.cookie.split(';')[index].trim()}
function findCookie(regex) {
  for(cookie of document.cookie.split(';')) {
    if(cookie.search(regex)) { return cookie; }
  }
  return false;
}


var ws;
var container;
var field;
var clear;
var errTooltip;


window.onload = () => {
  container = document.getElementById("main");
  field = document.getElementById("scroll_field");
  $("#users")[0] = document.getElementById("users");
  clear = document.getElementById("clear");
  errTooltip = document.getElementById("err_tooltip")
  $.getScript("canvas.js", function() {
    console.log("loaded canvas.js")
  });
  $.getScript("user.js", function() {
    console.log("loaded user.js")
  });
  var bgoffset = 0;

  if(!findCookie(/bb[0-9]{1,4}$/)) {
    //new cookie!!!
    document.cookie = "bb0"; 
  } else {
    bgoffset = Number.parseInt(findCookie(/bb[0-9]{1,4}$/).substring(2));
    document.getElementById("pop").style.filter = "brightness(1)";
  }

  function movebg() { document.documentElement.style.setProperty('--bg-offset', ((++bgoffset)/5.0) + "px"); window.requestAnimationFrame(movebg) }
  window.requestAnimationFrame(movebg)
  window.onbeforeunload = () => {
    document.cookie = "bb" + (bgoffset);
  }

}


window.onkeyup = (evt) => {
  if(evt.key == " ") {
    console.log("delkete")
    document.getElementById("pop").remove();
  }
  if(evt.key == "a") {
    console.log(getCookie(1))
    document.cookie = "bb" + (Number.parseInt(getCookie(1).substring(2)) + bgoffset);
    console.log(document.cookie)
  }
}

window.ondblclick = async () => {
    //'ws://3.84.15.164:8091/'
    const serverAddress = `ws://3.84.15.164:8091`;
  
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
      console.log(e);
    }
  };

var pressed = false;
var lastpos = {x: 0, y: 0}
var id;
var myUser = {'id': 0, 'auth': 0, 'color': 'rgb(0, 0, 0)', 'name': ''};
var users = []

  ///////
 ///////

  async function runSession(address) {

    try {
      ws = new WebSocket(address);
    } catch (err) { console.log(err) }

    ws.addEventListener("open", () => {
      console.log("connected to server");
      sendColor(randomColor());
    });
  
    ws.addEventListener("message", ({ data }) => {
      if(data instanceof Blob) {
        console.log("blob")
        try {
          data.text().then(text => {
            text = JSON.parse(text);
            canvas.draw(text.data);
          });
        } catch(err) {
            console.log(err)
        }
      } else 
      {
        data = JSON.parse(data);
        switch(data.type) {
          case 'auth':

            id = data.data.id;
            auth = data.data.auth;
            document.getElementById("id").innerText = data.data.auth + "_" + data.data.id
            
            break;
          case 'image':

            canvas.clearCanvas();
            canvas.drawMany(data.data.img)

            break;
          case 'draw':

            console.log(data)

            break;
          case 'get':

            canvas.sendCanvas();

            break;
          case 'users':

            setUsers(data.data);

            break;
          case 'op':
            switch(data.data.type) {
              case 'usercolor':
                receiveColor(data.data.data);
                break;
              case 'username':
                receiveName(data.data.data);
                break;
              case 'clearcanvas':
                canvas.clearCanvas();
              default:
                break;
            }
            break;
          default:
            break;
        }
      }
    });

    clear.onclick = (evt) => {
      ws.send(JSON.stringify({'type':'op', 'data':{'type':'clearcanvas', 'data':''}}));
    }
    clear.onmouseenter = (evt) => {
      if(!userHasAuth()) {
        errTooltip.currentElem = "clear";
        errTooltip.style.visibility = 'visible';
      }
    }
    clear.onmouseleave = (evt) => {
      if(errTooltip.currentElem = "clear") {
        errTooltip.style.visibility = 'hidden';
      }
    }
    clear.onmousemove = (evt) => {
      document.documentElement.style.setProperty('--mouse-x', evt.offsetX + 5 + "px");
      document.documentElement.style.setProperty('--mouse-y', evt.offsetY + 5 + "px");
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
        window.open(window.location.href, '_self');
        resolve();
      });
    });
  }
  