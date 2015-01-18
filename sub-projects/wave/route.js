var express = require('express');

var basePath = './sub-projects/wave/';

var app = express();

app.set('views', basePath + 'views/');

app.get('/', function(req, res) {
    res.render('wave.jade', { year: req.query.year || '2014-2015' });
});

// URL for fetching data for the wave page. 
app.get('/data', function(req, res) {
    var year = req.query.year || '2014-2015';
    var errorMessage = '';

    var expectedFilePath = 'static/course-data/compiled/' + year + '.html';

    fs.readFile(expectedFilePath, function(err, data) {
        if (err) {
            console.log(err);
        }
        else {
            res.send(data);
        }
    });
});

module.exports = app;