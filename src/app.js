const express = require('express');
const cors = require('cors');
const app = express()
bodyParser = require("body-parser");
app.use(util.overrideContentType())
app.use(bodyParser());
app.use(cors());
app.use(express.static('res'))
const fs = require('fs');

let {PythonShell} = require('python-shell')

var AWS = require('aws-sdk');
var path = require('path');
AWS.config.update({region: 'us-east-1'});
var credentials = new AWS.SharedIniFileCredentials({profile: 'default'});
AWS.config.credentials = credentials;
s3 = new AWS.S3();

var multer  = require('multer');
var http = require('http');
var upload = multer({ dest: '/home/ec2-user/WebApp/ffuploads' });

app.get('/boardbear', (req, res) => {
    const options = {
        root: './src/'
    }
    res.sendFile('home.html', options)
})

app.get('/boardbear.js', (req, res) => {
    const options = {
        root: './src/'
    }
    res.sendFile('script.js', options)
})

app.listen(8080)

app.use(function (req, res, next) {
    res.status(x => x >= 400).redirect('/');
})