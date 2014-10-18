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

        var currStreak = $(contributionColumns[2]).find('.contrib-number').text().replace(/ days/, '');
        var maxStreak = $(contributionColumns[1]).find('.contrib-number').text().replace(/ days/, '');
        return {
            currStreak: currStreak,
            maxStreak: maxStreak
        };
    }).then(function updateFireBase(entrantData) {
         var myFirebaseRef = new Firebase('https://whalesite.firebaseio.com/Competitions/GitHub%20Streak/Entrants/' + person.id);

         myFirebaseRef.update({
             current:   entrantData.currStreak,
             max:       entrantData.maxStreak,
             name:      person.name,
             id:        person.id
         });

         console.log('Handled ' + person.name + ': ' + entrantData.currStreak + ' / ' + entrantData.maxStreak);
    });
})).then(function forceExit() {
    process.exit(0);
});