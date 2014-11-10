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

var wavePage = wavePage || {};

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
        $('.course:not(.' + activeFilters[type] + ')').removeClass(type+'-hidden');
    }

    if (selector == 'all') {
        delete activeFilters[type];
    }
    else {
        $('.course:not(.' + selector + ')').addClass(type+'-hidden');
        activeFilters[type] = selector;
    }
}

function updateProgress(oEvent) {
    if (oEvent.lengthComputable) {
        $('#progress-value').html(Math.floor(100 * oEvent.loaded / oEvent.total) + '%');
    }
}

function Schedule($div) {
    this.$div = $div;

    // Initialize schedule data structure
    this.sched = {};
    var _this = this;

    this.$div.find('.sched-col').each(function handleColumn(index, entry) {
        if (this.id == 'label-col') return;

        var dayId = this.id;

        _this.sched[dayId] = {};

        $(this).find('.sched-row').each(function handleRow(index, entry) {
            _this.sched[dayId][parseInt($(entry).data('timeslot'))] = {};
        });
    });
}

function setCourseOnSchedule(days, times, permanent, crn) {
    var className = permanent ? 'added' : 'previewing';
    for (key in days) {
        if (days[key]) {
            var $day = $('#' + key);

            $day.find('.sched-row').each(function eachTime(index, entry) {
                var timeslot = parseInt($(entry).data('timeslot'));

                if (timeslot >= times.start && timeslot <= times.end) {
                    var $entry = $(entry);
                    // console.log(entry);
                    // console.log(crn);
                    console.log($entry);
                    console.log($entry.is('.' + crn));
                    if ($entry.is('.' + crn)) $entry.removeClass(className).removeClass(crn);
                    else if ($entry.is('.' + crn + ':not(.' + className + ')')) $entry.toggleClass('conflicted');
                    else $entry.addClass(className).addClass(crn);
                    // if ($entry.is('.' + className)) $entry.toggleClass('conflicted');
                    // else $entry.toggleClass(className);
                }
            });
        }
    }
}

Schedule.prototype.handleLogic = function handleLogic(day, timeslot, $entry, className, crn, permanent, adding) {
    var removing = !adding;

    var thisTimeslot = this.sched[day][timeslot];

    if (permanent) {
        console.log('adding: ' + adding);
        if (adding) {
            $entry.addClass('added');
            if (crn in thisTimeslot)
                thisTimeslot[crn] += 1;
            else
                thisTimeslot[crn] = 1;
        }
        else {
            if (Object.keys(thisTimeslot).length <= 1)
                $entry.removeClass('added');
            thisTimeslot[crn] -= 1;
        }
    }
    else {
        if (adding) {
            $entry.addClass('previewing');
            if (crn in thisTimeslot)
                thisTimeslot[crn] += 1;
            else
                thisTimeslot[crn] = 1;
        }
        else {
            $entry.removeClass('previewing');
            thisTimeslot[crn] -= 1;
        }
    }

    if (thisTimeslot[crn] == 0)
        delete thisTimeslot[crn];

    console.log('Showing: ' + day + ' - ' + timeslot + ': ' + JSON.stringify(thisTimeslot));

    if (Object.keys(thisTimeslot).length > 1) {
        $entry.addClass('conflicted');
    }
    else {
        $entry.removeClass('conflicted');
    }
}

Schedule.prototype.handleCourse = function handleCourse(days, times, crn, permanent, adding) {
    var className = permanent ? 'added' : 'previewing';
    var _this = this;

    console.log((adding ? 'Adding: ' : 'Removing: ') + crn + ' - ' + className);

    for (day in days) {
        if (!days[day]) continue;
    
        var $day = $('#' + day);

        $day.find('.sched-row').each(function eachTime(index, entry) {
            $entry = $(entry);
            var timeslot = parseInt($entry.data('timeslot'));
            if (timeslot >= times.start && timeslot <= times.end) {
                _this.handleLogic(day, timeslot, $entry, className, crn, permanent, adding);
            }
        });
    }
}

Schedule.prototype.addCourse = function addCourse(days, times, crn, permanent) {
    this.handleCourse(days, times, crn, permanent, true);
}

Schedule.prototype.removeCourse = function removeCourse(days, times, crn, permanent) {
    this.handleCourse(days, times, crn, permanent, false);
}

Schedule.prototype.extractDaysAndTimes = function extractDaysAndTimes(timeText) {
    var monMatch = /^\s*M\s*T?\s*W?\s*R?\s*F?/,
        tueMatch = /^\s*M?\s*T\s*W?\s*R?\s*F?/,
        wedMatch = /^\s*M?\s*T?\s*W\s*R?\s*F?/,
        thuMatch = /^\s*M?\s*T?\s*W?\s*R\s*F?/,
        friMatch = /^\s*M?\s*T?\s*W?\s*R?\s*F/;

    var startTimeMatch = /(\d?\d\:\d\d\s+[A|P]M)\s+\-/,
        endTimeMatch = /\-\s+(\d?\d\:\d\d\s+[A|P]M)/;

    return {
        days: {
            mon: !!(timeText.match(monMatch)),
            tue: !!(timeText.match(tueMatch)),
            wed: !!(timeText.match(wedMatch)),
            thu: !!(timeText.match(thuMatch)),
            fri: !!(timeText.match(friMatch))
        },

        times: {
            start: this.decodeTime(timeText.match(startTimeMatch)[1]),
            end: this.decodeTime(timeText.match(endTimeMatch)[1])
        }
    }
}

Schedule.prototype.decodeTime = function decodeTime(strTime) {
    // parse out the time, and mod by 1200 to remove issue with 12:30 PM becoming 2430. Add 1200 if PM.
    return (parseInt(strTime.replace(/:| /g, '')) % 1200) + (strTime.slice(-2) == "PM" ? 1200 : 0);
}

var currPreview;
function setUpWAVECourseCallbacks() {
    $('.dataContainer a').attr('target', '_blank');

    $('.course').hover(function mouseIn(evt) {
        var courseDiv = $(evt.target).closest('.course');
        var timeText = courseDiv.find('div:nth-child(3)').text();
        if (timeText.match(/TBA/)) return;

        currPreview = wavePage.schedule.extractDaysAndTimes(timeText);
        currPreview.crn = courseDiv.attr('id');

        wavePage.schedule.addCourse(currPreview.days, currPreview.times, currPreview.crn, false);
    }, function mouseOut(evt) {
        if (currPreview) {
            wavePage.schedule.removeCourse(currPreview.days, currPreview.times, currPreview.crn, false);
            currPreview = undefined;
        }
    });

    $('.add').click(function handleCourseOnSchedule(evt) {
        var $evtTarget = $(evt.target);
        $evtTarget.toggleClass('fi-plus fi-minus');

        var timeText = $evtTarget.closest('.course').find('div:nth-child(3)').text();

        if (timeText.match(/TBA/)) return;

        // Display that the course is currently actively 'saved'
        $evtTarget.closest('.course').toggleClass('saved');

        var currAdded = wavePage.schedule.extractDaysAndTimes(timeText);
        currAdded.crn = $evtTarget.closest('.course').attr('id');

        wavePage.schedule.handleCourse(currAdded.days, currAdded.times, currAdded.crn, true, $evtTarget.hasClass('fi-minus'));
    });
}

var closedIconClass = 'fi-plus';
var openedIconClass = 'fi-minus';
function closeExpandedInfo() {
    $('div.expanded').removeClass('expanded');//.find('i.exp').removeClass(openedIconClass).addClass(closedIconClass);
}
function openCollapsedInfo(collapsedCourseDiv) {
    closeExpandedInfo();
    collapsedCourseDiv.addClass('expanded');//.find('i.exp').removeClass(closedIconClass).addClass(openedIconClass);
}

var loadingContents;
function getAndSetupWAVEData() {
    var year = $('input#year').val();

    // If first time, grab placeholder "while loading" contents
    loadingContents = loadingContents || $('.dataContainer').html();
    // Set up loading contents
    $('.dataContainer').html(loadingContents);

    return get('/wave/data?year=' + year, updateProgress).then(function appendToPage(html) {
        $('.dataContainer #loading-placeholder').remove();
        $('.dataContainer').html(html);
        $('.dataContainer a').attr('target', '_blank');
    }).then(setUpWAVECourseCallbacks)
    .then(function triggerFilters() {
        console.log('Triggering filters');
        $('select[name=semester], select[name=department]').change();
        $('select[name=foundation], select[name=division], select[name=area]').change();
    }).catch(function handleError(err) {
        console.error(err);
    });
}

function setUpWAVEPage() {
    getAndSetupWAVEData();

    $(document).click(function handleClick(evt) {
        var $evtTarget = $(evt.target);
        // Clicked on the "more info" element with an non-expanded info div
        if ( $evtTarget.is('.exp') && !$evtTarget.closest('.course').is('.expanded') ) {
            openCollapsedInfo($evtTarget.parent().parent());
        }
        // Clicked on div containing "more info" element with a non-expanded info div
        else if ( $evtTarget.children('.exp').length && !$evtTarget.closest('.course').is('.expanded') ) {
            openCollapsedInfo($evtTarget.parent());
        }
        // Test if clicked thing, or one of its ancestors, is the info div
        else if ( $evtTarget.closest('div').is('.expanded > div:last-child') || $evtTarget.is('i.add') ) {
            // Do nothing
        }
        else {
            closeExpandedInfo();
        }
    });

    $('select[name=year]').change(function() {
        $('input#year').val($(this).val());

        getAndSetupWAVEData();
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
        wavePage.schedule = new Schedule($('#schedule'));
        setUpWAVEPage();
    }
    else if (route == '/feedback') {
        setUpFeedbackPage();
    }
});

// =============================================================================
