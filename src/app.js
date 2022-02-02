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
    
    if(wss.clients.size == 1) {
        ws.auth = "owner"
        wss.owner = ws;
    } else {
        ws.auth = "guest";
        var img = wss.image;
        ws.send(JSON.stringify({'type': 'image', 'data': { img }}), (err) => {if(err) console.log(err)});
    }

    ws.sendUsers = () => {
        var users = [];
        [...wss.clients.keys()].forEach((client) => {
            users.push({'id':[client.id], 'auth':[client.auth], 'color':['hsl(255, 100, 70)']})
        });
        [...wss.clients.keys()].forEach((client) => {
            client.send(JSON.stringify({'type': 'users', 'data': {users}}), (err) => {if(err) console.log(err)});
        });
    }

    var reauth = (ws) => {
        ws.send(JSON.stringify({'type': 'auth', 'data': {'auth': ws.auth, 'id': ws.id}}))
        ws.sendUsers();
        //if(ws != wss.owner) {get(wss.owner)};
    }
    
    reauth(ws)
    console.log("reauthed")
    ws.binaryType = "arraybuffer";

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
                console.log(message.data)
                if(message.data.type == 'usercolor') {
                    ws.color = message.data.data;
                    ws.send(JSON.stringify({'type': 'op', 'data': {'type': 'usercolor', 'data': [ws.color]}}));
                }
                break;
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
        wss.users = wss.users.filter(x => x.id != ws.id)
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