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

function parseOutData(body) {
    $ = cheerio.load(body);

    var classLabelMatch = /[A-Z][A-Z][A-Z][A-Z]?-[0-9][0-9][0-9]/;

    allRows = $('.tr');

    allRows.each(function(index, element) {
        // element.text()
        console.log($(this).text());
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
        'schedule_beginterm' : '201510',
        'division_sch' : '%',
        'crse_numb' : '%',
    };

    request.post(url, {form:dataValues}, function(err, resp, body) {
        console.log(body);
    });
}

fetchData();