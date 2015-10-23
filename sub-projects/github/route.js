var express     = require('express'),
    exec        = require("child_process").exec;

var basePath = './sub-projects/github/';

var app = express();

app.set('views', basePath + 'views/');

app.use('/css',     express.static(basePath + 'css/'));
app.use('/js',      express.static(basePath + 'js/'));
app.use('/static',  express.static(basePath + 'static/'));

app.get('/', function(req, res) {
    res.render('github.jade');
});

// Special route for requesting an update to the competitions database
app.get('/refresh-competitions', function(req, res) {
    var child = exec('node cronjobs/cron.hourly/github-cron.js', function(error, stdout, stderr) {
        console.log(stdout);
        if (stderr) {
            console.error(stderr);
            console.log('Errored while updating the competitions');
        }
        else {
            console.log('Updated the competitions');
        }
        res.send('Success!');
    });
});

module.exports = app;