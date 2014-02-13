var express = require("express"),
	Firebase = require("firebase"),
	logfmt = require("logfmt");

var routeMap = new Object();
routeMap[''] = 'main';
routeMap['printing'] = 'selling';
routeMap['members'] = 'members';
routeMap['projects'] = 'projects';

var app = express();

app.configure(function() {
	app.use(logfmt.requestLogger());
	app.use('/static', express.static(__dirname + '/static'));
	app.use('/images', express.static(__dirname + '/images'));
});

app.get('/', function(req, res) {
	res.render('main.jade');
});

app.get('/:route', function(req, res) {
	res.render(routeMap[req.params.route] + '.jade');
});


var port = 7500;
if (process.argv[2] != 'undefined') port = process.argv[2];

app.listen(port, function() {
	console.log("Listening on " + port);
});