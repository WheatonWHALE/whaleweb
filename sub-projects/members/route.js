var express = require('express'),
    fs      = require('fs');

// Stolen from StackOverflow for its compactness. Seems to be Knuth shuffle.
function shuffle(o) {
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

var basePath = './sub-projects/members/';

var app = express();

app.set('views', basePath + 'views/');

app.use('/css', express.static(basePath + 'css/'));

app.get('/', function(req, res) {
    fs.readFile(basePath + 'data/member-data/members.json', function renderPageWithJSON(err, json) {
        if (err) {
            console.log(err.stack);
            // res.render('404.jade');
            res.send(err);
        }
        else {
            res.render('members.jade', { members: shuffle(JSON.parse(json)) }); // Shuffled (for production)
            // res.render('members.jade', { members: JSON.parse(json) }); // Unshuffled (for debugging)
        }
    });
});

module.exports = app;