// ========================================================================================================================

function sortByStreak(a, b, key, otherKey) {
    var aVal = parseInt(a[key]), bVal = parseInt(b[key]);

    if (aVal == bVal)
        comparison = parseInt(b[otherKey]) - parseInt(a[otherKey]);
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

function postProcessAndAppend(err, out) {
    out = $(out);
    markTopThree(out);
    markStreakless(out);
    $("#competition-container").append(out);
}

// ========================================================================================================================

$(function() {
    console.dir();
    if (window.location.pathname == '/github') { // Test for "github" page

        var compsRef = new Firebase('https://whalesite.firebaseio.com/Competitions');

        compsRef.on('child_added', function(snapshot) {

            var entry = snapshot.val();

            var entrants = Array();
            $.each(entry.Entrants, function() {
                entrants.push(this);
            });

            dust.render("competition", {title: 'Current Streak', compId: 'current', entrants: extractCurrentStreak(entrants)}, postProcessAndAppend);

            dust.render("competition", {title: 'Max Streak', compId: 'max', entrants: extractMaxStreak(entrants)}, postProcessAndAppend);

            // Roundabout method of assigning change listener to every child individually
            snapshot.ref().child('Entrants').on('child_changed', function(snapshot) {
                var changedEntrant = snapshot.val();

                $('.' + changedEntrant.id).each(function(index) {
                    var entrantElement = $(this);

                    if (entrantElement.parents('.competition#max').length)
                        entrantElement.find('.score').html(changedEntrant.max + ' days');
                    else
                        entrantElement.find('.score').html(changedEntrant.current + ' days');
                });
            });
        });

        // ================================================================================

        $('header').click(function() {
            console.log('test');
            $.get('/refresh-competitions/', function() {
                console.log('Update request sent!');
            });
        });
    }
    else if (window.location.pathname == '/wave') {
        $('select[name=semester]').change(function() {
            var selector = $(this).val();
            $('.semesterContainer:not(.' + selector + ')').addClass('hidden');
            $('.semesterContainer.' + selector).removeClass('hidden');
            // console.log($(this).val());
        });
    }
});

// ========================================================================================================================
