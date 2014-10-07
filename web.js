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

app.get('/', function(req, res) {
    res.render('main.jade');
});

app.get('/refresh-competitions', function(req, res) {
    var child = exec('node cronjob-node/competitions-cron.js', function(error, stdout, stderr) {
        console.log('Updated the competitions');
    });
    res.end('Success!');
});

app.get('/wave3', function(req, res) {
    var year = req.query.year;
    var currentYear = '2014-2015';
    var errorMessage = '';

    fs.exists('static/course-data/' + year + '.json', function(exists) {
        if (!exists) {
            if (year != undefined)
                errorMessage = 'Error loading the requested year (' + year + '). Defaulted to ' + currentYear + '.';

            year = currentYear; // Default to the current year
        }

        fs.readFile('static/course-data/' + year + '.json', function(err, courseData) {
            if (err)
                console.log(err);
            else {
                fs.readFile('static/course-data/filters.json', function(err, filterData) {
                    if (err)
                        console.log(err);
                    else
                        res.render('wave3.jade', { courseData: JSON.parse(courseData), filterData: JSON.parse(filterData), errorMessage: errorMessage });
                });
            }
        });
    });
});

app.get('/wave2', function(req, res) {
    var year = req.query.year;
    var currentYear = '2014-2015';
    var errorMessage = '';

    fs.exists('static/course-data/' + year + '.json', function(exists) {
        if (!exists) {
            if (year != undefined)
                errorMessage = 'Error loading the requested year (' + year + '). Defaulted to ' + currentYear + '.';

            year = currentYear; // Default to the current year
        }

        fs.readFile('static/course-data/' + year + '.json', function(err, courseData) {
            if (err)
                console.log(err);
            else {
                fs.readFile('static/course-data/filters.json', function(err, filterData) {
                    if (err)
                        console.log(err);
                    else
                        res.render('wave2.jade', { courseData: JSON.parse(courseData), filterData: JSON.parse(filterData), errorMessage: errorMessage });
                });
            }
        });
    });
});

app.get('/wave', function(req, res) {
    var year = req.query.year;
    var currentYear = '2014-2015';
    var errorMessage = '';

    fs.exists('static/course-data/' + year + '.json', function(exists) {
        if (!exists) {
            if (year != undefined)
                errorMessage = 'Error loading the requested year (' + year + '). Defaulted to ' + currentYear + '.';

            year = currentYear; // Default to the current year
        }

        fs.readFile('static/course-data/' + year + '.json', function(err, courseData) {
            if (err)
                console.log(err);
            else {
                fs.readFile('static/course-data/filters.json', function(err, filterData) {
                    if (err)
                        console.log(err);
                    else
                        res.render('wave.jade', { courseData: JSON.parse(courseData), filterData: JSON.parse(filterData), errorMessage: errorMessage });
                });
            }
        });
    });
});

app.get('/:route', function(req, res) {
    console.log('Request at: ' + req.params.route);
    var requestRoute = req.params.route,
        rerouted = routeMap[requestRoute];

    if (rerouted == undefined)
        rerouted = '404';
    
    res.render(rerouted + '.jade');
});

app.configure(function() {
    app.use(logfmt.requestLogger());

    // Static serving files from specific folders
    app.use('/foundation', express.static(__dirname + '/foundation'));
    app.use('/css', express.static(__dirname + '/css'));
    app.use('/js', express.static(__dirname + '/js'));
    app.use('/images', express.static(__dirname + '/images'));
    app.use('/static', express.static(__dirname + '/static'));
});

var port = 7500;
if (process.argv[2] != 'undefined' && process.argv[2] != undefined) port = process.argv[2];

app.listen(port, function() {
    console.log("Listening on " + port);
});
