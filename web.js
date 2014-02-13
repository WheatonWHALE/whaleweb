var express = require("express");
var Firebase = require("firebase");

var app = express();


app.get('/', function(req, res) {
  res.render('selling.jade');
});


var port = 7500;
if (process.argv[2] != 'undefined') port = process.argv[2];

app.listen(port, function() {
  console.log("Listening on " + port);
});
