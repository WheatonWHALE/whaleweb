var exec        = require("child_process").exec,
    express     = require("express"),
    Firebase    = require("firebase"),
    logfmt      = require("logfmt"),
    fs          = require("fs");

// Note: This is a map of route, as in the URL after the domain, to the name of the jade file, so they don't have to be the same
var routeMap =  {
    'printing':     'selling',
    'members':      'members',
    'projects':     'projects',
    'makerspaces':  'generalinfo',
    'github':       'compete'
    // 'wave':         'wave'
};

var app = express();

// Middleware to save the current url, from the request, to the responses' local variables, for use in jade
app.use(function(req, res, next) {
    res.locals.url = req.url;
    next();
});

// Special route for the main page, to load the correct jade file
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
    var year = req.query.year;
    var currentYear = '2014-2015';
    var errorMessage = '';

    var expectedFilePath = 'static/course-data/compiled/' + year + '.html';

    fs.exists(expectedFilePath, function(exists) {
        if (!exists) {
            if (year != undefined) {
                errorMessage = 'Error loading the requested year (' + year + '). Defaulted to ' + currentYear + '.';
            }

            year = currentYear; // Default to the current year
            expectedFilePath = 'static/course-data/compiled/' + year + '.html';
        }

        fs.readFile(expectedFilePath, function(err, data) {
            if (err) {
                console.log(err);
            }
            else {
                res.send(data);
            }
        });
    });
});

// Special route for everything to do with WAVE
app.get('/wave', function(req, res) {
    var year = req.query.year || '2014-2015';

    res.render('wave.jade', { /*dynamicData: data,*/ year: year, /*errorMessage: errorMessage*/ });
});

// General route for any pages that're static/fully front-end, and just need their jade file parsed and served
app.get('/:route', function(req, res) {
    console.log('Request at: ' + req.params.route);
    var code = 200;
    var requestRoute = req.params.route,
        rerouted = routeMap[requestRoute];

    if (rerouted == undefined) {
        rerouted = '404';
        code = 404;
    }
    
    res.render(rerouted + '.jade', code);
});

// Configure the static folders that're ok to serve to anyone who asks (a.k.a. most browsers looking for javascript files, etc.)
app.use(logfmt.requestLogger());

// Static serving files from specific folders
app.use('/foundation-custom', express.static(__dirname + '/foundation'));
app.use('/foundation', express.static(__dirname + '/foundation'));
app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));
app.use('/images', express.static(__dirname + '/images'));
app.use('/static', express.static(__dirname + '/static'));

// app.get('*', function(req, res){
//     res.render('404.jade');
// });

// Server on port 7500
var port = 7500;
if (process.argv[2] != 'undefined' && process.argv[2] != undefined) port = process.argv[2];

// Start up the server
app.listen(port, function() {
    console.log("Listening on " + port);
});
