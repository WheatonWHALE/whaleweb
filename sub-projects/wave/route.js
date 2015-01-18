var bodyParser  = require('body-parser')
    express     = require('express'),
    fs          = require('fs');

var basePath = './sub-projects/wave/';

var app = express();

app.use('/css',  express.static(basePath + 'css/'));
app.use('/js',   express.static(basePath + 'js/'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('views', basePath + 'views/');

app.get('/', function(req, res) {
    res.render('wave.jade', { semester: req.query.semester || '201620' });
});

// URL for fetching data for the wave page. 
app.get('/data', function(req, res) {
    var semester = req.query.semester || '201510';
    var errorMessage = '';

    var expectedFilePath = basePath + 'data/course-data/compiled/' + semester + '.html';

    fs.readFile(expectedFilePath, function(err, data) {
        if (err) {
            console.log(err);
            res.send({}); // TODO: Improve temp solution
        }
        else {
            res.send(data);
        }
    });
});

module.exports = app;