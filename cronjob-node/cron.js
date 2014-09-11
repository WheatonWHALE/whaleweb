var Firebase = require("firebase"),
	cheerio = require("cheerio"),
	request = require("request");


var listOfPeople = Array(
	{ id: 'bawjensen', name: 'Bryan' },
	{ id: 'dshelts', name: 'Drew' },
	{ id: 'devindelfino', name: 'Devin' },
	{ id: 'akuisara', name: 'Sara' },
	{ id: 'tkicks', name: 'Tyler' },
	{ id: 'tarmstro', name: 'Tom' },
	{ id: 'rubinz', name: 'Zevi' }
)

var numTotal = listOfPeople.length;
var numFinished = 0;

// for (person in listOfPeople) {
listOfPeople.forEach(function(person) {
	request('https://github.com/' + person.id, function(err, resp, body) {
		$ = cheerio.load(body);

		var myFirebaseRef = new Firebase('https://whalesite.firebaseio.com/Competitions/GitHub%20Streak/Entrants/' + person.id);
		
		var currStreak = $('.contrib-streak-current .num').text();
		var maxStreak = $('.contrib-streak .num').text();

		currStreak = currStreak.replace(/ days/, '');
		maxStreak = maxStreak.replace(/ days/, '');

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
	console.log('Not finished yet, ' + numFinished + ' out of ' + numTotal);
	if (numFinished < numTotal)
		setTimeout(waitForFinish, 1000);
	else
		process.exit(1);
}

waitForFinish();