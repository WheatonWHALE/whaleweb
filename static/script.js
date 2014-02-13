function centerLogo() {
	var logo = $('img#logo')
	logo.css('margin-left', -1 * logo.width() / 2);
	logo.css('margin-top', -1 * logo.height() / 2);
}

$(function() {
	centerLogo();
});