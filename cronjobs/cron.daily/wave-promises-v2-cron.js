var request = require('request'),
    cheerio = require('cheerio'),
    fs      = require('fs'),
    jade    = require('jade');

var debug = true;

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
                // console.log(filterObj);
                var func = jade.compile(data, { pretty: debug });
                var html = func({ filterData: filterObj });

                resolve(html);
            }
        })
    }).then(function(html) {
        // console.log('into saving filters');
        fs.writeFile('static/course-data/compiled/filters.html', html, function(err) {
            if (err) console.error(err);
            else console.log('The filters html file was saved');
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
        console.error('getSearchFilters errored:');
        console.error(err);
        throw err;
    });
}

function preprocessFilters(rawFilterObj) {
    // Not currently preprocessing...
    return rawFilterObj;
}

function getScheduleData(semesters) {

}

function fetchAndParseAll() {
    getSearchFilters()
    .then(preprocessFilters)
    .then(function(filterObj) {
        // console.log('Filters: ');
        // console.log(filterObj);
        saveFilters(filterObj);

        return getScheduleData(filterObj['semester']);
    });
}

fetchAndParseAll();