canvases = [];

var randomColor = () => {
  return 'rgb(' + Number.parseInt((Math.random()*100) + 155) + ', ' + Number.parseInt((Math.random()*100) + 155) + ', ' + Number.parseInt((Math.random()*100) + 155) + ')';
  //return 'hsl(' + Number.parseInt(Math.random()*360) + ', ' + Number.parseInt((Math.random()*40) + 60) + ', ' + Number.parseInt((Math.random()*40) + 60) + ')';
}

window.ondblclick = async () => {
    //'ws://3.84.15.164:8091/'
    const serverAddress = 'ws://3.84.15.164:8091';
  
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
  var myUser = {'id': 0, 'auth': 0, 'color': 'rgb(0, 0, 0)', 'name': ''};
  var users = []
  
  ///////
 ///////

  async function runSession(address) {
    var ws;
    try {
      ws = new WebSocket(address);
    } catch (err) { console.log(err) }
    

    var container = document.getElementById("main");
    var canvas = document.getElementById("canvas");

    var userElem = document.getElementById("users");

    var clear = document.getElementById("clear");
    var errTooltip = document.getElementById("err_tooltip")

    var userSettingsButtons = [];
    
    var kickUser = (userid) => {
      console.log(" kickiing " + (userid = userid.substring(2)));
      ws.send(JSON.stringify({'type':'op', 'data':{'type':'kickuser', 'data':{userid}}}))
    }
    var renameUser = (ruserid, rname) => {
      ruserid = ruserid.substring(2)
      ws.send(JSON.stringify({'type':'op', 'data':{'type':'nameuser', 'data':{ruserid, rname}}}))
    }

    var getKickElem = (id) => {
      var kickElem = document.createElement("div");
      kickElem.className = "useredit kick";
      kickElem.id = "ke" + id;
      kickElem.textContent = "kick"
      kickElem.onclick = function() { kickUser($(this)[0].id) }
      return kickElem
    }
    var getRenameElem = (id) => {
      var renameElem = document.createElement("div");
      renameElem.className = "useredit rename";
      renameElem.id = "rn" + id;
      renameElem.textContent = "rename"
      renameElem.onclick = function() { renameUser($(this)[0].id, "jahksbdf") }
      return renameElem
    }

    var getUserEditBox =(user) => {
      var div = document.createElement("div");
      div.id = "edit" + user.id;
      div.className = "useredit closed";

      //add owner perms
      if(myUser.auth == "owner") {
        //add non-self perms
        if(myUser.id != user.id) {
          //kick elem
          div.appendChild(getKickElem(user.id));
        }
        //name elem
        div.appendChild(getRenameElem(user.id));
      }
      return div;
    }

    const userHasAuth = () => {
      return myUser.auth == "owner";
    }

    var sendColor = (color) => {
      ws.send(JSON.stringify({'type':'op', 'data':{'type':'usercolor', 'data':{color}}}))
    }
    var receiveColor = (color) => {
      myUser.color = color[0].color;
    }
    ///

    var receiveName = (name) => {
      myUser.name = name;
    }


    var clearCanvas = () => {
      console.log("clearingcanvas")
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    }
    var toggleUserEdit = (elem) => {
      if(elem.className === "useredit open") {
        clearTimeout();
        elem.className = "useredit closed";
        //setTimeout(function() {elem.style.setProperty('margin-top','0vw')}, 1000)
      } else {
        clearTimeout();
        elem.className = "useredit open";
      }
    }
    
    var setUsers =(usersdata)=> {
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

        var div = document.createElement("div");
        div.className = `c${c}`;
        div.id = user.id;
        var name = (user.name != "" ? user.name : user.id);
        div.textContent = (user.id == id ? name + " (me)" : (user.auth == "owner" ? name + " (owner)" : name));
        
        var userSettings = document.createElement("img");
        userSettings.id = user.id;
        userSettings.className = "usersettings";
        userSettings.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAABcUlEQVRIia2WvU7DMBSFv9KWofAC0Lmq+Bk6MSGViQ4gGCjPhECgvhAKkAJSgLLwGmyNMhTSMuQGnMg/acKRrpTY95xzbceOaxTHKrAmzyHwtQS3EN6BhcT4v8WbwEwxiIB6WbEeEAADpW1bEU+jo/QPhNMrIv4pAnNgBJyRTEne4A44BW4kdyFcq4mvEVo2HmwG+8B3BfEYOLAZAFxVMLjIizU0Bq8G4xB4kec9YF2T82irvAnsAs+aynxgQ8ndRL/wHrAlWplRTMh+52pMc+KqSWjgzIA30aZlSErj1jJqz8FtrVjIKWol+37RIFmcyFDFlGQ68mhjnqKIZI0yH1Ed6AJPGsI4Z9KWonSL3MFxTp0bqgpFwLNUfmwTTjEykIvEtUv8kL+Dq0zMgSObQVBBPI3AZqAe1zFwCQzR79p74ERyYmlzHtepiQ/0lbYdjUFX6e8LxyluQulfZpGdDMkN4kN5n5BMixOFtrqg1LXlB2vw9K/XiPbzAAAAAElFTkSuQmCC"
        userSettings.onclick = function() { toggleUserEdit(document.getElementById("edit"+($(this)[0].id))) }
        div.appendChild(userSettings);
        userElem.appendChild(div);
        userElem.appendChild(getUserEditBox(users.find(x => x.id == userSettings.id)));
        userElem.appendChild(document.createElement("br"));
        document.getElementById(user.id).style.setProperty('box-shadow', `10px 0px 0px ${user.color} inset`);
      }
      clear.className = myUser.auth;
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
            clearCanvas();
            for(op of data.data.img) {
              canvas.draw(op.data);
            }
            break;
          case 'get':

            var img = canvas.getContext('2d').getImageData(0, 0, 500, 500);
            ws.send(JSON.stringify({'type':'canvas', 'data': { img }}));

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
                clearCanvas();
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

    canvas.onmousemove = (evt) => {
        if(pressed) {
            const messageBody = {'type': 'draw', 'data': {'last': {x: lastpos.x, y: lastpos.y }, 'new': {x: evt.clientX, y: evt.clientY }, 'id': myUser.id, 'color': myUser.color}};
            canvas.draw(messageBody.data);
            ws.send(JSON.stringify(messageBody));
        }
        lastpos = { x: evt.offsetX, y: evt.offsetY };
    }
    document.onmousedown = (evt) => { pressed = true; }
    document.onmouseup = (evt) => { pressed = false; }

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
        window.open("http://3.84.15.164:8081", '_self');
        resolve();
      });
    });
  }
  