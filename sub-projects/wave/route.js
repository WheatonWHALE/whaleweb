var express = require('express'),
    fs      = require('fs');

var basePath = './sub-projects/wave/';

var app = express();

app.set('views', basePath + 'views/');

app.use('/css',  express.static(basePath + 'css/'));
app.use('/js',   express.static(basePath + 'js/'));

app.get('/', function(req, res) {
    res.render('wave.jade', { year: req.query.year || '2014-2015' });
});

// URL for fetching data for the wave page. 
app.get('/data', function(req, res) {
    var year = req.query.year || '2014-2015';
    var errorMessage = '';

    var expectedFilePath = basePath + 'data/course-data/compiled/' + year + '.html';

    fs.readFile(expectedFilePath, function(err, data) {
        if (err) {
            console.log(err);
            res.send({}); // TODO: Improve temp solution
        }
        else {
            res.send(data);
        }
    });
});

module.exports = app;