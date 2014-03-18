var express = require("express"),
	Firebase = require("firebase"),
	logfmt = require("logfmt");

var routeMap = new Object();
routeMap[''] = 'main';
routeMap['printing'] = 'selling';
routeMap['members'] = 'members';
routeMap['projects'] = 'projects';

var app = express();

app.get('/', function(req, res) {
	res.render('main.jade');
});

app.get('/:route', function(req, res) {
	console.log('Request at: ' + req.params.route);
	res.render(routeMap[req.params.route] + '.jade');
});

app.configure(function() {
	app.use(logfmt.requestLogger());

	// Static serving files from specific folders
	app.use('/css', express.static(__dirname + '/css'));
	app.use('/js', express.static(__dirname + '/js'));
    app.use('/images', express.static(__dirname + '/images'));
});

var port = 7500;
if (process.argv[2] != 'undefined' || process.argv[2] != undefined) port = process.argv[2];

app.listen(port, function() {
	console.log("Listening on " + port);
});
