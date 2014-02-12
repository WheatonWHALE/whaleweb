// web.js
var express = require("express"),
    logfmt = require("logfmt"),
    Firebase = require("firebase"),
    passport = require("passport"),
    LocalStrategy = require("passport-local").Strategy;

var app = express();

app.configure(function() {
	app.use(logfmt.requestLogger());
	app.use('/static', express.static(__dirname + '/static'));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.session( { secret: 'spectreCycle' } ));

  app.use(passport.initialize());
  app.use(passport.session());

	app.engine('.html', require('ejs').__express);
});

// passport.use(new LocalStrategy( function(username, password, done) {
//   User.findOne({ username: username }, function(err, user) {
//     if (err) { return done(err); }
//     if (!user) {
//       return done(null, false, { message: 'Incorrect Username.' });
//     }
//     if (!user.validPassword(password)) {
//       return done(null, false, { message: 'Incorrect Password.' });
//     }
//     return done(null, user);
//   });
// }));

// app.post('/login', passport.authenticate('local', {
//   successfulRedirect: '/create',
//   failureRedirect: '/',
//   failureFlash: false
// }));

app.post('/login', function(req, res) {
  console.log(req.body.username);
  console.log(req.body.password);
  res.redirect('/');
});

app.get('/', function(req, res) {
  res.render( 'index.jade', { 'title': 'W.U.B.Ex' } );
});

app.get('/sellingOffers', function(req, res) {
  res.render( 'forSale.jade', { 'title': 'Offers' } );
});

app.get('/buyingOffers', function(req, res) {
  res.render( 'requests.jade', { 'title': 'Requests' } );
});

app.get('/account', function(req, res) {
  res.render( 'account.jade', { 'title': 'Account' } );
});

app.get('/create', function(req, res) {
  res.render( 'createOffers.jade', { 'title': 'Create' } );
});

app.get('/test', function(req, res) {
  res.render( 'stupid.html' );
})

var port = process.env.PORT || 7500;

app.listen(port, function() {
  console.log("Listening on " + port);
});