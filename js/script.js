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

	if ($('.competition').length) {
		var compsRef = new Firebase('https://whalesite.firebaseio.com/Competitions');

		var template = $.ajax({ // Yay! - isn't this ugly?
			url: 		'http://' + window.location.host + '/static/templates/competition.html',
			async: 		false
		}).responseText;

		var githubEntrantTemplate= $.ajax({ // Yay! - isn't this ugly?
			url: 		'http://' + window.location.host + '/static/templates/gh_entrant.html',
			async: 		false
		}).responseText;

		var lastID = 0;

		compsRef.on('child_added', function (snapshot) {
			var entry = snapshot.val();

			// console.dir(entry.Entrants);
			var copy = template;

			$.each(entry.Entrants, function() {
				if (this.name == '') {
					return;
				}

				console.dir(this);
				// console.dir(this.name);

				copy = copy.replace(/\{id\}/, lastID++);
				copy = copy.replace(/\{name\}/, this.name);

				console.dir(copy);

				$('#competition-container').append($(copy));
				// copy = copy.replace(/\{current\}/, this.name);
				// if (typeof(this) == typeof(Object)) {
					// console.dir(this);
				// }
				// console.dir(this);
			});
		});
	}
});