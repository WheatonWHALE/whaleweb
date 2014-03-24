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

			var scalar = $(githubEntrantTemplate).css('width') / entry.maxVal;

			var copy = $(template);

			$.each(entry.Entrants, function() {
				if (this.name == '') {
					return;
				}

				var subcopy = githubEntrantTemplate;

				subcopy = subcopy.replace(/\{id\}/, lastID++);
				subcopy = subcopy.replace(/\{name\}/, this.name);
				subcopy = subcopy.replace(/\{score\}/, this.max);

				subcopy = $(subcopy);


				subcopy.find('.bar').css('width', this.current * scalar);

				copy.append(subcopy);

				$('#competition-container').append(copy);
			});
		});
	}
});