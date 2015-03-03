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
        { href: '/feedback/',     display: 'Feedback/Bugs' },
        { href: '/vigenere/',     display: 'Vigenere Cipher' }
    ];

    next();
});

var allProjects = [
    { route: '/',           routerPath: './sub-projects/main-page/route.js' },
    { route: '/github',     routerPath: './sub-projects/github/route.js' },
    { route: '/feedback',   routerPath: './sub-projects/feedback/route.js' },
    { route: '/wave',       routerPath: './sub-projects/wave/route.js' },
    { route: '/members',    routerPath: './sub-projects/members/route.js' },
    { route: '/vigenere',   routerPath: './sub-projects/vigenere-cipher/route.js' }
];

app.use(function(req, res, next) {
    var projectRoutes = allProjects.map(function(entry) { return entry.route; });
    var projectMatcher = new RegExp('^\\/(' + projectRoutes.join('|') + ')$');

    // if (req.path.match(/^\/(wave|github|feedback|members)$/)) {
    if (req.path.match(projectMatcher)) {
        res.redirect(301, req.url + '/');
    }
    else {
        next();
    }
});

// Assign/register all the sub projects in allProjects
allProjects.forEach(function registerRouter(subApp) {
    app.use(subApp.route, require(subApp.routerPath));
});

// Catch-all for 404
app.get('*', function(req, res) {
    console.log('404 for the route=' + req.url);
    res.render('404.jade');
});

// Server on port 7500
var port = (process.argv[2] != "undefined" ? process.argv[2] : undefined) || 7500;
// Start up the server
app.listen(port, function() {
    console.log("Listening on " + port);
});
