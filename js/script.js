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
    else if (key == 'total') {
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
    return extractData(entrants, 'total');
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
            compId: 'total',
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
                else if (entrantElement.parents('.competition#total').length) {
                    entrantElement.find('.score').html(changedEntrant.total + ' total');
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
function closeExpandedInfo() {
    $('div.expanded').removeClass('expanded').find('i.exp').removeClass(openedIconClass).addClass(closedIconClass);
}
function openCollapsedInfo(collapsedCourseDiv) {
    closeExpandedInfo();
    collapsedCourseDiv.addClass('expanded').find('i.exp').removeClass(closedIconClass).addClass(openedIconClass);
}

var loadingContents;
function getWAVEData() {
    var year = $('input#year').val();

    // If first time, grab placeholder "while loading" contents
    loadingContents = loadingContents || $('.dataContainer').html();
    // Set up loading contents
    $('.dataContainer').html(loadingContents);

    get('/wave/data?year=' + year, updateProgress).then(function appendToPage(html) {
        $('.dataContainer #loading-placeholder').remove();
        $('.dataContainer').html(html);
        $('.dataContainer a').attr('target', '_blank');
    }).then(function triggerFilters() {
        $('select[name=semester], select[name=department]').change();
        $('select[name=foundation], select[name=division], select[name=area]').change();
    }).catch(function handleError(err) {
        console.error(err);
    });
}

function setUpWAVEPage() {
    getWAVEData();

    $(document).click(function handleClick(evt) {
        var evtTarget = $(evt.target);
        if ( evtTarget.is('.' + closedIconClass) ) {
            openCollapsedInfo(evtTarget.parent().parent());
        }
        else if ( evtTarget.children().is('.' + closedIconClass)) {
            openCollapsedInfo(evtTarget.parent());
        }
        // Test if clicked thing, or one of its ancestors, is the info div
        else if ( evtTarget.closest('.expanded > div:last-child').length ) {
            // Do nothing
        }
        else {
            closeExpandedInfo();
        }
    });

    $('select[name=year]').change(function() {
        // $(this).parents('form').submit();
        $('input#year').val($(this).val());

        getWAVEData();
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

    // var timer;

    // var filtersStuck = false;

    // var navBar = $('nav');
    // var filters = $('#filters');
    // var header = $('header');

    // $(window).scroll(function(){
    //     // Timer stuff
    //     if (timer) {
    //         clearTimeout(timer);
    //     }
    //     // Timer to throttle the scroll event so it doesn't happen too often
    //     timer = setTimeout(function fixOrUnfixFilters() {
    //         // var scrollBottom = $(window).scrollTop() + $(window).height();
    //         var scrollTop = $(window).scrollTop();
    //         var navBarBottom = navBar.offset().top + navBar.height();

    //         var headerBottom = header.offset().top + header.height();

    //         // var optionsBottom = (navBar.height()+navBar.offset().top);
    //         var filtersTop = filters.offset().top;

    //         if (!filtersStuck && filtersTop < navBarBottom) {
    //             console.log('Yay')
    //             filters.addClass('stuck');
    //             filtersStuck = true;
    //             // console.log('Yay');
    //         }
    //         if (filtersStuck && headerBottom > navBarBottom) {
    //             console.log('Nope')
    //             filters.removeClass('stuck');
    //             filtersStuck = false;
    //         }

    //         // // if bottom of scroll window at the footer, allow buttons to rejoin page as it goes by
    //         // if (filtersStuck && (scrollBottom >= ($('footer').offset().top))) {
    //         //     // console.log("Scroll bottom hit footer! On the way down");
    //         //     filters.removeClass("fixed");
    //         //     filtersStuck = false;
    //         // }

    //         // // if bottom of scroll window at the footer, fix button to the screen
    //         // if (!filtersStuck && (scrollBottom < ($('footer').offset().top))) {
    //         //     // console.log("Scroll bottom hit footer! On the way up");
    //         //     filters.addClass("fixed");
    //         //     filtersStuck = true;
    //         // }
    //     }, 10);
    // });

    // $(window).scroll(); // Call a dummy scroll event after everything is loaded.
}

// ============================= Feedback ======================================

function setUpFeedbackPage() {
    $('form').submit(function validateForm() {
        var $this = $(this);

        var emptyInputs = $this.find('input:not([type=submit]), textarea').filter(function findIfEmpty() {
            return !( $(this).data('optional') !== undefined || $(this).val() );
        });

        if (emptyInputs.length) {
            $('#error-message').html(emptyInputs.length + ' required area(s) currently missing');
            return false;
        }
    })
}

// ============================= OnLoad ========================================

$(function() {
    var route = window.location.pathname;
    if (route == '/github') { // Test for "github" page
        setUpGitHubPage();
    }
    else if (route == '/wave') {
        setUpWAVEPage();
    }
    else if (route == '/feedback') {
        setUpFeedbackPage();
    }
});

// =============================================================================
