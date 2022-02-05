const express = require('express');
const cors = require('cors');
const app = express()
bodyParser = require("body-parser");
app.use(bodyParser());
app.use(cors());
app.use(express.static('res'))

const os = require('os')

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