var bodyParser  = require("body-parser"),
    express     = require("express"),
    logfmt      = require("logfmt");

var app = express();

// Directory for all site-wide resource files (images, css, javascript, etc.)
var siteWideDir = 'site-wide-resources/';

// Static serving files from specific folders (uses the site-wide resource dir)
app.use('/foundation',  express.static(__dirname + '/' + siteWideDir + 'foundation'));
app.use('/css',         express.static(__dirname + '/' + siteWideDir + 'css'));
app.use('/js',          express.static(__dirname + '/' + siteWideDir + 'js'));
app.use('/images',      express.static(__dirname + '/' + siteWideDir + 'images'));
app.use('/static',      express.static(__dirname + '/' + siteWideDir + 'static'));

app.set('views',        siteWideDir + 'views');

// Other stuff to use
app.use(logfmt.requestLogger()); // Logs the activity to the console
app.use(bodyParser.urlencoded({ extended: true })); // Allows for data to be passed through POST requests
app.use(bodyParser.json()); // Allows for data to be passed as JSON through POST requests

// General middleware for all routes
app.use(function(req, res, next) {
    // Save the current url, from the request, to the response's local variables, for use in jade
    res.locals.url = req.url;

    // Set up a links variable in responses's local variables, for use in jade
    res.locals.siteWideLinks = [
        { href: '/wave/',         display: 'WAVE Course Schedule' },
        // { href: '/projects',    , display: 'Projects' },
        // { href: '/printing',    , display: '3D Printing' },
        // { href: '/makerspaces', , display: 'About Makerspaces' },
        { href: '/github/',       display: 'GitHub Competition' },
        { href: '/members/',      display: 'About Us' },
        { href: '/feedback/',     display: 'Feedback/Bugs' }
    ];

    next();
});

// Redirecting behavior for top-level routes (the first route of a sub-project)
// Makes sure that every url has a trailing slash, so all assets are 
app.use(function(req, res, next) {
    if (req.path.match(/^\/(wave|github|feedback|members)$/)) {
        res.redirect(301, req.url + '/');
    }
    else 
        next();
});


// Sub-applications and their corresponding router files
app.use('/',            require('./sub-projects/main-page/route.js'));
app.use('/github/',      require('./sub-projects/github/route.js'));
app.use('/feedback/',    require('./sub-projects/feedback/route.js'));
app.use('/wave/',        require('./sub-projects/wave/route.js'));
app.use('/members/',     require('./sub-projects/members/route.js'));

// Finally, a catch-all for 404
app.get('*', function(req, res) {
    console.log('404 for the route:', req.url);
    res.render('404.jade');
});

// Server on port or defaults to 7500
var port = (process.argv[2] != "undefined" ? process.argv[2] : undefined) || 7500;

// Start up the server
app.listen(port, function() {
    console.log("Listening on " + port);
});
