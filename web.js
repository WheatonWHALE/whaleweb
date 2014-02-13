var express = require("express");
var Firebase = require("firebase");

var app = express();

var routeMap = new Object();
routeMap['/'] = 'main'
routeMap['/printing'] = 'selling'
routeMap['/members'] = 'members'
routeMap['/projects'] = 'projects'


app.get('/:route', function(req, res) {
	console.log('Serving ' + req.params.route + '.jade');
	res.render(routeMap['/' + req.params.route] + '.jade');
});


var port = 7500;
if (process.argv[2] != 'undefined') port = process.argv[2];

app.listen(port, function() {
	console.log("Listening on " + port);
});