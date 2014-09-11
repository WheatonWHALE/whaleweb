function sortByCurrentStreak(a, b) {
	var aCurrent = parseInt(a.current);
	var bCurrent = parseInt(b.current);

	if (aCurrent == bCurrent) {
		var aMax = parseInt(a.max);
		var bMax = parseInt(b.max);

		comparison = bMax - aMax;
	}
	else {
		comparison = bCurrent - aCurrent;
	}

	return comparison;
}

function centerLogo() {
	$('img#logo').load(function() {
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

			dust.render("competition", {title: snapshot.name(), entrants: entrants}, function(err, out) {
				$("#competition-container").append(out);
			});
		});

		compsRef.on('child_modified', function(snapshot) {
			
		});
	}
});