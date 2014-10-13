var request = require('request')
    cheerio = require('cheerio');

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


// All the filters we care about.
var filters = [
    'subject_sch',
    'foundation_sch',
    'division_sch',
    'area_sch',
    'schedule_beginterm'
    // 'intmajor_sch' // Currently don't care about interdisciplinary majors
];

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

    var filtersObject = {};

    filters.forEach(function(filter, i, array) {
        var prettifiedFilter = prettifyFilter(filter);
        filtersObject[prettifiedFilter] = [];

        $('select[name=' + filter + ']').find('option').each(function(entry) {
            var filterValue = $(this).val();
            if (filterValue != '%')
                filtersObject[prettifiedFilter].push({ val: filterValue, display: filterValue });
        });
    });

    return filtersObject;
}

function getSearchFilters() {

    fetchSearchPage().then(parseOutFilters)
    .then(function(result) {
        console.log(result);

        return "Yay2";
    }).then(function(result) {
        console.log(result);
    }).catch(function(err) {
        console.error(err);
        throw err;
    });
}

getSearchFilters();