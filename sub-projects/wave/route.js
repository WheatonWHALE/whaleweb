var bodyParser  = require('body-parser')
    express     = require('express'),
    fs          = require('fs'),
    session     = require('express-session');

var basePath = './sub-projects/wave/';
var userScheduleDataDir = './sub-projects/wave/data/schedule-data/'

var app = express();

app.use('/css',  express.static(basePath + 'css/'));
app.use('/js',   express.static(basePath + 'js/'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'cyclical secrets',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 3600000 } // one hour
}));

app.set('views', basePath + 'views/');

app.get('/', function(req, res) {
    fs.readFile(userScheduleDataDir + req.session.id + '.json', function(err, data) {
        var scheduleData = err ? null : data;
        res.render('wave.jade', { semester: req.query.semester || '201620', scheduleData: scheduleData, sessionId: req.session.id });
    });
});

app.post('/save', function(req, res) {
    var sessId = req.body.sessionId;
    var sessSchedData = JSON.parse(req.body.schedule);

    console.log('Saving ' + JSON.stringify(sessSchedData) + ' under ' + sessId);

    fs.writeFile(userScheduleDataDir + sessId + '.json', JSON.stringify(sessSchedData));

    res.send(true);
});

// URL for fetching data for the wave page. 
app.get('/data', function(req, res) {
    var semester = req.query.semester || '201510';
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