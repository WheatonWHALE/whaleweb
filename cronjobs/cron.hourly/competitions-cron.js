var Firebase = require('firebase'),
    cheerio = require('cheerio'),
    request = require('request');

var listOfPeople = Array(
    { id: 'akuisara',       name: 'Sara' },
    { id: 'bawjensen',      name: 'Bryan' },
    { id: 'cjrieck',        name: 'Clayton' },
    { id: 'dshelts',        name: 'Drew' },
    { id: 'devindelfino',   name: 'Devin' },
    { id: 'evan1590',       name: 'Evan' },
    { id: 'iopaluch',       name: 'Ian' },
    { id: 'jge94',          name: 'Jinnan' },
    { id: 'jmorneau',       name: 'Julia' },
    { id: 'kimballan',      name: '(?)' },
    { id: 'lithiah',        name: 'Lithia' },
    { id: 'MichaelKristy',  name: 'Michael' },
    { id: 'omigayy',        name: 'Yingying' },
    { id: 'rubinz',         name: 'Zevi' },
    { id: 'tarmstro',       name: 'Tom' },
    { id: 'tkicks',         name: 'Tyler' },
    { id: 'tnguyen14',      name: 'Tri' },
    { id: 'zahrarikan',     name: 'Zahra' }
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
            .replace(/ days/, '');
        var currStreak   = $(contributionColumns[2])
            .find('.contrib-number')
            .text()
            .replace(/ days/, '');

        return {
            currStreak:     currStreak,
            maxStreak:      maxStreak,
            yearContrib:    yearContrib
        };
    }).then(function updateFireBase(entrantData) {
        return new Promise(function updateEntrant(resolve, reject) {
            var myFirebaseRef = new Firebase('https://whalesite.firebaseio.com/Competitions/GitHub%20Streak/Entrants/' + person.id);

            myFirebaseRef.update({
                current:   entrantData.currStreak,
                max:       entrantData.maxStreak,
                year:      entrantData.yearContrib,
                name:      person.name,
                id:        person.id
            }, function firebaseCallback(err) {
                if (err) {
                    reject(err)
                }
                else {
                    resolve('success');
                }
            });

            console.log('Handled ' + person.name + ': ' +
                entrantData.yearContrib + ' and ' +
                entrantData.currStreak + '/' + entrantData.maxStreak);
        });
    });
})).then(function forceExit() {
    // TODO: Actually fix why the process doesn't close on its own. Best guess: Firebase
    process.exit(0);
});