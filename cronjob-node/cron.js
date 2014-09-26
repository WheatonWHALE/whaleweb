var Firebase = require("firebase"),
	cheerio = require("cheerio"),
	request = require("request");


var listOfPeople = Array(
	{ id: 'akuisara', name: 'Sara' },
	{ id: 'bawjensen', name: 'Bryan' },
	{ id: 'cjrieck', name: 'Clayton' },
	{ id: 'dshelts', name: 'Drew' },
	{ id: 'devindelfino', name: 'Devin' },
	{ id: 'evan1590', name: 'Evan' },
	{ id: 'iopaluch', name: 'Ian' },
	{ id: 'jge94', name: 'Jinnan' },
	{ id: 'jmorneau', name: 'Julia' },
	{ id: 'kimballan', name: '(?)' },
	{ id: 'lithiah', name: 'Lithia' },
	{ id: 'MichaelKristy', name: 'Michael' },
	{ id: 'omigayy', name: 'Yingying' },
	{ id: 'rubinz', name: 'Zevi' },
	{ id: 'tkicks', name: 'Tyler' },
	{ id: 'tarmstro', name: 'Tom' },
	{ id: 'zahrarikan', name: 'Zahra' }
)

var numTotal = listOfPeople.length;
var numFinished = 0;

// for (person in listOfPeople) {
listOfPeople.forEach(function(person) {
	request('https://github.com/' + person.id, function(err, resp, body) {
		if (err) {
			console.log(err);
			return;
		}

		$ = cheerio.load(body);

		var myFirebaseRef = new Firebase('https://whalesite.firebaseio.com/Competitions/GitHub%20Streak/Entrants/' + person.id);
		
		var contributionColumns = $('.contrib-column');

		var currStreak = $(contributionColumns[2]).find('.contrib-number').text().replace(/ days/, '');
		var maxStreak = $(contributionColumns[1]).find('.contrib-number').text().replace(/ days/, '');

		myFirebaseRef.update({
			current: currStreak,
			max: maxStreak,
			name: person.name,
			id: person.id
		});

		console.log(person.name + ': ' + currStreak + ' / ' + maxStreak);

		numFinished += 1;
	});
});

function waitForFinish() {
	if (numFinished < numTotal) {
		console.log('Not finished yet, ' + numFinished + ' out of ' + numTotal);
		setTimeout(waitForFinish, 1000);
	}
	else {
		console.log('Finished, ' + numFinished + ' out of ' + numTotal);
		process.exit(0); // Exit when done.
	}
}

waitForFinish();