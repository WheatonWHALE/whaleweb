// ============================= General =======================================

function get(url, progressFunc) {
    return Promise.resolve(
        $.ajax({
            type: 'GET',
            url: url,
            xhr: function() {
                var xhr = new window.XMLHttpRequest();

                //Download progress
                xhr.addEventListener("progress", progressFunc, false);

                return xhr;
            }
        })
    );
}

// ============================= GitHub ========================================

function sortByKeyAndSubkey(a, b, key, secondaryKey) {
    var aVal = parseInt(a[key]), bVal = parseInt(b[key]);

    if (aVal == bVal) {
        comparison = parseInt(b[secondaryKey]) - parseInt(a[secondaryKey]);
    }
    else {
        comparison = bVal - aVal;
    }

    return comparison;
}

function sortByCurrentStreak(a, b) {
    return sortByKeyAndSubkey(a, b, 'current', 'max');
}

function markTopThree(element) {
    /*
    Function to mark the top three people as being in the lead. Used in css.
    */

    element.find('.entrant:nth-child(1)').addClass('leader').addClass('first');
    element.find('.entrant:nth-child(2)').addClass('leader').addClass('second');
    element.find('.entrant:nth-child(3)').addClass('leader').addClass('third');
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

function setUpGitHubPage() {
    var compsRef = new Firebase('https://whalesite.firebaseio.com/Competitions');

    compsRef.on('child_added', function addChildrenCompetitionsToPage(snapshot) {

        var entry = snapshot.val();

        var entrants = [];
        // Iterate over object, convert to array
        $.each(entry.Entrants, function() {
            entrants.push(this);
        });

        entrants.sort(sortByCurrentStreak);

        dust.render("competition", 
            {
                label: 'days',
                entrants: entrants
            },
            postProcessAndAppend);

        // Roundabout method of assigning change listener to every entrant individually
        snapshot.ref().child('Entrants').on('child_changed', function(snapshot) {
            var changedEntrant = snapshot.val();

            var $entrantDiv = $('#' + changedEntrant.id);

            (['current', 'max', 'total']).forEach(function(key) {
                $entrantDiv.find('.' + key).html(changedEntrant[key]);
            });
        });
    });

    // ================================================================================

    $('header').click(function updateCompetitions() {
        $.get('refresh-competitions/', function() {
            console.log('Update request sent!');
        });
    });
}

// ============================= OnLoad ========================================

setUpGitHubPage();
