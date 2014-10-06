var cheerio = require("cheerio"),
    request = require("request"),
    fs      = require("fs");

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

// Note: Fall 2014 is considered part of the 2015 year
// Years: 2004 (Fall 2003) - 2016 (Spring 2016)
var startYear = 2015;   // Inclusive
var endYear = 2015;     // Inclusive

var possibleSemesters = [
    10,   // Fall
    15,   // Winter
    20,   // Spring
    35    // Summer
]

var semesterTranslator = {
    10: 'fall',
    15: 'winter',
    20: 'spring',
    35: 'summer'
}

function translateYear(year) {
    return (year - 1).toString() + '-' + year.toString();
}

var scheduleData = {};

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

    var timePlaceSplit = $(firstRowElements[4]).text().split(/\n/).clean('');

    var attributes = $(firstRowElements[6]).text() + ', ' + $(firstRowElements[7]).text() + ', ' + $(firstRowElements[8]).text();

    var courseData = {
        courseCode:         $(firstRowElements[0]).text(),
        courseTitle:        $(firstRowElements[2]).text(),
        crn:                $(firstRowElements[3]).text(),
        meetingTime:        timePlaceSplit[0],
        meetingPlace:       timePlaceSplit[1],
        professors:         $(firstRowElements[5]).text(),
        courseAttributes:   attributes,
        connections:        $(firstRowElements[9]).text(),
        examSlot:           $(firstRowElements[1]).text(),
        textbookLink:       $(firstRowElements[10]).find('a').attr('href')
    };

    for (var key in courseData) {
        courseData[key] = courseData[key].replace(/\n/g, '');
    }

    return courseData;
}

function parseData(body) {
    $ = cheerio.load(body);

    var semesterCourses = {};
    var classLabelMatch = /[A-Z][A-Z][A-Z][A-Z]?\-[0-9][0-9][0-9]/;

    allRows = $('tr');

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

function writeDataToFile(schData, label) {
    fs.writeFile('static/course-data/' + label + '.json', JSON.stringify(schData, null, 2), function(err) {
        if (err)
            console.log(err);
        else
            console.log("The schedule file was saved!");
    });
}

function fetchAndParseScheduleData() {
    var url = 'https://weblprod1.wheatonma.edu/PROD/bzcrschd.P_OpenDoor';

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

    var numResponses = 0;
    var numResponsesExpected = possibleSemesters.length * (endYear+1 - startYear);

    // Two different types of for loops for the different types of data
    for (var currYear = startYear; currYear <= endYear; currYear++) {
        var translatedCurrYear = translateYear(currYear);
        scheduleData[translatedCurrYear] = {};

        possibleSemesters.forEach(function(semester, index, array) {
            var year = currYear; // Make copy of variable so its value is not overwritten by following loops

            var translatedSemester = semesterTranslator[semester];
            var translatedYear = translatedCurrYear;

            dataValues['schedule_beginterm'] = year.toString() + semester.toString();

            console.log('pinging for ' + translatedYear + ' and ' + translatedSemester);
            request.post(url, {form:dataValues}, function(err, resp, body) {
                console.log('response for ' + translatedYear + ' and ' + translatedSemester);
                if (resp.statusCode == 200) {
                    var semesterData = parseData(body);
                    if (Object.keys(semesterData).length)
                        scheduleData[translatedYear][translatedSemester] = semesterData;
                }
                else {
                    console.log(resp.statusCode);
                }

                numResponses++;

                if (numResponses >= numResponsesExpected)
                    writeDataToFile(scheduleData, translatedYear);
            });
        });
    }
}

function fetchAndParseFilterData() {
    var url = 'https://weblprod1.wheatonma.edu/PROD/bzcrschd.P_ListSection';

    var filters = [
        'subject_sch',
        'foundation_sch',
        'division_sch',
        'area_sch',
        'intmajor_sch'
    ];

    var filterTranslator = {
        'subject_sch': 'department',
        'foundation_sch': 'foundation',
        'division_sch': 'division',
        'area_sch': 'area',
        'intmajor_sch': 'interdis_major'
    }

    request.get(url, function(err, resp, body) {
        $ = cheerio.load(body);

        var filtersObject = {};

        filters.forEach(function(filter, index, array) {
            var translatedFilter = filterTranslator[filter];
            filtersObject[translatedFilter] = [];

            $('select[name=' + filter + ']').find('option').each(function(entry) {
                var filterValue = $(this).val();
                if (filterValue != '%')
                    filtersObject[translatedFilter].push(filterValue);
            });
        });

        fs.writeFile('static/course-data/filters.json', JSON.stringify(filtersObject, null, 2), function(err) {
            if (err)
                console.log(err);
            else
                console.log("The filters file was saved!");
        });
    });
}

fetchAndParseScheduleData();
fetchAndParseFilterData();