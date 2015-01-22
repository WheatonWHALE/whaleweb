var bodyParser  = require('body-parser')
    express     = require('express'),
    fs          = require('fs'),
    session     = require('express-session');

var basePath = './sub-projects/wave/';
var userScheduleDataDir = './sub-projects/wave/data/schedule-data/'
var defaultSemester = '201520'; // Update as needed

var app = express();

app.use('/css',  express.static(basePath + 'css/'));
app.use('/js',   express.static(basePath + 'js/'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'cyclical secrets',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 604800000 } // one week
}));

app.set('views', basePath + 'views/');

app.get('/', function(req, res) {
    fs.readFile(userScheduleDataDir + req.session.id + '.json', function(err, data) {
        var cartData = err ? null : data;
        res.render('wave.jade', {
            semester: (req.query.semester || req.session.semester || defaultSemester),
            cartData: cartData,
            sessionId: req.session.id//,
            // errorMessage: 'This is a long ass error message... This is a long ass error message... This is a long ass error message... This is a long ass error message... '
        });
    });
});

app.post('/save', function(req, res) {
    var sessId = req.body.sessionId;
    var sessionCart = JSON.parse(req.body.cart);
    req.session.semester = req.body.semester;

    fs.writeFile(userScheduleDataDir + sessId + '.json', JSON.stringify(sessionCart), function onceFinished(err) {
        if (err) res.send(false);
        else res.send(true);
    });
});

// URL for fetching data for the wave page. 
app.get('/data', function(req, res) {
    var semester = req.query.semester || defaultSemester;
    var errorMessage = '';

    var expectedFilePath = basePath + 'data/course-data/compiled/' + semester + '.html';

    fs.readFile(expectedFilePath, function(err, data) {
        if (err) {
            console.log(err);
            res.send({}); // TODO: Improve this temp solution
        }
        else {
            res.send(data);
        }
    });
});

module.exports = app;