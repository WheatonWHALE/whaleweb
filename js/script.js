function sortByStreak(a, b, key, otherKey) {
	var aVal = parseInt(a[key]), bVal = parseInt(b[key]);

	if (aVal == bVal)
		comparison = parseInt(b[otherKey]) - parseInt(b[otherKey]);
	else
		comparison = bVal - aVal;

	return comparison;
}

function sortByCurrentStreak(a, b) {
	return sortByStreak(a, b, 'current', 'max');
}

function sortByMaxStreak(a, b) {
	return sortByStreak(a, b, 'max', 'current');
}

function extractStreak(entrants, key) {
	var entrantsCurrentStreak = [];

	entrants.forEach(function(entry, index) {
		entry.streakVal = entry[key];
		entrantsCurrentStreak.push(entry);
	});

	(key == 'current') ? entrantsCurrentStreak.sort(sortByCurrentStreak) : entrantsCurrentStreak.sort(sortByMaxStreak);

	return entrantsCurrentStreak;
}

function extractMaxStreak(entrants) {
	return extractStreak(entrants, 'max');
}

function extractCurrentStreak(entrants) {
	return extractStreak(entrants, 'current');
}

function markTopThree(element) {
	/*
	Function to mark the top three people as being in the lead. Used in styling them differently.
	*/

	// Note: 2, 3, 4 because the first child is the title
	element.find('.entrant:nth-child(2)').addClass('leader').addClass('first');
	element.find('.entrant:nth-child(3)').addClass('leader').addClass('second');
	element.find('.entrant:nth-child(4)').addClass('leader').addClass('third');
}

function markStreakless(element) {
	/*
	Function to mark everyone without an active streak.
	*/
	element.find('.score').each(function() {
		var that = $(this);

		if (that.html() == '0 days')
			that.parents('.entrant').addClass('streakless');
	});
}

function centerLogo() { // REMOVED (no longer dynamic sized, so no need for dynamic centering)
	// $('img.centered-logo').load(function() {
	// 	$(this).css('margin-left', -1 * $(this).width() / 2);
	// 	$(this).css('margin-top', -1 * $(this).height() / 2);
	// }).each(function() {
	// 	$(this).load();
	// });
}

$(function() {
	centerLogo();

	if ($('#competition-container').length) { // Test for "competitions" page

		var compsRef = new Firebase('https://whalesite.firebaseio.com/Competitions');

		compsRef.on('child_added', function(snapshot) {

			var entry = snapshot.val();

			var entrants = Array();
			$.each(entry.Entrants, function() {
				entrants.push(this);
			});

			dust.render("current_streak", {title: 'Current Streak', entrants: extractCurrentStreak(entrants)}, function(err, out) {
				out = $(out);
				markTopThree(out);
				markStreakless(out);
				$("#competition-container").append(out);
			});

			dust.render("current_streak", {title: 'Max Streak', entrants: extractMaxStreak(entrants)}, function(err, out) {
				out = $(out);
				markTopThree(out);
				markStreakless(out);
				$("#competition-container").append(out);
			});

			snapshot.ref().child('Entrants').on('child_changed', function(snapshot) {
				var changedEntrant = snapshot.val();

				$('.' + changedEntrant.id).each(function(index) {
					var entrantElement = $(this);

					if (entrantElement.parents('.competition.max').length)
						entrantElement.find('.score').html(changedEntrant.max + ' days');
					else
						entrantElement.find('.score').html(changedEntrant.current + ' days');
				});
			});
		});

		// ================================================================================

		$('#logo-competition').click(function() {
			$.get('/refresh-competitions/', function() {
				console.log('Update request sent!');
			});
		});
	}
});