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

		// var template = $.ajax({ // Manual ajax call, so I can set async to false
		// 	url: 		'http://' + window.location.host + '/static/templates/competition.html',
		// 	async: 		false
		// }).responseText;

		// var githubEntrantTemplate= $.ajax({ // Manual ajax call, so I can set async to false
		// 	url: 		'http://' + window.location.host + '/static/templates/gh_entrant.html',
		// 	async: 		false
		// }).responseText;
		compsRef.on('child_added', function (snapshot) {

			var entry = snapshot.val();
			var entrants = Array();

			$.each(entry.Entrants, function() {
				entrants.push(this);
			});

			console.log(entrants);

			dust.render("competition", {title: snapshot.name(), entrants: entrants}, function(err, out) {
				$("#competition-container").append(out);
			});
		});

		compsRef.on('child_modified', function(snapshot) {
			
		});
	}
});