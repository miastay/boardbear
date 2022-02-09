const express = require('express');
const cors = require('cors');
const app = express()
// bodyParser = require("body-parser");
// app.use(bodyParser());
app.use(cors());
const path = require('path')
app.use(express.static('./func'));//, express.static(path.join(__dirname, 'func')))
app.use(express.static('./static'));
app.use(express.static('./static/uploads'));
app.use(express.static('./upload'));
app.use(express.static('./style'));
var multer  = require('multer');
var upload = multer({ dest: '/home/ec2-user/WebApp/boardbear/src/upload' });
const fs = require('fs');
const gm = require('gm');
const { fromPath } = require("pdf2pic");
const ajv = require("ajv");

const os = require('os');

/*//////////

    Global Logic

*///////////

Object.defineProperty(global, '__stack', {
    get: function() {
            var orig = Error.prepareStackTrace;
            Error.prepareStackTrace = function(_, stack) {
                return stack;
            };
            var err = new Error;
            Error.captureStackTrace(err, arguments.callee);
            var stack = err.stack;
            Error.prepareStackTrace = orig;
            return stack;
    }
});
Object.defineProperty(global, '__function', {
    get: function() {
            return __stack[2].getLineNumber();
        }
});


/**
 * 
 * 
 */


/*//////////

    App Logic

*///////////

function appRun() {

    console.log = (msg) => {
        console.debug("[ app->" + (__function) + " @ " + new Date().toLocaleString() + "]: ", msg)
    }

    /*      board storage & logic
    */
    var boards = [
        {
            'name': 'default_board',
            'code': '000000',
            'port': 8091
        }
    ];

    // matches the following json object:
    // board = {
    //     'name': 'string',
    //     'code': 6-digit Number,
    //     'port': 4 digit port (8082 --> 9999)
    // }

    const getBoardByCode = (code) => {
        return boards.find(x => x.code == code);
    }

    var savedFiles = [];

    /*
    */
    
    app.get('/', (req, res) => {
        if(req.header('x-forwarded-proto') == 'https') {
            res.redirect("http://boardbear.ryantaylor.link");
            return;
        }
        const options = {
            root: './'
        }
        res.sendFile('home.html', options)
    })
    app.post('/', upload.single('ffupload'), function(req, res){

        console.log("HANDLING POST")
        console.log(req.file.path)

        var maxq = req.body.quality ? (4000 * (Number.parseInt(req.body.quality)/100)) : 0;
        console.log(req.body.replace)
        
        // if(req.body.replace) {
        //     fs.readdir('./static/uploads', function(err, files) {
        //         for(file of files) {
        //             console.log(file)
        //         }
        //         /*
        //         req.body.replace.
        //         fs.rm*/
        //     });
        // }

        gm(req.file.path)
        .size(function (err, size) {
        if (!err) {
            const aspect_ratio = (size.width*1.0)/size.height;
            console.log(aspect_ratio)
            const options = {
                density: 100,
                saveFilename: req.file.filename,
                savePath: "./static/uploads",
                format: "png", 
                width: maxq,//aspect_ratio*maxq,
                height: maxq/aspect_ratio
            };
            var cvt = fromPath(req.file.path, options);
            cvt(1).then(function() {res.json({'url': req.file.filename + ".1.png"});});
        } else {
            res.json('');
        }
        });
    });
    app.get('/join', function(req, res){
        console.log(req.query);
        const codein = req.query.code;
        const board = getBoardByCode(codein);
        if(codein && board) {
        }
        res.json({'board': board})
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
    app.get('/bb', (req, res) => {
        res.json({'new':'msg'})
    })
    app.listen(8081, function() {
        console.log(`running on port ${8081}`)
    })
    /*
    app.use(function (req, res, next) {
        res.status(x => x >= 400).redirect('/');
    })*/
}


/**
 * 
 * 
 */
/**
 * 
 * 
 */
/**
 * 
 * 
 */
/**
 * 
 * 
 */
/**
 * 
 * 
 */
/**
 * 
 * 
 */




/*//////////

    Socket Logic

*///////////

function socketRun() {

    console.log = (msg) => {
        console.debug("[ socket->" + (__function) + " @ " + new Date().toLocaleString() + "]: ", msg)
    }

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
            if(message.type != 'draw') console.log(message.type + " from " + ws.id)
            switch(message.type) {
                case 'close': {
                    ws.close(message.data);
                    break;
                }
                case 'draw':
                    {
                        //wss.canvas.image.push(message);
                        [...wss.clients.keys()].forEach((client) => {
                            if(ws.id != client.id) {
                                client.send(JSON.stringify({'type': 'draw', 'data': [message.data]}), (err) => {if(err) console.log(err)});
                            }
                        });
                    }
                    break;
                case 'bulkdraw':
                    {
                        wss.canvas.image.splice(0, 0, {'user': ws.id, 'data': message.data});
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
                        case 'userundo':
                            {
                                let lastop = wss.canvas.image.lastIndexOf(wss.canvas.image.find(op => op.user == ws.id));
                                console.log(wss.canvas.image + ";;" + lastop) 
                                if(lastop != -1) {
                                    wss.canvas.image.splice(lastop, 1);
                                    wss.sendAllCanvas();
                                }
                                ws.send(JSON.stringify({'type':'op', 'data':{'type':'userundo', 'data': (lastop != -1)}}))
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
};

/*
*/

appRun(); socketRun();


