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

		console.log(dust);
		// var competitionCompiled = dust.compile("<div class="competition"><div class="title"></div></div>");

		var compsRef = new Firebase('https://whalesite.firebaseio.com/Competitions');

		// var template = $.ajax({ // Manual ajax call, so I can set async to false
		// 	url: 		'http://' + window.location.host + '/static/templates/competition.html',
		// 	async: 		false
		// }).responseText;

		// var githubEntrantTemplate= $.ajax({ // Manual ajax call, so I can set async to false
		// 	url: 		'http://' + window.location.host + '/static/templates/gh_entrant.html',
		// 	async: 		false
		// }).responseText;

		var lastID = 0;
		compsRef.on('child_added', function (snapshot) {

			var entry = snapshot.val();

			$.each(entry.Entrants, function() {
				if (this.name == '') {
					return;
				}

				console.log("derp");


				// var entrantTemplateCopy = githubEntrantTemplate;

				// entrantTemplateCopy.find('id')


				// entrantTemplateCopy = $(entrantTemplateCopy);

				dust.render("competition", {name: "Bryan"}, function(err, out) {
					console.log(out);
				});


				// entrantTemplateCopy.find('.bar').css('width', this.current * scalar);

				// templateCopy.append(entrantTemplateCopy);

				// $('#competition-container').append(templateCopy);
			});
		});
	}
});