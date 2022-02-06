const express = require('express');
const cors = require('cors');
const app = express()
bodyParser = require("body-parser");
app.use(bodyParser());
app.use(cors());
const path = require('path')
app.use(express.static('./func'));//, express.static(path.join(__dirname, 'func')))
app.use(express.static('./img'));

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