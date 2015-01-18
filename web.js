var bodyParser  = require("body-parser"),
    exec        = require("child_process").exec,
    express     = require("express"),
    Firebase    = require("firebase"),
    fs          = require("fs"),
    githubAPI   = require("github"),
    logfmt      = require("logfmt")
    request     = require("request");

// Note: This is a map of route, as in the URL after the domain, to the name of the jade file, so they don't have to be the same
var routeMap =  {
    'printing':     'selling',
    'projects':     'projects',
    'makerspaces':  'generalinfo',
    'github':       'github'
};

// Stolen from StackOverflow for its compactness. Seems to be Knuth shuffle.
function shuffle(o) {
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

var app = express();


// Static serving files from specific folders
app.use('/foundation',  express.static(__dirname + '/site-wide-resources/foundation'));
app.use('/css',         express.static(__dirname + '/site-wide-resources/css'));
app.use('/js',          express.static(__dirname + '/site-wide-resources/js'));
app.use('/images',      express.static(__dirname + '/site-wide-resources/images'));
app.use('/static',      express.static(__dirname + '/site-wide-resources/static'));

// Other stuff to use
app.use(logfmt.requestLogger());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// General middleware stuff
app.use(function(req, res, next) {
    // Save the current url, from the request, to the response's local variables, for use in jade
    res.locals.url = req.url;

    // Set up a links variable in responses's local variables, for use in jade
    res.locals.siteWideLinks = [
        { href: '/wave',         display: 'WAVE Course Schedule' },
        // { href: '/projects',    , display: 'Projects' },
        // { href: '/printing',    , display: '3D Printing' },
        // { href: '/makerspaces', , display: 'About Makerspaces' },
        { href: '/github',       display: 'GitHub Competition' },
        { href: '/members',      display: 'About Us' },
        { href: '/feedback',         display: 'Feedback/Bugs' }
    ];

    next();
});

app.use('/', require('./sub-projects/main-page/route.js'));
// app.get('/', function(req, res) {
//     res.render('main.jade');
// });


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

// Simple feedback page
app.get('/feedback', function(req, res) {
    res.render('feedback.jade');
});
// Posts on the feedback are recreated as GitHub issues
app.post('/feedback', function(req, res) {
    var url = 'https://api.github.com/repos/WheatonWHALE/whaleweb/issues';
    var headers = {
        'User-Agent': 'bawjensen'
    }

    var title = req.body.subject + ': ' + req.body.title;
    var body = 'Posted by ' + req.body.name + ':\n\n' + req.body.feedback;

    var github = new githubAPI({
        version: '3.0.0'
    });

    github.authenticate({
        type: "basic",
        username: 'bawjensen',
        password: 'a3db061e48f534e35b620e6bb8b5abb0800e0618'
    });

    github.issues.create({
        title:      title,
        body:       body,
        user:       'WheatonWHALE',
        repo:       'whaleweb',
        labels:     []
    }, function handleResponse(err, data) {
        if (err) {
            console.error(err);
        }
        else {
            res.locals.issueURL = data.html_url;
            res.render('thanks.jade');
        }
    });
});

// URL for fetching data for the wave page. 
app.get('/wave/data', function(req, res) {
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

app.use('/wave', require('./sub-projects/wave/route.js'));

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
var port = (process.argv[2] != "undefined" ? process.argv[2] : undefined) || 7500;
// Start up the server
app.listen(port, function() {
    console.log("Listening on " + port);
});
