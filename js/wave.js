$(function() {
	// console.log('test');
	$('.course-entry').click(function() {
		$(this).find('.secondary-info').toggleClass('showing');
	})
});