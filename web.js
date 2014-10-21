var exec        = require("child_process").exec,
    express     = require("express"),
    Firebase    = require("firebase"),
    logfmt      = require("logfmt"),
    fs          = require("fs");

// Note: This is a map of route, as in the URL after the domain, to the name of the jade file, so they don't have to be the same
var routeMap =  {
    'printing':     'selling',
    'projects':     'projects',
    'makerspaces':  'generalinfo',
    'github':       'compete'
};

// Stolen from StackOverflow for its compactness. Seems to be Knuth shuffle.
function shuffle(o) {
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

var app = express();


// Static serving files from specific folders
app.use('/foundation',  express.static(__dirname + '/foundation'));
app.use('/css',         express.static(__dirname + '/css'));
app.use('/js',          express.static(__dirname + '/js'));
app.use('/images',      express.static(__dirname + '/images'));
app.use('/static',      express.static(__dirname + '/static'));
app.use(logfmt.requestLogger());


// Middleware to save the current url, from the request, to the responses' local variables, for use in jade
app.use(function(req, res, next) {
    res.locals.url = req.url;
    res.locals.links = [
        { href: '/github',       display: 'GitHub Competition' },
        { href: '/wave',         display: 'WAVE Course Schedule' },
        // { href: '/projects',    , display: 'Projects' },
        // { href: '/printing',    , display: '3D Printing' },
        // { href: '/makerspaces', , display: 'About Makerspaces' },
        { href: '/members',      display: 'About Us' }
    ];
    next();
});


// Special route for the main page
app.get('/', function(req, res) {
    res.render('main.jade');
});


// Special route for requesting an update to the competitions database
app.get('/refresh-competitions', function(req, res) {
    var child = exec('node cronjobs/cron.hourly/competitions-cron.js', function(error, stdout, stderr) {
        console.log(stdout);
        if (stderr) {
            console.error(stderr);
            console.log('Errored while updating the competitions');
        }
        else {
            console.log('Updated the competitions');
        }
    });
    res.end('Success!');
});


app.get('/wave-data', function(req, res) {
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


app.get('/wave', function(req, res) {
    res.render('wave.jade', { year: req.query.year || '2014-2015' });
});


app.get('/members', function(req, res) {
    fs.readFile('static/member-data/members.json', function renderPageWithJSON(err, json) {
        if (err) {
            console.error(err);
            res.render('404.jade');
        }
        else {
            res.render('members.jade', { members: shuffle(JSON.parse(json)) }); // Shuffled (for production)
            // res.render('members.jade', { members: JSON.parse(json) }); // Unshuffled (for debugging)
        }
    });
});


// General route for any pages that're static/fully front-end, and just need their jade file parsed and served
app.get('/:route', function(req, res) {
    console.log('Request at: ' + req.params.route);
    var requestRoute = req.params.route,
        rerouted = routeMap[requestRoute] || '404';

    res.render(rerouted + '.jade');
});


app.get('*', function(req, res){
    res.render('404.jade');
});


// Server on port 7500
var port = 7500;
// Start up the server
app.listen(port, function() {
    console.log("Listening on " + port);
});
