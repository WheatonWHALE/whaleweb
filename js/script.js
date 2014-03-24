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

		compsRef.on('child_added', function (snapshot) {
			var entry = snapshot.val();
			var template = $.get(window.location.host + '/static/templates/competition.html');

			// console.dir(entry.Entrants);

			$.each(entry.Entrants, function() {
				// console.dir(this.name);
				if (this.name != '') {
					console.log(this.name);
				}
				// if (typeof(this) == typeof(Object)) {
					// console.dir(this);
				// }
				// console.dir(this);
			});
		});
	}
});