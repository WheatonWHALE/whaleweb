var express = require("express");

var app = express();


app.get('/', function(req, res) {
  res.render( 'selling.jade');
});


// var port = process.env.PORT || 7500;
var port = 80; // Have to be sudo to run on 80

app.listen(port, function() {
  console.log("Listening on " + port);
});
