var cheerio = require("cheerio"),
    request = require("request");

// var numTotal = listOfPeople.length;
// var numFinished = 0;

// request('https://github.com/' + person.id, function(err, resp, body) {
//  if (err) {
//      console.log(err);
//      return;
//  }

//  $ = cheerio.load(body);

//  var contributionColumns = $('.contrib-column');

// });

// function waitForFinish() {
//  if (numFinished < numTotal) {
//      console.log('Not finished yet, ' + numFinished + ' out of ' + numTotal);
//      setTimeout(waitForFinish, 1000);
//  }
//  else {
//      console.log('Finished, ' + numFinished + ' out of ' + numTotal);
//      process.exit(0); // Exit when done.
//  }
// }

// waitForFinish();

// Note: Fall 2014 is considered part of the 2015 year
// Years: 2004 (Fall 2013) - 2016 (Spring 2016)
var startYear = 2015;
var endYear = 2015;

var possibleSemesters = [
    '10',   // Fall
    '15',   // Winter
    '20',   // Spring
    '35'    // Summer
]

function parseClassData(allRows, i, year, semester) {
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

    classObject = {
        classCode: $(firstRowElements[0]).text(),
        examSlot: $(firstRowElements[1]).text()
    };

    // classObject.each()
    for (var key in classObject) {
        classObject[key] = classObject[key].replace(/\n/g, '');
    }

    console.log(classObject);

    console.log(year + ' : ' + semester);

    process.exit(0);
}

function parseData(body, year, semester) {
    $ = cheerio.load(body);

    var classLabelMatch = /[A-Z][A-Z][A-Z][A-Z]?-[0-9][0-9][0-9]/;

    allRows = $('tr');

    allRows.each(function(index, element) {
        var possibleClassLabel = $(this).find('td').text();

        if (possibleClassLabel.match(classLabelMatch)) {
            parseClassData(allRows, index, year, semester);
        }
    });
}

function fetchData() {
    var url = 'https://weblprod1.wheatonma.edu/PROD/bzcrschd.P_OpenDoor';

    var dataValues = {
        'intmajor_sch' : '%',
        'area_sch' : '%',
        'submit_btn' : 'Search Schedule',
        'subject_sch' : '%',
        'foundation_sch' : '%',
        'schedule_beginterm' : '',
        'division_sch' : '%',
        'crse_numb' : '%',
    };

    var year;
    var semester;

    for (year = startYear; year <= endYear; year++) {
        possibleSemesters.forEach(function(entry, index, array) {
            semester = entry;

            dataValues['schedule_beginterm'] = year.toString() + semester;

            console.log(dataValues);

            request.post(url, {form:dataValues}, function(err, resp, body) {
                if (resp.statusCode == 200)
                    parseData(body, year, semester);
                else
                    console.log(resp.statusCode);
            });
        });
    }
}

fetchData();