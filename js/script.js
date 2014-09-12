function sortByCurrentStreak(a, b) {
	var aCurrent = parseInt(a.current);
	var bCurrent = parseInt(b.current);

	if (aCurrent == bCurrent) {
		comparison = parseInt(b.max) - parseInt(a.max);
	}
	else {
		comparison = bCurrent - aCurrent;
	}

	return comparison;
}

function sortByMaxStreak(a, b) {
	var aMax = parseInt(a.max);
	var bMax = parseInt(b.max);

	if (aMax == bMax) {
		comparison = parseInt(b.current) - parseInt(a.current);
	}
	else {
		comparison = bMax - aMax;
	}

	return comparison;
}

function markTopThree(element) {
	// Note: 2, 3, 4 because the first child is the title
	element.find('.entrant:nth-child(2)').addClass('leader').addClass('first');
	element.find('.entrant:nth-child(3)').addClass('leader').addClass('second');
	element.find('.entrant:nth-child(4)').addClass('leader').addClass('third');
}

function centerLogo() {
	$('img.centered_logo').load(function() {
		$(this).css('margin-left', -1 * $(this).width() / 2);
		$(this).css('margin-top', -1 * $(this).height() / 2);
	}).each(function() {
		$(this).load();
	});
}

$(function() {
	centerLogo();

	if ($('#competition-container').length) { // Test for "competitions" page

		var compsRef = new Firebase('https://whalesite.firebaseio.com/Competitions');

		compsRef.on('child_added', function (snapshot) {

			var entry = snapshot.val();
			var entrants = Array();

			$.each(entry.Entrants, function() {
				entrants.push(this);
			});

			entrants.sort(sortByCurrentStreak)

			dust.render("current_streak", {title: 'Current Streak', entrants: entrants}, function(err, out) {
				out = $(out);
				markTopThree(out);
				$("#competition-container").append(out);
			});

			entrants.sort(sortByMaxStreak)

			dust.render("max_streak", {title: 'Max Streak', entrants: entrants}, function(err, out) {
				out = $(out);
				markTopThree(out);
				$("#competition-container").append(out);
			});
		});

		compsRef.on('child_modified', function(snapshot) {
			
		});
	}
});