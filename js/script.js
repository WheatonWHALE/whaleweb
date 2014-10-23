// ============================= General =======================================

// function get(url, progressFunc) {
//     return new Promise(function(resolve, reject) {
//         var req = new XMLHttpRequest();
//         req.open('GET', url);

//         req.onload = function() {
//             if (req.status == 200) {
//                 resolve(req.response);
//             }
//             else {
//                 reject(Error(req.statusText));
//             }
//         };

//         if (progressFunc) {
//             req.addEventListener("progress", progressFunc, false);
//         }

//         req.onerror = function() {
//             reject(Error("Network Error"));
//         };

//         req.send();
//     });
// }

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
    return sortByKeyAndSubkey(a, b, 'total', 'max');
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

function setUpGitHubPage() {
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

// ============================= WAVE ==========================================

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
    if (type in activeFilters) {
        $('.departmentContainer > div:not(.' + activeFilters[type] + ')').removeClass(type+'-hidden');
    }

    if (selector == 'all') {
        delete activeFilters[type];
    }
    else {
        $('.departmentContainer > div:not(.' + selector + ')').addClass(type+'-hidden');
        activeFilters[type] = selector;
    }
}

function updateProgress(oEvent) {
    if (oEvent.lengthComputable) {
        $('#progress-value').html(Math.floor(100 * oEvent.loaded / oEvent.total) + '%');
    }
}

var closedIconClass = 'fi-plus';
var openedIconClass = 'fi-minus';
var expanderThis;
function getWAVEData() {
    var year = $('input#year').val();

    get('/wave/data?year=' + year, updateProgress).then(function appendToPage(html) {
        $('.dataContainer #loading-placeholder').remove();
        $('.dataContainer').append(html);
    }).then(function setUpOtherCallbacks() {
        // Set up callbacks taht have to do with course data
        $(function() {
            $('i.exp').click(function(evt) {
                expanderThis = $(this);
            });

            $('body').click(function(evt) {
                // If the click was originally on a expander icon
                if (expanderThis) {
                    // if the icon that was clicked on was expanded already
                    if (expanderThis.parent().parent().hasClass('expanded')) {
                        expanderThis.removeClass(openedIconClass).addClass(closedIconClass);
                        expanderThis.parent().parent().removeClass('expanded');
                    }
                    else {
                        var alreadyExpanded = $('div.expanded');
                        alreadyExpanded.removeClass('expanded');
                        alreadyExpanded.find(openedIconClass).removeClass(openedIconClass).addClass(closedIconClass);

                        expanderThis.removeClass(closedIconClass).addClass(openedIconClass);
                        expanderThis.parent().parent().addClass('expanded');
                    }
                    // Reset back to undefined, for testing against click events on body or on i.exp
                    expanderThis = undefined;
                }
                else {
                    $('div.expanded').removeClass('expanded').find('i.exp').removeClass(openedIconClass).addClass(closedIconClass);
                }
            });
        });
    }).catch(function handleError(err) {
        console.error(err);
    });
}

function setUpWAVEPage() {
    getWAVEData();

    $('select[name=year]').change(function() {
        $(this).parents('form').submit();
    });

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

    $('select[name=year]').val($('input#year').val());
}

// ============================= OnLoad ========================================

$(function() {
    if (window.location.pathname == '/github') { // Test for "github" page
        setUpGitHubPage();
    }
    else if (window.location.pathname == '/wave') {
        setUpWAVEPage();
    }
});

// =============================================================================
