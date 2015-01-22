var bodyParser  = require("body-parser"),
    express     = require("express"),
    logfmt      = require("logfmt");

var app = express();

var siteWideDir = 'site-wide-resources/';

// Static serving files from specific folders
app.use('/foundation',  express.static(__dirname + '/' + siteWideDir + 'foundation'));
app.use('/css',         express.static(__dirname + '/' + siteWideDir + 'css'));
app.use('/js',          express.static(__dirname + '/' + siteWideDir + 'js'));
app.use('/images',      express.static(__dirname + '/' + siteWideDir + 'images'));
app.use('/static',      express.static(__dirname + '/' + siteWideDir + 'static'));

app.set('views',        siteWideDir + 'views');

// Other stuff to use
app.use(logfmt.requestLogger());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

function enforceTrailingSlash(req, res, next) {
    if(req.url.substr(-1) != '/' && !(req.url.length - req.url.indexOf('.') <= 5) && (req.url.indexOf('?') == -1)) {
        console.log(req.url);
        console.log(req.url.length - req.url.indexOf('.'));
        res.redirect(301, req.url + '/');
    }
    else 
        next();
}

// Sub-applications
app.use(enforceTrailingSlash).use('/',            require('./sub-projects/main-page/route.js'));
app.use(enforceTrailingSlash).use('/github',      require('./sub-projects/github/route.js'));
app.use(enforceTrailingSlash).use('/feedback',    require('./sub-projects/feedback/route.js'));
app.use(enforceTrailingSlash).use('/wave', require('./sub-projects/wave/route.js'));
app.use(enforceTrailingSlash).use('/members',     require('./sub-projects/members/route.js'));

// Catch-all for 404
app.get('*', function(req, res){
    res.render('404.jade');
});

// Server on port 7500
var port = (process.argv[2] != "undefined" ? process.argv[2] : undefined) || 7500;
// Start up the server
app.listen(port, function() {
    console.log("Listening on " + port);
});
