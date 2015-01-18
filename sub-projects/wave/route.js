var express = require('express');

var basePath = './sub-projects/wave/';

var app = express();

app.set('views', basePath + 'views/');

app.get('/', function(req, res) {
    res.render('wave.jade', { year: req.query.year || '2014-2015' });
});

module.exports = app;