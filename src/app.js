const express = require('express');
const cors = require('cors');
const app = express()
bodyParser = require("body-parser");
app.use(bodyParser());
app.use(cors());
const path = require('path')
app.use(express.static('./func'));//, express.static(path.join(__dirname, 'func')))
app.use(express.static('./img'));
app.use(express.static('./style'));
var multer  = require('multer');
var upload = multer({ dest: '/home/ec2-user/WebApp/boardbear/src/upload' });
const fs = require('fs');
const gm = require('gm');
const { fromPath } = require("pdf2pic");

const os = require('os')

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

    console.log(req.body)
   
    var maxq = req.body.quality ? (4000 * (Number.parseInt(req.body.quality)/100)) : 0;
    console.log(maxq)

    gm(req.file.path)
    .size(function (err, size) {
    if (!err) {
        const aspect_ratio = (size.width*1.0)/size.height;
        console.log(aspect_ratio)
        const options = {
            density: 100,
            saveFilename: "pdf",
            savePath: "./img",
            format: "png", 
            width: maxq,//aspect_ratio*maxq,
            height: maxq/aspect_ratio
        };
        var cvt = fromPath(req.file.path, options);
        cvt(1);
    } else {
    }
    });
    res.json('');
});
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
app.listen(8081)
/*
app.use(function (req, res, next) {
    res.status(x => x >= 400).redirect('/');
})*/

