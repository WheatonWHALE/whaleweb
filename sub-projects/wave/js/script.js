// ============================= Helpers =======================================

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

function post(url, data) {
    return Promise.resolve(
        $.ajax({
            type: 'POST',
            url: url,
            data: data
        })
    );
}

function postSync(url, data) {
    return $.ajax({
        type: 'POST',
        url: url,
        data: data,
        async: false
    });
}

function setStringify(es6SetObj) {
    var buffObj = {};

    for (var key in es6SetObj) {
        buffObj[key] = Array.from(es6SetObj[key]);
    }

    return JSON.stringify(buffObj);
}

var inProgress = false;
function displayError(errorMessage) {
    if (inProgress) return; // Don't try two error messages at once...

    var $msgDiv = $('#error-message');
    var oldContents = $msgDiv.html();

    var visibilityLength = 1000,
        fadeOutLength = 375;

    inProgress = true;
    $msgDiv.html(errorMessage).show().delay(visibilityLength).fadeOut(fadeOutLength);

    setTimeout(function() {
        if (oldContents)
            $msgDiv.html(oldContents).show();
        else
            $msgDiv.html('');

        inProgress = false;
    }, visibilityLength + fadeOutLength + 50);
}

function findCourseCode($courseDiv) {
    return $courseDiv.find('div:nth-child(1)').text()/*.split(/ /)[0]*/;
}

// ============================= Global Variables ==============================

var wavePage = wavePage || {};

wavePage.cart = {};
wavePage.schedule = {};

// ============================= General stuff =================================

function closeExpandedInfo() {
    $('div.expanded').removeClass('expanded');
}
function openCollapsedInfo(collapsedCourseDiv) {
    closeExpandedInfo();
    collapsedCourseDiv.addClass('expanded');
}

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

var currPreview;
function setUpWaveCourseCallbacks() {
    $('.course a').attr('target', '_blank');

    // $('.course').hover(function mouseIn(evt) {
    //     var courseDiv = $(evt.target).closest('.course');
    //     var timeText = courseDiv.find('div:nth-child(3)').text();
    //     if (timeText.match(/TBA/)) return;

    //     currPreview = wavePage.schedule.extractDaysAndTimes(timeText);
    //     currPreview.crn = courseDiv.attr('id');

    //     wavePage.schedule.addCourse(currPreview.days, currPreview.times, currPreview.crn, false);
    // }, function mouseOut(evt) {
    //     if (currPreview) {
    //         wavePage.schedule.removeCourse(currPreview.days, currPreview.times, currPreview.crn, false);
    //         currPreview = undefined;
    //     }
    // });

    $('.course .add').click(function handleCourseOnSchedule(evt) {
        var crn = $(evt.target).closest('.course').attr('id').replace(/#/, '');

        wavePage.addOrRemoveCourse(crn);
    });
}

var loadingContents;
var originalSchedule, originalCart;
function fetchAndShowWaveHtml() {
    wavePage.currentSemester = $('input#semester').val();

    // If first time, grabs placeholder "while loading" contents
    loadingContents = loadingContents || $('#course-container').html();
    // Set up loading contents
    $('#course-container').html(loadingContents);

    return get('/wave/data?semester=' + wavePage.currentSemester, updateProgress)
        .then(function appendToPage(html) {
            $('#course-container #loading-placeholder').remove();
            $('#course-container').html(html);
            $('#course-container a').attr('target', '_blank');
        })
        .then(function triggerFilters() {
            $('select[name=department]').change();
            $('select[name=foundation], select[name=division], select[name=area]').change();
        })
        .then(setUpWaveCourseCallbacks)
        .then(function refreshPageContents() {
            if (!(wavePage.currentSemester in wavePage.cart)) {
                wavePage.cart[wavePage.currentSemester] = new Set();
            }

            // console.log(Array.from(wavePage.cart[wavePage.currentSemester]));

            // Grab schedule and cart div
            var $schedule = $('#schedule');
            var $cart = $('#cart');

            // Cache original schedule and cart
            originalSchedule = originalSchedule || $schedule.html();
            originalCart = originalCart || $cart.html();

            // Reset the schedule and cart
            $schedule.html(originalSchedule);
            $cart.html(originalCart);

            for (var crn of wavePage.cart[wavePage.currentSemester]) { // Set iteration syntax
                wavePage.setCourseStatus(crn, true);
            }
        })
        .catch(function handleError(err) {
            console.log(err.stack);
        });
}

function initializeWavePage() {
    var $errorMessage = $('#error-message');
    if ($errorMessage.html()) {
        $errorMessage.show();
    }

    $('select[name=semester]').val(semester);

    for (var key in cartData) {
        wavePage.cart[key] = new Set(cartData[key]);
    }
    
    fetchAndShowWaveHtml();

    var dummyColumn = $('#schedule').find('.sched-col');
    wavePage.schedule.timeStep = $(dummyColumn.find('.sched-row').get(1)).data('timeslot') -
                                $(dummyColumn.find('.sched-row').get(0)).data('timeslot');

    wavePage.schedule.$div = $('#schedule');

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

    $('select[name=semester]').change(function() {
        $('input#semester').val($(this).val());

        fetchAndShowWaveHtml();
    });

    $('select[name=department]').change(function() {
        var name = $(this).attr('name');
        var selector = $(this).val();
        toggleContainer('.' + name + 'Container', selector);
    });

    $('select[name=foundation], select[name=division], select[name=area]').change(function() {
        var name = $(this).attr('name');
        var selector = $(this).val();
        toggleIndividuals(name, selector);
    });
}

// ============================= Cart Stuff ====================================

window.onbeforeunload = function saveData(e) {
    var result = postSync('save', { cart: setStringify(wavePage.cart), sessionId: sessionId, semester: $('input#semester').val() });
    console.log('Successful: ' + result.responseText);

    return null; // We want no confirmation popup dialog
}

// ============================= Schedule Stuff ================================

wavePage.schedule = {};

wavePage.schedule.extractDaysAndTimes = function(plainTimeText) {
    if (plainTimeText.match(/TBA/)) {
        return null;
    }

    var timeTexts = plainTimeText.split('<br>');

    var monMatch = /^\s*M\s*T?\s*W?\s*R?\s*F?/,
        tueMatch = /^\s*M?\s*T\s*W?\s*R?\s*F?/,
        wedMatch = /^\s*M?\s*T?\s*W\s*R?\s*F?/,
        thuMatch = /^\s*M?\s*T?\s*W?\s*R\s*F?/,
        friMatch = /^\s*M?\s*T?\s*W?\s*R?\s*F/;

    var startTimeMatch = /(\d?\d\:\d\d\s+[A|P]M)\s+\-/,
        endTimeMatch = /\-\s+(\d?\d\:\d\d\s+[A|P]M)/;

    var timeSets = [];

    for (var index in timeTexts) {
        var timeText = timeTexts[index];

        timeSets.push({
            days: {
                mon: !!(timeText.match(monMatch)),
                tue: !!(timeText.match(tueMatch)),
                wed: !!(timeText.match(wedMatch)),
                thu: !!(timeText.match(thuMatch)),
                fri: !!(timeText.match(friMatch))
            },

            times: {
                start: wavePage.schedule.decodeTime(timeText.match(startTimeMatch)[1]),
                end: wavePage.schedule.decodeTime(timeText.match(endTimeMatch)[1])
            }
        });
    }

    return timeSets;
}

wavePage.schedule.decodeTime = function(strTime) {
    // parse out the time, and mod by 1200 to remove issue with 12:30 PM becoming 2430. Add 1200 if PM.
    return ( parseInt(strTime.replace(/:| /g, '')) % 1200 ) + ( strTime.slice(-2) == "PM" ? 1200 : 0 );
}

wavePage.schedule.setDisplay = function(crn, adding) {
    var $courseDiv = $('#' + crn);
    var courseCode = findCourseCode($courseDiv);

    var dayTimes = wavePage.schedule.extractDaysAndTimes($courseDiv.find('div:nth-child(3)').html());

    if (dayTimes === null)
        return;

    var $scheduleDiv = wavePage.schedule.$div;

    var newlyAdded = [];

    for (var index in dayTimes) {
        var dayTime = dayTimes[index];

        for (var day in dayTime.days) {
            if (!dayTime.days[day]) continue;

            var dayCol = $scheduleDiv.find('#' + day);

            for (var currTime = dayTime.times.start; currTime <= dayTime.times.end; currTime += wavePage.schedule.timeStep) {
                if ((currTime % 100) === 60) // Addresses issue with using base-60 (hours on a clock) in base-100 (because logic)
                    currTime += 40;

                var timeslot = dayCol.find('[data-timeslot=' + currTime + ']');

                if (adding && timeslot.hasClass('added')) {
                    var conflictCrn = timeslot.data('ttip');
                    var err = new Error('Conflict with ' + conflictCrn);
                    err.conflictWith = conflictCrn;
                    // return { conflict:  }; // Exit immediately, returning that a conflict happened
                    throw err;
                }

                newlyAdded.push({ day: day, time: currTime });
            }
        }
    }

    for (var index in newlyAdded) {
        var newDayTime = newlyAdded[index];

        var newAdditionDiv = $scheduleDiv.find('#' + newDayTime.day).find('[data-timeslot=' + newDayTime.time + ']');

        if (adding) {
            newAdditionDiv.addClass('added');
            newAdditionDiv.html(courseCode);
            newAdditionDiv.attr('data-ttip', courseCode);
        }
        else {
            newAdditionDiv.removeClass('added');
            newAdditionDiv.html('');
            newAdditionDiv.attr('data-ttip', '');
        }
    }


    return null;
}

// ============================= Global Stuff ==================================

wavePage.addOrRemoveCourse = function(crn) {
    var alreadyPresent = wavePage.cart[wavePage.currentSemester].has(crn);

    wavePage.setCourseStatus(crn, !alreadyPresent)
}

wavePage.setCourseStatus = function(crn, status) {
    var scheduleConflict;
    try {
        wavePage.setScheduleStatus(crn, status);
    }
    catch (err) {
        scheduleConflict = err.conflictWith;
    }

    if (!scheduleConflict) {
        wavePage.setStatusInCart(crn, status);
        wavePage.setCourseDivStatus(crn, status);
    }
    else {
        displayError('Course conflicts with another already in schedule: ' + scheduleConflict);
    }
}

wavePage.setStatusInCart = function(crn, adding) {
    var cartIdPrefix = 'cart-';
    var courseCode = findCourseCode($('#' + crn));

    if (adding) {
        var newCartEntry = $('<div/>', { id: cartIdPrefix + crn });

        newCartEntry.append($('<a/>', {
            text: courseCode,
            href: '#' + crn
        }));

        $('#cart-contents').append(newCartEntry);
        wavePage.cart[wavePage.currentSemester].add(crn);
    }
    else {
        wavePage.cart[wavePage.currentSemester].delete(crn);
        $('#cart-contents').find('#' + cartIdPrefix + crn).remove();
    }
}

wavePage.setCourseDivStatus = function(crn, adding) {
    var $courseDiv = $('#' + crn);

    if (adding) {
        $courseDiv.addClass('saved');
        $courseDiv.find('.add').removeClass('fi-plus').addClass('fi-minus');
    }
    else {
        $courseDiv.removeClass('saved');
        $courseDiv.find('.add').removeClass('fi-minus').addClass('fi-plus');
    }
}

wavePage.setScheduleStatus = function(crn, adding) {
    return wavePage.schedule.setDisplay(crn, adding);
}

// ============================= OnLoad ========================================

initializeWavePage();
