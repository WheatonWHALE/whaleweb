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

function fetchSearchPage() {
    return new Promise(function(resolve, reject) {
        if (true) {
            resolve("Yay");
        }
        else {
            reject(Error("No"));
        }
    });
}

function parseOutFilters(searchPageBody) {

}

function getSearchFilters() {
    fetchSearchPage().then(function(result) {
        console.log(result);
        return "Yay2";
    }).then(function(result) {
        console.log(result);
    }).catch(function(err) {
        console.log(err);
    });
}

getSearchFilters();