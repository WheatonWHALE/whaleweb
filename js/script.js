// ========================================================================================================================

function sortByKeyAndSubkey(a, b, key, otherKey) {
    var aVal = parseInt(a[key]), bVal = parseInt(b[key]);

    if (aVal == bVal) {
        comparison = parseInt(b[otherKey]) - parseInt(a[otherKey]);
    }
    else {
        comparison = bVal - aVal;
    }

    return comparison;
}

function sortByCurrentStreak(a, b) {
    return sortByKeyAndSubkey(a, b, 'current', 'max');
}

function sortByMaxStreak(a, b) {
    return sortByKeyAndSubkey(a, b, 'max', 'current');
}

function sortByYearData(a, b) {
    return sortByKeyAndSubkey(a, b, 'year', 'max');
}

function extractData(entrants, key) {
    var processedEntrants = [];

    entrants.forEach(function extractAndPushEntrant(entry, index) {
        entry.streakVal = entry[key];
        processedEntrants.push(entry);
    });

    if (key == 'current') {
        processedEntrants.sort(sortByCurrentStreak);
    }
    else if (key == 'max') {
        processedEntrants.sort(sortByMaxStreak);
    }
    else if (key == 'year') {
        processedEntrants.sort(sortByYearData);
    }
    else {
        console.error('Unrecognized key');
    }

    return processedEntrants;
}

function extractMaxStreak(entrants) {
    return extractData(entrants, 'max');
}

function extractCurrentStreak(entrants) {
    return extractData(entrants, 'current');
}

function extractYearData(entrants) {
    return extractData(entrants, 'year');
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
    element.find('.score').each(function addClassToStreakless() {
        var that = $(this);

        if (that.html() == '0 days')
            that.parents('.entrant').addClass('streakless');
    });
}

function postProcessAndAppend(err, element) {
    element = $(element);
    markTopThree(element);
    markStreakless(element);
    $("#competition-container").append(element);
}

// ========================================================================================================================

function toggleContainer(container, selector) {
    if (selector == 'all') {
        $(container).removeClass('hidden');
    }
    else {
        $(container + ':not(.' + selector + ')').addClass('hidden');
        $(container +      '.' + selector).removeClass('hidden');
    }
}

var activeFilters = {};

function toggleIndividuals(type, selector) {
    console.log(type);
    if (selector == 'all') {
        if (type in activeFilters)
            $('.course:not(.' + activeFilters[type] + ')').removeClass(type+'-hidden');

        delete activeFilters[type];
    }
    else {
        if (type in activeFilters)
            $('.course:not(.' + activeFilters[type] + ')').removeClass(type+'-hidden');

        $('.course:not(.' + selector + ')').addClass(type+'-hidden');
        activeFilters[type] = selector;
    }
}

// ========================================================================================================================

$(function() {
    console.dir();
    if (window.location.pathname == '/github') { // Test for "github" page

        var compsRef = new Firebase('https://whalesite.firebaseio.com/Competitions');

        compsRef.on('child_added', function addChildrenCompetitionsToPage(snapshot) {

            var entry = snapshot.val();

            var entrants = [];
            // Iterate over object, convert to array
            $.each(entry.Entrants, function() {
                entrants.push(this);
            });

            dust.render("competition", {title: 'Current Streak',       
                compId: 'current',
                label: 'days',
                entrants: extractCurrentStreak(entrants)},
                postProcessAndAppend);

            dust.render("competition", {title: 'Max Streak',           
                compId: 'max',
                label: 'days',
                entrants: extractMaxStreak(entrants)},
                postProcessAndAppend);
            
            dust.render("competition", {title: 'Contributions (Past Year)',
                compId: 'year',
                label: 'total',
                entrants: extractYearData(entrants)},
                postProcessAndAppend);

            // Roundabout method of assigning change listener to every entrant individually
            snapshot.ref().child('Entrants').on('child_changed', function(snapshot) {
                var changedEntrant = snapshot.val();

                $('.' + changedEntrant.id).each(function(index) {
                    var entrantElement = $(this);

                    if (entrantElement.parents('.competition#max').length) {
                        entrantElement.find('.score').html(changedEntrant.max + ' days');
                    }
                    else if (entrantElement.parents('.competition#current').length) {
                        entrantElement.find('.score').html(changedEntrant.current + ' days');
                    }
                    else if (entrantElement.parents('.competition#year').length) {
                        entrantElement.find('.score').html(changedEntrant.year + ' total');
                    }
                });
            });
        });

        // ================================================================================

        $('header').click(function updateCompetitions() {
            $.get('/refresh-competitions/', function() {
                console.log('Update request sent!');
            });
        });
    }
    else if (window.location.pathname == '/wave') {
        $('select[name=semester], select[name=department]').change(function() {
            var name = $(this).attr('name');
            var selector = $(this).val();
            toggleContainer('.' + name + 'Container', selector);
        });

        $('select[name=foundation], select[name=division], select[name=area]').change(function() {
            var name = $(this).attr('name');
            var selector = $(this).val();
            toggleIndividuals(name, selector);
        });

        $('i.exp').click(function(evt) {
            // $(this).parents('.courseContainer').find('.course').removeClass('expanded');
            $(this).parent().parent().toggleClass('expanded');
        });

        $('select[name=year]').val($('input#year').val());
    }
});

// ========================================================================================================================
