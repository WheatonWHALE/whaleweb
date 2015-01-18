var express = require('express');

var basePath = './sub-projects/main-page/';

var app = express();

app.set('views',        basePath + 'views/');
app.use('/css',         express.static(basePath + 'css'));
app.use('/js',          express.static(basePath + 'js'));

app.get('/', function(req, res) {
    res.render('main.jade');
});

module.exports = app;