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
                var func = jade.compile(data, { pretty: debug });
                var html = func({ filterData: filterObj });
                resolve(html);
            }
        })
    }).then(function(html) {
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
        var yearFilterValue = (currYear - 1).toString() + '-' + currYear.toString()
        var yearFilterDisplay = 'Fall ' + (currYear - 1).toString() + ' - Spring ' + currYear.toString();
        filterObj.year.push({ val: yearFilterValue, display: yearFilterDisplay });
    }

    return filterObj;
}

// =========================== Course Stuff ===========================

function getCourseData(semesters) {
    var semesterPromises = semesters.map(function(value, i, array) {
        return value.val;
    });

    console.log(semesterPromises);
}

function saveCourseData(scheduleObj) {

}

// =========================== Driver Stuff ===========================

function fetchAndParseAll() {
    getSearchFilters()
        .then(preprocessFilters)
        .then(function(filterObj) {
            saveFilters(filterObj); // Fire off async call, don't care when it finishes

            if (debug)
                return filterObj['semester'].slice(0, 8);
            else
                return filterObj['semester'];
        })
        .then(getCourseData)
        .then(saveCourseData);
}

fetchAndParseAll();