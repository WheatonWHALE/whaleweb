var debug = true;

var Promise = require('bluebird'), // Note, "bluebird" becomes Promise, not bluebird
    cheerio = require('cheerio'),
    request = Promise.promisifyAll(require('request')),
    fs      = Promise.promisifyAll(require('fs')),
    jade    = require('jade');

// Note: Fall 2014 is considered part of the 2015 year
// Years: 2004 (Fall 2003) - 2016 (Spring 2016)
var startYear = 2014;   // Inclusive
var endYear = 2015;     // Inclusive

// All the possible semesters
var possibleSemesters = [
    10,   // Fall
    15,   // Winter
    20,   // Spring
    35    // Summer
]

var promiseWhile = function(condition, action) {
    var resolver = Promise.defer();
 
    var loop = function() {
        if (!condition()) return resolver.resolve();
        return Promise.cast(action())
            .then(loop)
            .catch(resolver.reject);
    };
 
    process.nextTick(loop);
 
    return resolver.promise;
};
 
 
// function getScheduleData() {
//     var url = 'https://weblprod1.wheatonma.edu/PROD/bzcrschd.P_OpenDoor';

//     var dataValues = {
//         'intmajor_sch' : '%',
//         'area_sch' : '%',
//         'submit_btn' : 'Search Schedule',
//         'subject_sch' : '%',
//         'foundation_sch' : '%',
//         'schedule_beginterm' : '', // Nothing in this one yet
//         'division_sch' : '%',
//         'crse_numb' : '%',
//     };

//     var currYear = startYear;
     
//     promiseWhile(function() { return currYear <= endYear; },
//         function() {
//         // The function to run, should return a promise
//         return new Promise(function(resolve, reject) {
//             promiseWhile(function() { return currYear <= endYear; },
//                 function() {
//                 // The function to run, should return a promise
//                 return new Promise(function(resolve, reject) {
//                     // Arbitrary 250ms async method to simulate async process
//                     setTimeout(function() {
//                         ++currYear;
//                         console.log(currYear);
//                         resolve();
//                     }, 250);
//                 });
//             }).then(function() {
//                 console.log("Done");
//             });
//         });
//     }).then(function() {
//         console.log("Done");
//     });
// }

// var tasks = possibleSemesters.map(function(semester,i) {
//     return function() { // return a task on that zippy;
//         // basic logic here
//         return $.get({

//             // ajax request
//         }).then(function(data) {
//             // process data like in your code
//             // possibly store later for later use too
//             return process(data); // return the processed data;
//         });
//     }
// });

// var p = tasks[0](); // start the first one
// for(var i = 1; i < tasks.length; i++) p = p.then(tasks[i]);
// p.then(function(result) {
//    // all available here
// });

// request.post(url, {form:dataValues}, function(err, resp, body) {
//     console.log('response for ' + translatedYear + ' and ' + translatedSemester);
//     if (resp.statusCode == 200) {
//         var semesterData = parseSemesterData(body);
//         if (Object.keys(semesterData).length)
//             scheduleData[translatedYear][translatedSemester] = semesterData;
//     }
//     else {
//         console.log(resp.statusCode);
//     }

//     numResponses++;

//     if (numResponses >= numResponsesExpected)
//         writeDataToFile(scheduleData);
// });

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
            console.log(err);
            console.log(courseData);
            console.log(key);
        }
    }

    return courseData;
}

function processScheduleBody(body) {
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

function getScheduleData() {
    var url = 'https://weblprod1.wheatonma.edu/PROD/bzcrschd.P_OpenDoor';

    var dataValues = {
        'intmajor_sch' : '%',
        'area_sch' : '%',
        'submit_btn' : 'Search Schedule',
        'subject_sch' : '%',
        'foundation_sch' : '%',
        'schedule_beginterm' : '201510', // Nothing in this one yet
        'division_sch' : '%',
        'crse_numb' : '%',
    };

    var scheduleData = {};

    for (var currYear = startYear; currYear <= endYear; ++currYear) {
        for (var i = 0; i < possibleSemesters.length; ++i) {
            var year = currYear.toString();
            var semester = possibleSemesters[i].toString();
            dataValues['schedule_beginterm'] = year + semester;

            request.postAsync(url, { form: dataValues }).spread(function(response, body) {
                return processScheduleBody(body);
            }).then(function(semesterData) {
                console.log('In getScheduleData: ' + semesterData);
                scheduleData[year][semester] = semesterData;
                process.exit(0);
            }).catch(function(err) {
                console.error(err);
            });
        }
    }
}

getScheduleData();