var express = require('express');

var basePath = './sub-projects/main-page/';

var app = express();

app.use('/css',         express.static(basePath + 'css'));
app.use('/js',          express.static(basePath + 'js'));
app.use('/static',      express.static(basePath + 'static'));

app.set('views',        basePath + 'views/');

app.get('/', function(req, res) {
    res.render('main.jade');
});

module.exports = app;