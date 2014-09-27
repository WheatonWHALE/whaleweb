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

function fetchData() {
    var url = 'https://weblprod1.wheatonma.edu/PROD/bzcrschd.P_OpenDoor';

    var dataValues = {
        'intmajor_sch' : '%',
        'area_sch' : '%',
        'area_cat' : '%',
        'submit_btn' : 'Search Schedule',
        'subject_sch' : '%',
        'subject_cat' : '%',
        'foundation_sch' : '%',
        'schedule_beginterm' : '201510',
        'intmajor_cat' : '%',
        'division_sch' : '%',
        'foundation_cat' : '%',
        'crse_numb' : '%',
        'division_cat' : '%'
    };

    var headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36',
        'Cookie': '_ga=GA1.2.99013180.1410794952; session=eyJyZWNlbnQiOlsiMTNxMHdjcDEiXX0.BviaPw.QJ5xAWB91r8I21WDad6uYYk6xPw'
    };

    request.post(url, {form:dataValues, headers:headers}, function(err, resp, body) {
        console.log('test');
        console.log(resp);

        $ = cheerio.load(body);

        $('.tr')
    });
}