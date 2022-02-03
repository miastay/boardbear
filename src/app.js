const express = require('express');
const cors = require('cors');
const app = express()
bodyParser = require("body-parser");
app.use(bodyParser());
app.use(cors());
app.use(express.static('res'))

const os = require('os')

const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: 8091 });

wss.image = [];

wss.on("connection", function connection(ws, req) {
    
    ws.id = wss.getUniqueID();

    console.log(ws.id + " connected");
    
    if(wss.clients.size == 1) {
        ws.auth = "owner"
        wss.owner = ws;
    } else {
        ws.auth = "guest";
        var img = wss.image;
        ws.send(JSON.stringify({'type': 'image', 'data': { img }}), (err) => {if(err) console.log(err)});
        //get(wss.owner);
    }

    wss.createUsers = () => {
        var userset = [];
        [...wss.clients.keys()].forEach((client) => {
            userset.push({'id':[client.id], 'auth':[client.auth], 'color':[client.color ? client.color : 'rgb(200, 200, 200)']})
        });
        return userset;
    }

    wss.sendUsers = (userset) => {
        [...wss.clients.keys()].forEach((client) => {
            client.send(JSON.stringify({'type': 'users', 'data': {userset}}), (err) => {if(err) console.log(err)});
        });
    }

    var reauth = (ws) => {
        ws.send(JSON.stringify({'type': 'auth', 'data': {'auth': ws.auth, 'id': ws.id}}))
        wss.sendUsers(wss.createUsers());
        //if(ws != wss.owner) {get(wss.owner)};
    }
    
    reauth(ws)

    wss.clearUserFromImage = (userid) => {
        if(wss.image != wss.image.filter(x => x.data.id != userid)) {
            wss.image = wss.image.filter(x => x.data.id != userid);
            return true;
        }
        return false;
    }
    wss.sendAllCanvas = () => {
        var img = wss.image;
        [...wss.clients.keys()].forEach((client) => {
            client.send(JSON.stringify({'type': 'image', 'data': { img }}), (err) => {if(err) console.log(err)});
        });
        
    }

    //ws.binaryType = "arraybuffer";

    ws.on("message", (msg) => {
        var message = JSON.parse(msg);
        switch(message.type) {
            case 'draw':
                {
                    wss.image.push(message);
                    [...wss.clients.keys()].forEach((client) => {
                        if(ws.id != client.id) {
                            client.send(msg, (err) => {if(err) console.log(err)});
                        }
                    });
                }
                break;
            case 'canvas':
                {
                    [...wss.clients.keys()].forEach((client) => {
                        if(client != wss.owner) {
                            client.send(wss.image[0], (err) => {if(err) console.log(err)});
                        }
                    });
                }
                break;
            case 'op':
                switch(message.data.type) {
                    case 'usercolor':
                        {
                            ws.color = message.data.data.color;
                            reauth(ws);
                        }
                        break;
                    case 'clearcanvas':
                        {
                            if(ws.id == wss.owner.id) {
                                wss.image = [];
                                [...wss.clients.keys()].forEach((client) => {
                                    client.send(JSON.stringify({'type':'op', 'data':{'type':'clearcanvas', 'data':''}}))
                                });
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
                                        if(wss.clearUserFromImage(client.id)) {
                                            wss.sendAllCanvas();
                                        }
                                        client.close(); 
                                        return; 
                                    }
                                });
                            }
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
        if(ws.auth == "owner") {
            console.log("owner logoff");
            var newowner = true;
            [...wss.clients.keys()].forEach((client) => {
                if(newowner) { client.auth = "owner"; newowner = false; wss.owner = client; };
                reauth(client);
            });
        }
    });
});
wss.getUniqueID = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4();
};

app.get('/', (req, res) => {
    const options = {
        root: './'
    }
    res.sendFile('home.html', options)
})
app.get('/boardbear.js', (req, res) => {
    const options = {
        root: './'
    }
    res.sendFile('script.js', options)
})
app.get('/boardbear.css', (req, res) => {
    const options = {
        root: './'
    }
    res.sendFile('style.css', options)
})
app.listen(8081)

app.use(function (req, res, next) {
    res.status(x => x >= 400).redirect('/');
})