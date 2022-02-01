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

wss.on("connection", function connection(ws, req) {
    
    ws.id = wss.getUniqueID();

    console.log(ws.id);

    if(wss.clients.size == 1) {
        ws.auth = "owner"
    } else {
        ws.auth = "guest"
    }
    ws.send(JSON.stringify({'auth': ws.auth, 'id': ws.id}))

    ws.on("message", (msg) => {
        [...wss.clients.keys()].forEach((client) => {
            client.send(msg);
        });
    });
  
    ws.on("close", (ws) => {
        if(ws.auth == "owner") {
            [...wss.clients.keys()].forEach((client) => {
                client.send("owner closed")
                client.close();
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
app.listen(8081)

app.use(function (req, res, next) {
    res.status(x => x >= 400).redirect('/');
})