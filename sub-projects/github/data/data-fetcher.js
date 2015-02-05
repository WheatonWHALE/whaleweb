var Firebase = require('firebase'),
    cheerio = require('cheerio'),
    request = require('request');

var listOfPeople = Array(
    { id: 'aavila320',      name: 'Aimee',      year: '\'15' },
    { id: 'akuisara',       name: 'Sara',       year: '\'16' },
    { id: 'angelm25',       name: 'Angel',      year: '\'15' },
    { id: 'bawjensen',      name: 'Bryan',      year: '\'15' },
    { id: 'cjrieck',        name: 'Clayton',    year: '\'14' },
    { id: 'coldwellop1',    name: 'Emily',      year: '\'15' },
    { id: 'dshelts',        name: 'Drew',       year: '\'15' },
    { id: 'devindelfino',   name: 'Devin',      year: '\'15' },
    { id: 'evan1590',       name: 'Evan',       year: '\'15' },
    { id: 'employedtitan',  name: 'Sven',       year: '\'15' },
    { id: 'guti15',         name: 'Robert',     year: '\'15' },
    { id: 'iopaluch',       name: 'Ian',        year: '\'18' },
    { id: 'jge94',          name: 'Jinnan',     year: '\'16' },
    { id: 'jmorneau',       name: 'Julia',      year: '\'16' },
    { id: 'lithiah',        name: 'Lithia',     year: '\'16' },
    { id: 'MichaelKristy',  name: 'Michael',    year: '\'18' },
    { id: 'nbelliot',       name: 'Nicholas',   year: '\'15' },
    { id: 'omigayy',        name: 'Yingying',   year: '\'17' },
    { id: 'rubinz',         name: 'Zevi',       year: '\'16' },
    { id: 'tarmstro',       name: 'Tom',        /*year: ''*/ },
    { id: 'tkicks',         name: 'Tyler',      year: '\'16' },
    { id: 'tnguyen14',      name: 'Tri',        year: '\'14' },
    { id: 'xeaza',      	name: 'Taylor',     year: '\'13' },
    { id: 'zahrarikan',     name: 'Zahra',      year: '\'17' }
);

function get(url) {
    // Return a new promise.
    return new Promise(function requestGet(resolve, reject) {
        request.get(url, function handleGetResponse(err, resp, body) {
            if (err) {
                reject(err);
            }
            else {
                resolve(body);
            }
        });
    });
}

Promise.all(listOfPeople.map(function mapPersonToPromise(person, i) {
    return get('https://github.com/' + person.id).then(function parseOutData(pageBody) {
        var $ = cheerio.load(pageBody);
        
        var contributionColumns = $('.contrib-column');

        var yearContrib  = $(contributionColumns[0])
            .find('.contrib-number')
            .text()
            .replace(/ total/, '')
            .replace(/,/g, ''); // Fix error with commas ruining parseInt
        var maxStreak    = $(contributionColumns[1])
            .find('.contrib-number')
            .text()
            .replace(/ days?/, '');
        var currStreak   = $(contributionColumns[2])
            .find('.contrib-number')
            .text()
            .replace(/ days?/, '');

        return {
            currStreak:     currStreak,
            maxStreak:      maxStreak,
            yearContrib:    yearContrib
        };
    }).then(function updateFireBase(entrantData) {
        return new Promise(function updateEntrant(resolve, reject) {
            var myFirebaseRef = new Firebase('https://whalesite.firebaseio.com/Competitions/GitHub%20Streak/Entrants/' + person.id);

            myFirebaseRef.update({
                current:    entrantData.currStreak,
                max:        entrantData.maxStreak,
                total:      entrantData.yearContrib,
                name:       person.name,
                id:         person.id,
                year:       person.year || ''
            }, function firebaseCallback(err) {
                if (err) {
                    reject(Error(err));
                }
                else {
                    resolve('success');
                }
            });

            console.log('Handled ' + person.name + ': ' +
                entrantData.yearContrib + ' and ' +
                entrantData.currStreak + '/' + entrantData.maxStreak);
        }).catch(function handleError(err) {
            console.error(err);
            throw err;
        });
    });
})).then(function forceExit() {
    // TODO: Actually fix why the process doesn't close on its own. Best guess: Firebase
    process.exit(0);
});