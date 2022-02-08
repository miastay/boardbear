const WebSocket = require('ws')
const http = require('http');
  
const wss = new WebSocket.Server({ port: 8091 });

wss.canvas = {
    'image': [],
    'dim': {'width': 1530, 'height': 1980},
    'url': ''
}

wss.background = "";
wss.regids = [];

wss.on("connection", function connection(ws, req) {

    /**
     * 
     *          Socket Functions
     * 
     **/

    wss.createUsers = () => {
        var userset = [];
        [...wss.clients.keys()].forEach((client) => {
            userset.push({'id':[client.id], 'auth':[client.auth], 'brush': ([client.brush ? client.brush : {'color': 'rgb(0, 0, 0)', 'radius': '5', 'scaleWithCanvas': true}])[0], 'name':[client.name ? client.name : '']})
        });
        return userset;
    }
    wss.sendUsers = (userset) => {
        [...wss.clients.keys()].forEach((client) => {
            if(client.readyState == client.OPEN) {
                client.send(JSON.stringify({'type': 'users', 'data': {userset}}), (err) => {if(err) console.log(err)});
            }
        });
    }

    var reauth = (ws) => {
        ws.send(JSON.stringify({'type': 'auth', 'data': {'auth': ws.auth, 'id': ws.id}}))
        wss.sendUsers(wss.createUsers());
        console.log(wss.regids)
    }

    wss.clearUserFromImage = (userid) => {
        if(wss.canvas.image != wss.canvas.image.filter(x => x.data.id != userid)) {
            wss.canvas.image = wss.canvas.image.filter(x => x.data.id != userid);
            return true;
        }
        return false;
    }
    wss.sendAllCanvas = () => {
        [...wss.clients.keys()].forEach((client) => {
            if(client.readyState == client.OPEN)
                client.send(JSON.stringify({'type': 'canvas', 'data': [wss.canvas]}), (err) => {if(err) console.log(err)});
        });
        
    }

    /**
     * 
     *          Socket Handling
     * 
     **/

    ws.on("message", (msg) => {
        var message = JSON.parse(msg);
        console.log(message)
        switch(message.type) {
            case 'draw':
                {
                    wss.canvas.image.push(message);
                    [...wss.clients.keys()].forEach((client) => {
                        if(ws.id != client.id) {
                            client.send(JSON.stringify({'type': 'draw', 'data': [message.data]}), (err) => {if(err) console.log(err)});
                        }
                    });
                }
                break;
            case 'canvas':
                {
                    console.log("canvas")
                    console.log(message.data)
                    wss.canvas.dim = message.data.dim;
                    wss.canvas.url = message.data.url;
                    wss.sendAllCanvas();
                }
                break;
            case 'op':
                switch(message.data.type) {
                    case 'userbrush':
                        {
                            ws.brush = message.data.data.brush;
                            reauth(ws);
                        }
                        break;
                    case 'clearcanvas':
                        {
                            if(ws.id == wss.owner.id) {
                                wss.canvas.image = []; wss.canvas.url = '';
                                wss.sendAllCanvas();
                            }
                        }
                        break;
                    case 'kickuser':
                        {
                            console.log(message.data.data)
                            //user id is message.data.data
                            if(ws.id == wss.owner.id && ws.id != message.data.data.userid) {
                                console.log("kicking " + message.data.data.userid);
                                [...wss.clients.keys()].forEach((client) => {
                                    if(client.id == message.data.data.userid) 
                                    { 
                                        if(wss.clearUserFromImage(client.id) && client.readyState == client.OPEN) {
                                            wss.sendAllCanvas();
                                        }
                                        client.close(); 
                                        return; 
                                    }
                                });
                            }
                        }
                        break;
                    case 'nameuser':
                        {
                            console.log(message);
                            [...wss.clients.keys()].forEach((client) => {
                                if(client.id == message.data.data.ruserid) {
                                    client.name = message.data.data.rname;
                                }
                            });
                            reauth(ws);
                        }
                        break;
                    default:
                        break;
                }
            default:
                break;
        }
    });
  
    ws.on("close", (num) => {
        console.log("closed " + ws.id)
        wss.regids = wss.regids.filter(x => x != ws.id)
        if(ws.auth == "owner") {
            console.log("owner logoff");
            var newowner = true;
            [...wss.clients.keys()].forEach((client) => {
                if(newowner) { client.auth = "owner"; newowner = false; wss.owner = client; };
            });
        }
        [...wss.clients.keys()].forEach((client) => {
            reauth(client);
        });
    });

    /**
     * 
     *          First-time Calls
     * 
     **/


    ws.id = wss.getUniqueID(req.socket.remoteAddress);

    //if this IP is already registered, don't allow it
    var dup = wss.regids.find(x => x == ws.id)
    if(dup) {
        ws.close();
        return;
    } else {
        wss.regids.push(ws.id);
    }
    
    //assign the socket auth
    if(wss.clients.size == 1) {
        ws.auth = "owner"
        wss.owner = ws;
    } else {
        ws.auth = "guest";
    }
    reauth(ws)
    wss.sendAllCanvas()

});
function sfc32(a, b, c, d) {
    return function() {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
      var t = (a + b) | 0;
      a = b ^ b >>> 9;
      b = c + (c << 3) | 0;
      c = (c << 21 | c >>> 11);
      d = d + 1 | 0;
      t = t + d | 0;
      c = c + t | 0;
      return (t >>> 0) / 4294967296;
    }
}
function intSafev4(ip) {
    return [...ip.matchAll(/[0-9]{1,3}/g)].join('');
}
wss.getUniqueID = function (ip) {
    ip = intSafev4(ip);
    var seed = ip ^ 0xDEADBEEF;
    var rand = sfc32(0x9E3779B9, 0x243F6A88, 0xB7E15162, seed);
    for (var i = 0; i < 15; i++) rand();
    function s4() {
        return Math.floor((1 + rand()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4();
};

