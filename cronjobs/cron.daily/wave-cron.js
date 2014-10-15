var request = require('request'),
    cheerio = require('cheerio'),
    fs      = require('fs'),
    jade    = require('jade');

var debug = false;

// Adding a method to arrays to 'clean' out unwanted values
Array.prototype.clean = function(deleteValue) {
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

function get(url) {
    // Return a new promise.
    return new Promise(function(resolve, reject) {
        request.get(url, function(err, resp, body) {
            if (err)
                return reject(err);
            else
                return resolve(body);
        });
    });
}

// Slightly specialized for use in posting for semester data
function semesterPost(url, formData) {
    // Have to perform a deep copy for the variable to not be overwritten by the time the callback is used.
    var copiedFormData = JSON.parse(JSON.stringify(formData));

    return new Promise(function(resolve, reject) {
        console.log('Posting for ' + copiedFormData['schedule_beginterm']);
        request.post(url, { form: copiedFormData }, function(err, resp, body) {
            if (err)
                return reject(err);
            else
                return resolve({ code: copiedFormData['schedule_beginterm'], body: body });
        });
    });
}

function formatConvertYear(intYear) {
    return (intYear - 1).toString() + '-' + intYear.toString();
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
    }

    var translated = filterTranslator[filterName];
    if (translated == undefined) {
        translated = filterName;
    }

    return translated;
}

function fetchSearchPage() {
    return get('https://weblprod1.wheatonma.edu/PROD/bzcrschd.P_ListSection');
}

function parseOutFilters(searchPageBody) {
    $ = cheerio.load(searchPageBody);

    var filterObj = {};

    filters.forEach(function(filter, i, array) {
        var prettifiedFilter = prettifyFilter(filter);
        filterObj[prettifiedFilter] = [];

        $('select[name=' + filter + ']').find('option').each(function(entry) {
            var filterValue = $(this).val();
            if (filterValue != '%')
                filterObj[prettifiedFilter].push({ val: filterValue, display: prettifyFilterValue($(this).text()) });
        });
    });

    return filterObj;
}

function saveFilters(filterObj) {
    var promise = new Promise(function(resolve, reject) {
        fs.readFile('static/course-data/filters.jade', function(err, data) {
            if (err)
                reject(err);
            else {
                var func = jade.compile(data, { pretty: debug, doctype: 'html' });
                var html = func({ filterData: filterObj });
                resolve(html);
            }
        })
    }).then(function(html) {
        fs.writeFile('static/course-data/compiled/filters.html', html, function(err) {
            if (err) console.error(err);
            else console.log('The filters html file was saved!');
        });

        if (debug) {
            fs.writeFile('static/course-data/filters.json', JSON.stringify(filterObj, null, 2), function(err) {
                if (err) console.error(err);
                else console.log("The filters json file was saved!");
            });
        }
    });
}

function getSearchFilters() {
    return fetchSearchPage().then(parseOutFilters).catch(function(err) {
        console.error(err);
        throw err;
    });
}

function preprocessFilters(filterObj) {
    // Preprocess to add the 'years' to the object, as they're something extra
    // not inherent in the old course schedule
    var integerSemesterCodes = filterObj['semester'].map(function(entry, i, array) {
        return parseInt(entry.val);
    });

    filterObj.year = [];

    // Floor the result of the integer code (in the format YYYYSS, for Year and Semester)
    // divided by 100, to isolate the year.
    var latestYear = Math.floor(Math.max.apply(null, integerSemesterCodes) / 100);
    var earliestYear = Math.floor(Math.min.apply(null, integerSemesterCodes) / 100);

    for (var currYear = latestYear; currYear >= earliestYear; --currYear) {
        var yearFilterValue = formatConvertYear(currYear);
        var yearFilterDisplay = 'Fall ' + (currYear - 1).toString() + ' - Spring ' + currYear.toString();
        filterObj.year.push({ val: yearFilterValue, display: yearFilterDisplay });
    }

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
}
function extractInfoFromCode(semesterCode) {
    var integerCode = parseInt(semesterCode);
    var returnObj = { year: formatConvertYear(Math.floor(integerCode / 100)), semester: semesterTranslator[integerCode % 100] };

    return returnObj;
}

function getAndParseSemesterPages(semesters) {
    return Promise.all(
        semesters.map(function(value, i, array) {
            var tempFormData = dataValues;
            tempFormData['schedule_beginterm'] = value.val;
            return semesterPost('https://weblprod1.wheatonma.edu/PROD/bzcrschd.P_OpenDoor', tempFormData).then(function parseSemester(semester) {
                console.log('Parsing for ' + semester.code);
                var semesterInfo = extractInfoFromCode(semester.code);

                if (!(semesterInfo.year in scheduleData))
                    scheduleData[semesterInfo.year] = {};

                scheduleData[semesterInfo.year][semesterInfo.semester] = parseOutSemesterData(semester.body);
            });
        })
    );
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

    if (thirdRow.find('td').length > 3)
        classHasPrereqs = false;
    else
        classHasPrereqs = true;

    if (classHasPrereqs)
        enrollmentRow = thirdRow;
    else
        enrollmentRow = fourthRow;

    firstRowElements      = firstRow.find('td');
    enrollmentRowElements = enrollmentRow.find('td');
    // Testing for prereqs row

    var timePlace = $(firstRowElements[4]).text().trim();
    if (timePlace != '')
        var timePlaceSplit = timePlace.split(/\n/).clean('');
    else
        var timePlaceSplit = ['', ''];

    var courseData = {
        courseCode:         $(firstRowElements[0]).text(),
        courseTitle:        $(firstRowElements[2]).text(),
        crn:                $(firstRowElements[3]).text(),
        meetingTime:        timePlaceSplit[0],
        meetingPlace:       timePlaceSplit[1],
        professors:         $(firstRowElements[5]).text(),
        foundation:         $(firstRowElements[6]).text(),
        division:           $(firstRowElements[7]).text(),
        area:               $(firstRowElements[8]).text(),
        connections:        $(firstRowElements[9]).text(),
        examSlot:           $(firstRowElements[1]).text(),
        textbookLink:       $(firstRowElements[10]).find('a').attr('href')
    };

    for (var key in courseData) {
        try {
            courseData[key] = courseData[key].trim()/*.replace(/\n/g, '')*/;
        }
        catch (err) {
            console.error(err);
        }
    }

    return courseData;
}

function parseOutSemesterData(body) {
    $ = cheerio.load(body);

    var semesterCourses = {};
    var classLabelMatch = /[A-Z][A-Z][A-Z][A-Z]?\-[0-9][0-9][0-9]/;

    var allRows = $('tr')

    allRows.each(function(index, element) {
        var possibleClassLabel = $(this).find('td').text().trim();

        if (possibleClassLabel.match(classLabelMatch)) {
            var department = possibleClassLabel.split(/-/)[0];
            var courseData = parseCourseData(allRows, index);

            if (department in semesterCourses)
                semesterCourses[department].push(courseData);
            else
                semesterCourses[department] = [courseData];
        }
    });

    return semesterCourses;
}

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
function getScheduleData(semesters) {
    return getAndParseSemesterPages(semesters).catch(function(err) {
        console.error('Errored in getAndParse');
        console.error(err);
        throw err;
    });
}

function saveScheduleData() {
    // Note: Schedule data will be in the global variable, not passed as a parameter

    for (var key in scheduleData) {
        // This promise will always resolve, and resolve with this key
        var promise = Promise.resolve(key);

        // fs.writeFile()
        promise.then(function(key) {
            return new Promise(function(resolve, reject) {
                fs.readFile('static/course-data/courses.jade', function(err, data) {
                    if (err)
                        reject(err);
                    else
                        resolve(data);
                });
            }).then(function(template) {
                var func = jade.compile(template, { pretty: debug, doctype: 'html' });
                var html = func({ courseData: scheduleData[key] });

                fs.writeFile('static/course-data/compiled/' + key + '.html', html, function(err) {
                    if (err) console.error(err);
                    else console.log("The courses " + key + " html file was saved!");
                });

                if (debug) {
                    fs.writeFile('static/course-data/' + key + '.json', JSON.stringify(scheduleData[key], null, 2), function(err) {
                        if (err) console.error(err);
                        else console.log("The courses " + key + " json file was saved!");
                    });
                }
            }).catch(function(err) {
                console.error('Error in saving schedule data');
                console.error(err);
                throw err;
            });
        });
    }
}

// =========================== Driver Stuff ===========================

function fetchAndParseAll() {
    getSearchFilters()
        .then(preprocessFilters)
        .then(function(filterObj) {
            saveFilters(filterObj); // Fire off async call, don't care when it finishes

            if (debug)
                return filterObj['semester'].slice(0, 7);
            else
                return filterObj['semester'];
        })
        .then(getScheduleData)
        .then(saveScheduleData)
        .catch(function(err) {
            console.error('Error uncaught elsewhere:');
            console.error(err);
            throw err;
        }
    ).catch(function(err) {
        throw err;
    });
}

fetchAndParseAll();