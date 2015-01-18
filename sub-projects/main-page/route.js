var express = require('express');

var app = express();

app.set('views', ['./sub-projects/main-page/views/', app.get('views')]);

app.get('/', function(req, res) {
    res.render('main.jade');
});

module.exports = app;