var express = require("express");

var app = express();

var routeMap = new Object();
routeMap['/'] = 'main'
routeMap['/printing'] = 'selling'
routeMap['/members'] = 'members'
routeMap['/projects'] = 'projects'


for (var key in routeMap) {
	app.get(key, function(req, res) {
	  res.render(routeMap[key] + '.jade');
	});
}


var port = 7500;
if (process.argv[2] != 'undefined') port = process.argv[2];

app.listen(port, function() {
  console.log("Listening on " + port);
});
