var express = require("express"),
	Firebase = require("firebase"),
	logfmt = require("logfmt")
	exec = require("child_process").exec;

var routeMap = new Object();
routeMap[''] = 'main';
routeMap['printing'] = 'selling';
routeMap['members'] = 'members';
routeMap['projects'] = 'projects';
routeMap['makerspaces'] = 'generalinfo';
routeMap['competitions'] = 'compete';

var app = express();

app.get('/', function(req, res) {
	res.render('main.jade');
});

app.get('/refresh-competitions', function(req, res) {
	var child = exec('node cronjob-node/cron.js',
		function(error, stdout, stderr) {
			console.log('Updated the competitions');
	});

	res.end('Success!');
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
    app.use('/static', express.static(__dirname + '/static'));
});

var port = 7500;
if (process.argv[2] != 'undefined' && process.argv[2] != undefined) port = process.argv[2];

app.listen(port, function() {
	console.log("Listening on " + port);
});
