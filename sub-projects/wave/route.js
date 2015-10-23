var bodyParser  = require('body-parser')
    express     = require('express'),
    fs          = require('fs'),
    session     = require('express-session');

// File path for this sub-project, relative to the master 'web.js' driver file (used for css routes, etc)
var BASE_PATH = './sub-projects/wave/';
// Directory for a user's schedule
var USER_SCHED_DATA_DIR = BASE_PATH + 'data/schedule-data/'

// ---------------- Figuring the default semester to show ----------------

/*
Wheaton internal system uses a YYYYSS system for Y = Year, S = Semester
For example:
 - Fall 2015: 201610. The fall is always '10', and the year is always the year of the graduating class
 - Spring 2016: 201620. The spring is always '20'.
 - Fall 2016: 201710. As you might expect.
 - Winter 2017: 201715. Winter belongs to the following year. This is the winter between Fall 2016 and Spring 2017.
 - Spring 2017: 201720. Fairly straightforward.
 - Summer 2017: 201735. For some reason this is 15 above the spring value, not the usual 5.
*/

// The default semester to show for new connections
var DEFAULT_SEMESTER;

var now = new Date();
var currentYear = now.getFullYear(); // i.e. 2016
var currentMonth = now.getMonth(); // 0-11 for Jan-Dec

// Spring classes begin:    end of January
// Spring advising happens  beginning of April
// Fall classes begin:      beginning of September
// Fall advising happens:   end of October

// Inclusive of January - February
if (currentMonth >= 0 && currentMonth <= 1) {       
    DEFAULT_SEMESTER = currentYear.toString() + '20'; // Same 'calendar' year, Spring semester
}
// Inclusive of March - September
else if (currentMonth >= 2 && currentMonth <= 8) {
    DEFAULT_SEMESTER = (currentYear + 1).toString() + '10'; // Next 'calendar' year, Fall semester
}
// Inclusive of October - December
else {
    DEFAULT_SEMESTER = (currentYear + 1).toString() + '20'; // Next 'calendar' year, Spring semester
}

// ---------------- Rest of the app --------------------------------------

// Create the sub-module
var app = express();

// Static host the js and css files
app.use('/css',  express.static(BASE_PATH + 'css/'));
app.use('/js',   express.static(BASE_PATH + 'js/'));

// These two allow for POST requests to contain JSON data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Allows use of session data storage
app.use(session({
  secret: 'cyclical secrets',   // Some random salt (doesn't matter what it is)
  resave: false,                // DON'T always resave the session, even if nothing's been changed
  saveUninitialized: true,      // Save empty sessions, even if they have no data
  cookie: { maxAge: 604800000 } // Save for *one week* of no changes
}));

// Load the views from the correct dir for this specific sub-module
app.set('views', BASE_PATH + 'views/');

// Function to load the data for the given list of semester codes
function readSemesterData(semesterList) {
    // Promise resolves when all sub-tasks are finished
    return Promise.all(
        // Map each semester code to a promise that fetches the corresponding data
        semesterList.map(function(semesterCode) {
            return new Promise(function(resolve, reject) {
                fs.readFile(BASE_PATH + 'data/course-data/raw-data/' + semesterCode + '.json', function(err, data) {
                    if (err)
                        reject(Error(err));
                    else
                        resolve({ code: semesterCode, data: JSON.parse(data) });
                });
            })
        })
    )
    .then(function convertToObject(semesterArray) {
        // Convert the array to a dictionary-esque object
        var semesterObj = {};

        semesterArray.forEach(function(entry) {
            semesterObj[entry.code] = entry.data;
        });

        return semesterObj;
    });
}

// Main route, loads basic data
app.get('/', function(req, res) {
    fs.readFile(USER_SCHED_DATA_DIR + req.session.id + '.json', function(err, data) {
        var cartData = err ? null : data;
        res.render('wave.jade', {
            semester: (req.query.semester || req.session.semester || DEFAULT_SEMESTER),
            cartData: cartData,
            sessionId: req.session.id
        });
    });
});

// Saving data from a user's session, usually right before they disconnect
app.post('/save', function(req, res) {
    var sessId = req.body.sessionId;
    var sessionCart = JSON.parse(req.body.cart);

    if (req.body.semester.length === 6) { // Only store valid semesters into session
        req.session.semester = req.body.semester;
    }

    fs.writeFile(USER_SCHED_DATA_DIR + sessId + '.json', JSON.stringify(sessionCart), function onceFinished(err) {
        if (err) res.send(false);
        else res.send(true);
    });
});

// URL for fetching data for the wave page. 
app.get('/data', function(req, res) {
    var semester = req.query.semester || DEFAULT_SEMESTER;

    fs.readFile(BASE_PATH + 'data/course-data/compiled/' + semester + '.html', function(err, data) {
        if (err) {
            console.log(err);
            // res.send({}); // TODO: Improve this temp solution
            res.status(404).send();
        }
        else {
            res.send(data);
        }
    });
});

// URL for fetching data for the wave page. 
app.get('/api', function(req, res) {
    var semester = req.query.semester;

    if (!semester) {
        fs.readFile(BASE_PATH + 'data/course-data/raw-data/filters.json', function(err, data) {
            if (err) {
                console.log(err);
                res.send(err);
            }
            else {
                data = JSON.parse(data);
                res.send(data.semester);
            }
        });
    }
    else {
        if (typeof semester == 'string') {
            semester = [semester];
        }

        readSemesterData(semester)
            .then(function(dataObj) {
                res.send(dataObj);
            });
    }
});

module.exports = app;