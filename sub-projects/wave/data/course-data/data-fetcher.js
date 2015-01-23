var request = require('request'),
    cheerio = require('cheerio'),
    fs      = require('fs'),
    jade    = require('jade');

var courseDataDir = 'sub-projects/wave/data/course-data/';
var compiledDir = 'compiled/';
var rawDir = 'raw-data/';
var templateDir = 'templates/';

var debug = process.argv[2] == 'debug' || process.argv[2] == '-d' ? true : false;

var semesterNumLimit = debug ? (process.argv[3] || 4) : Infinity;

// Adding a method to arrays to 'clean' out unwanted values
Array.prototype.clean = function clean(deleteValue) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == deleteValue) {
            this.splice(i, 1);
            i--;
        }
    }
    return this;
};

// Order of events:
// 1. Parse 'search page' to get all the filters (departments, areas, etc.)
// 	  and most importantly, get possible semesters
// 2. Query using those semesters, to build a database. Set up translation
//    to turn cryptic stuff from existing schedule into most understandable
//    terms. For instance, instead of '201510' (a.k.a. Fall 2014) it would be
//    an object with { '2014': { 'fall': data } }, etc.
// 3. Make second pass over the data, to perform the conversion of ugly data
//    into nice, readable stuff, as a static pre-process step
// 4. Save the filters and the course data into html files to be included in
//    in the jade files.


// Things to keep in mind:
// - Async stuff should be preferably be promises, not callbacks
// - Not everything is or should be async
// - All network stuff (requests) should be async
// - This is fairly sequential, so overall structure can probably not be async

// =========================== General Stuff ==========================

// poolForRequests = {
//     maxSockets: Infinity
// }

function promiseRead(filePath) {
    return new Promise(function read(resolve, reject) {
        fs.readFile(filePath, function(err, data) {
            if (err) {
                reject(Error(err));
            }
            else {
                resolve(data);
            }
        });
    });
}

function promiseGet(url) {
    return new Promise(function requestGet(resolve, reject) {
        request.get(url, /*{ pool: poolForRequests },*/ function handleGetResponse(err, resp, body) {
            if (err || resp.statusCode != 200) {
                reject(Error(err || ('(' + url + ') Status Code was ' + resp.statusCode)));
            }
            else {
                resolve(body);
            }
        });
    });
}

// Slightly specialized for use in getting for TinyURL API
function tinyGet(url, key) {
    // Return a new promise.
    return new Promise(function requestGet(resolve, reject) {
        request.get(url, /*{ pool: poolForRequests }, */function handleGetResponse(err, resp, newURL) {
            if (err || resp.statusCode != 200) {
                reject(Error(err || ('TinyURL unhappy: ' + resp.statusCode)));
            }
            else {
                resolve({ key: key, newURL: newURL });
            }
        });
    });
}

// Slightly specialized for use in posting for semester data
function semesterPost(url, formData) {
    // Have to perform a deep copy for the variable to not be overwritten by the time the callback is used.
    // var copiedFormData = JSON.parse(JSON.stringify(formData));
    var semesterCode = formData.schedule_beginterm;

    return new Promise(function requestPost(resolve, reject) {
        console.log('Posting for ' + semesterCode);
        request.post(url, { form: formData/*, pool: poolForRequests*/ }, function handlePostResponse(err, resp, body) {
            if (err) {
                return reject(Error(err));
            }
            else {
                return resolve({ code: semesterCode, body: body });
            }
        });
    });
}

function formatConvertYear(intYear) {
    return (intYear - 1).toString() + '-' + intYear.toString();
}

function handlePromiseError(err) {
    console.log('Errored in a Promise');
    console.log(err.stack);
    throw err;
}


// =========================== Filter Stuff ===========================

// All the filters we care about.
var filters = [
    'subject_sch',
    'foundation_sch',
    'division_sch',
    'area_sch',
    'schedule_beginterm'
    // 'intmajor_sch' // Currently don't care about interdisciplinary majors
];

function prettifyFilterValue(filterValueText) {
    // Possibly inefficient due to unnecessary replaces
    return filterValueText.trim()
        .replace(/Found: /, '')
        .replace(/Area: /, '')
        .replace(/Division: /, '');
}

var filterTranslator;
function prettifyFilter(filterName) {
    filterTranslator = filterTranslator ||
    {
        'subject_sch': 'department',
        'foundation_sch': 'foundation',
        'division_sch': 'division',
        'area_sch': 'area',
        'schedule_beginterm': 'semester'
        // 'intmajor_sch': 'interdis_major' // Currently don't care about interdisciplinary majors
    };

    var translated = filterTranslator[filterName];
    if (translated === undefined) {
        translated = filterName;
    }

    return translated;
}

function fetchSearchPage() {
    return promiseGet('https://weblprod1.wheatonma.edu/PROD/bzcrschd.P_ListSection');
}

var filterBlacklist;
function parseOutFilters(searchPageBody) {
    var filterBlacklist = filterBlacklist || {
        '%': true,
        'CONX': true
    };

    var $ = cheerio.load(searchPageBody);

    var filterObj = {};

    filters.forEach(function handleEntry(filter, i, array) {
        var prettifiedFilter = prettifyFilter(filter);
        filterObj[prettifiedFilter] = [];

        $('select[name=' + filter + ']').find('option').each(function parseSelectOption(entry) {
            var filterValue = $(this).val();
            if (!filterBlacklist[filterValue]) {
                filterObj[prettifiedFilter].push({ val: filterValue, display: prettifyFilterValue($(this).text()) });
            }
        });
    });

    return filterObj;
}

function saveFilters(filterObj) {
    var promise = new Promise(function getFiltersTemplate(resolve, reject) {
        fs.readFile(courseDataDir + templateDir + 'filters.jade', function renderUsingTemplateFile(err, data) {
            if (err) {
                reject(Error(err));
            }
            else {
                var func = jade.compile(data, { pretty: /*debug*/false, doctype: 'html' });
                var html = func({ filterData: filterObj });
                resolve(html);
            }
        });
    }).then(function saveRenderedTemplate(html) {
        // Save pre-compiled HTML files (for viewing on site)
        fs.writeFile(courseDataDir + compiledDir + 'filters.html', html, function handleFileWriteResponse(err) {
            if (err)
                console.log(err);
            else
                console.log('The filters html file was saved!');
        });

        // Save raw JSON files (for API)
        fs.writeFile(courseDataDir + rawDir + 'filters.json', JSON.stringify(filterObj, null, 2), function handleFileWriteResponse(err) {
            if (err)
                console.log(err);
            else
                console.log('The filters json file was saved!');
        });
    }).catch(handlePromiseError);
}

function getSearchFilters() {
    return fetchSearchPage()
        .then(parseOutFilters)
        .catch(handlePromiseError);
}

function preprocessFilters(filterObj) {
    filterObj.semester.forEach(function transposeWords(semester, i) {
        var oldDisplaySplit = semester.display.split(/ /);


        filterObj.semester[i].display = oldDisplaySplit[1] + ' - ' + oldDisplaySplit[0];
    });

    return filterObj;
}

// =========================== Course Stuff ===========================

var scheduleData = {};

// Translates the number system that Wheaton uses into the word system that WAVE uses
var semesterTranslator = {
    10: 'fall',
    15: 'winter',
    20: 'spring',
    35: 'summer'
};
function extractInfoFromCode(semesterCode) {
    var integerCode = parseInt(semesterCode);
    var returnObj = { year: formatConvertYear(Math.floor(integerCode / 100)), semester: semesterTranslator[integerCode % 100] };

    return returnObj;
}

var divAreaFoundTranslator;
function prettifyDivAreaFound(raw) {
    divAreaFoundTranslator = divAreaFoundTranslator || {
        'ARCA': 'Creative Arts',
        'ARHS': 'History',
        'ARHM': 'Humanities',
        'ARMC': 'Math and Computer Science',
        'ARNS': 'Natural Science',
        'ARSS': 'Social Sciences',

        'DVAH': 'Arts and Humanities',
        'DVNS': 'Natural Sciences',
        'DVSS': 'Social Sciences',

        'BW':   'Beyond the West',
        'FS':   'First Year Seminar',
        'WR':   'First Year Writing',
        'FL':   'Foreign Language',
        'QA':   'Quantitative Analysis'
    }

    var translated = divAreaFoundTranslator[raw];
    if (translated === undefined) {
        translated = raw;
    }

    return translated;
}

// Parses one course's data out from the given list of rows
function parseCourseData(allRows, i) {
        // 2 Types of formats:
        //      W/o prereqs: 5 lines long, info on lines 0,    2
        //      Prereqs:     6 lines long, info on lines 0, 1, 3

    var firstRow  = $(allRows[i]);
    var secondRow = $(allRows[i+1]);
    var thirdRow  = $(allRows[i+2]);
    var fourthRow = $(allRows[i+3]);

    var enrollmentRow;

    if (thirdRow.find('td').length > 3) {
        classHasPrereqs = true;
    }
    else {
        classHasPrereqs = false;
    }

    if (classHasPrereqs) {
        enrollmentRow = thirdRow;
    }
    else {
        enrollmentRow = secondRow;
    }

    firstRowElements      = firstRow.find('td');
    enrollmentRowElements = enrollmentRow.find('td');
    // Testing for prereqs row

    var timePlace = $(firstRowElements[4]).text().trim();
    var timePlaceSplit;
    if (timePlace !== '') {
        timePlaceSplit = timePlace.split(/\n/).clean('');
    }
    else {
        timePlaceSplit = ['', ''];
    }

    for (var key in courseData) {
        if (typeof courseData[key] === 'string') {
            courseData[key] = courseData[key].trim().replace(/\n/g, '');
        }
    }

    var courseData = {
        courseCode:         $(firstRowElements[0]).text(),
        courseLink:         $(firstRowElements[0]).find('a').attr('href'),
        courseTitle:        $(firstRowElements[2]).text(),
        crn:                $(firstRowElements[3]).text(),
        meetingTime:        timePlaceSplit[0],
        meetingPlace:       timePlaceSplit[1],
        professors:         $(firstRowElements[5]).text(),
        foundation:         $(firstRowElements[6]).text(),
        division:           $(firstRowElements[7]).text(),
        area:               $(firstRowElements[8]).text(),
        connections:        $(firstRowElements[9]).text(),
        connectionsLink:    $(firstRowElements[9]).find('a').attr('href') || '',
        examSlot:           $(firstRowElements[1]).text().replace(/\./, ''),
        examSlotLink:       'https://weblprod1.wheatonma.edu/' + $(firstRowElements[1]).find('a').attr('href'),
        textbookLink:       $(firstRowElements[10]).find('a').attr('href'),
        maxEnroll:          $(enrollmentRowElements[1]).text().replace(/Max Enroll:/, ''),
        currentEnroll:      $(enrollmentRowElements[2]).text().replace(/Seats Taken:/, ''),
        seatsAvailable:     $(enrollmentRowElements[3]).text().replace(/Seats Avail:/, ''),
        waitList:           $(enrollmentRowElements[4]).text().replace(/Wait List:/, ''),
        courseNotes:        (classHasPrereqs ? $(secondRow.find('td')[1]).text() : '')
    };

    var linksArray = {
        connectionsLink:    $(firstRowElements[9]).find('a').attr('href') || '',
        examSlotLink:       'https://weblprod1.wheatonma.edu/' + $(firstRowElements[1]).find('a').attr('href'),
        textbookLink:       $(firstRowElements[10]).find('a').attr('href'),
        courseLink:         $(firstRowElements[0]).find('a').attr('href')
    };

    // Finish off by making async call to TinyURL's API to condense links, and returning that final data
    // return new Promise(function tinyUrlTheLinks(resolve, reject) {
    //     Promise.all(
    //         Object.keys(linksArray).map(function mapLinksToTinyUrlAPI(value, index) {
    //             return tinyGet('http://tinyurl.com/api-create.php?url=' + linksArray[value], value);
    //         })
    //     ).then(function addCondensedLinks(condensedArray) {
    //         condensedArray.forEach(function handleElement(value) {
    //             courseData[value.key] = value.newURL;
    //         });

            for (key in courseData) {
                courseData[key] = courseData[key].replace(/\s+/g, ' ').trim();
            }

    //         resolve(courseData);
    //     }).catch(handlePromiseError);
    // }).catch(handlePromiseError);

    return Promise.resolve(courseData);
}

function parseSemesterData(semesterObj) {
    console.log('Queuing parsing for ' + semesterObj.code);

    $ = cheerio.load(semesterObj.body);

    var semesterCourses = {};

    var courseLabelPattern = /^\s*([A-Z][A-Z][A-Z]?[A-Z]?\-[0-9][0-9][0-9])/;

    var allRows = $('tr');
    var courseRowIndices = [];

    // Extract the rows that mark the start of a new course
    allRows.each(function parseRow(index, element) {
        var possibleCourseLabel = $(this).find('td').text().trim();

        var match = courseLabelPattern.exec(possibleCourseLabel);

        if (match) {
            courseRowIndices.push(index);
        }
    });

    return courseRowIndices.map(
        function mapIndexToPromise(courseRowIndex) {
            return parseCourseData(allRows, courseRowIndex);
        }
    ).reduce(function(sequenceSoFar, coursePromise) {
        return sequenceSoFar.then(function dummyReturn() {
            return coursePromise; // This makes sure the courses stay in order
        }).then(function assignCourseData(courseData) {
            var department = courseData.courseCode.split(/-/)[0];

            if (!(department in semesterCourses)) {
                semesterCourses[department] = [];
            }

            semesterCourses[department].push(courseData);
        });
    }, Promise.resolve())
    .then(function finishUp() {
        semesterObj.data = semesterCourses;

        console.log('Finished parsing for ' + semesterObj.code);
        return semesterObj;
    });
}

// function postProcessSemesterData(semester) {
//     return semester;
// }

var dataValues = {
    'intmajor_sch' : '%',
    'area_sch' : '%',
    'submit_btn' : 'Search Schedule',
    'subject_sch' : '%',
    'foundation_sch' : '%',
    'schedule_beginterm' : '', // Nothing in this one yet
    'division_sch' : '%',
    'crse_numb' : '%',
};
function getParseAndSaveScheduleData(semesterCodes) {
    return Promise.all(
        semesterCodes.map(function mapSemesterCodeToPromise(semesterCode, i, array) {
            var tempFormData = dataValues; // Load up template data
            tempFormData.schedule_beginterm = semesterCode.val; // Fill in important field of template

            return semesterPost('https://weblprod1.wheatonma.edu/PROD/bzcrschd.P_OpenDoor', tempFormData)
                .then(parseSemesterData)
                .then(saveSemesterData)
                .catch(handlePromiseError);
        })
    );
}

function saveSemesterData(semesterObj) {
    promiseRead(courseDataDir + templateDir + 'courses.jade')
        .then(function renderUsingTemplateFile(template) {
            var func = jade.compile(template, { pretty: /*debug*/false, doctype: 'html' });
            var html = func({ courseData: semesterObj.data, prettifyDivAreaFound: prettifyDivAreaFound });

            // Save pre-compiled HTML files (for viewing on site)
            fs.writeFile(courseDataDir + compiledDir + semesterObj.code + '.html', html, function handleFileWriteResponse(err) {
                if (err)
                    console.log(err);
                else
                    console.log('The courses ' + semesterObj.code + ' html file was saved!');
            });

            // Save raw JSON files (for API)
            fs.writeFile(courseDataDir + rawDir + semesterObj.code + '.json', JSON.stringify(semesterObj.data, null, 2), function handleFileWriteResponse(err) {
                if (err)
                    console.log(err);
                else
                    console.log('The courses ' + semesterObj.code + ' json file was saved!');
            });
        });
}

// =========================== Driver Stuff ===========================

function fetchAndParseAll() {
    getSearchFilters()
        .then(preprocessFilters)
        .then(function saveFiltersAndStartScheduleGet(filterObj) {
            saveFilters(filterObj); // Fire off async call, don't care when it finishes

            // If debugging, limit the number of semesters used
            return debug ? filterObj.semester.slice(0, semesterNumLimit) : filterObj.semester;
        })
        .then(getParseAndSaveScheduleData)
        .catch(handlePromiseError);
}

fetchAndParseAll();