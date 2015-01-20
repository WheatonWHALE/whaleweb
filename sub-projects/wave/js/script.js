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

function setStringify(es6SetObj) {
    var buffObj = {};

    for (var key in es6SetObj) {
        buffObj[key] = Array.from(es6SetObj[key]);
    }

    return JSON.stringify(buffObj);
}

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
    $('.dataContainer a').attr('target', '_blank');

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


        // var $evtTarget = $(evt.target);
        // $evtTarget.toggleClass('fi-plus fi-minus');

        // var timeText = $evtTarget.closest('.course').find('div:nth-child(3)').text();

        // if (timeText.match(/TBA/)) return;

        // // Display that the course is currently actively 'saved'
        // $evtTarget.closest('.course').toggleClass('saved');

        // var currAdded = wavePage.schedule.extractDaysAndTimes(timeText);
        // currAdded.crn = $evtTarget.closest('.course').attr('id');

        // wavePage.schedule.handleCourse(currAdded.days, currAdded.times, currAdded.crn, true, $evtTarget.hasClass('fi-minus'));
    });
}

var loadingContents;
var originalSchedule, originalCart;
function getAndSetupWaveData() {
    wavePage.cart = {};
    for (var key in cartData) {
        wavePage.cart[key] = new Set(cartData[key]);
    }

    wavePage.currentSemester = $('input#semester').val();
    var semester = wavePage.currentSemester;

    // If first time, grabs placeholder "while loading" contents
    loadingContents = loadingContents || $('.dataContainer').html();
    // Set up loading contents
    $('.dataContainer').html(loadingContents);

    return get('/wave/data?semester=' + semester, updateProgress)
        .then(function appendToPage(html) {
            $('.dataContainer #loading-placeholder').remove();
            $('.dataContainer').html(html);
            $('.dataContainer a').attr('target', '_blank');
        })
        .then(setUpWaveCourseCallbacks)
        .then(function triggerFilters() {
            $('select[name=department]').change();
            $('select[name=foundation], select[name=division], select[name=area]').change();
        })
        .then(function everythingElse() {
            var semester = wavePage.currentSemester;
            if (!(semester in wavePage.cart)) {
                wavePage.cart[semester] = new Set();
            }

            // Grab schedule and cart div
            var $schedule = $('#schedule');
            var $cart = $('#cart');

            // Cache original schedule and cart
            originalSchedule = originalSchedule || $schedule.html();
            originalCart = originalCart || $cart.html();

            console.log('originalCart');
            console.log(originalCart);

            // Reset the schedule and cart
            $schedule.html(originalSchedule);
            $cart.html(originalCart);

            for (var crn of wavePage.cart[semester]) {
                wavePage.setCourseStatus(crn, true);
            }
        })
        .catch(function handleError(err) {
            console.log(err.stack);
        });
}

function setUpWavePage() {
    getAndSetupWaveData();

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

    $('select[name=semester]').val($('input#semester').val());

    $('select[name=semester]').change(function() {
        $('input#semester').val($(this).val());

        getAndSetupWaveData();
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
    post('save', { cart: setStringify(wavePage.cart), sessionId: sessionId }); // TODO: Fix serialization of Set()

    return null; // We want no confirmation popup dialog
}

// ============================= Schedule Stuff ================================

function Schedule($div, data) {
    this.$div = $div;

    var _this = this;

    // Initialize schedule data structure
    if (data) {
        this.sched = data;

        for (var dayKey in this.sched) {
            var $dayCol = $('#' + dayKey);

            for (var timeslotKey in this.sched[dayKey]) {
                for (var crnKey in this.sched[dayKey][timeslotKey]) {
                    _this.handleLogic(dayKey, timeslotKey, $dayCol.find('[data-timeslot=' + timeslotKey + ']'), crnKey, true, true);
                    $('#' + crnKey).addClass('saved');
                }
            }
        }
    }
    else {
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
}

Schedule.prototype.handleLogic = function handleLogic(day, timeslot, $entry, crn, permanent, adding) {
    var removing = !adding;
    var className = permanent ? 'added' : 'previewing';

    var thisTimeslotObj = this.sched[day][timeslot];

    if (permanent) {
        if (adding) {
            $entry.addClass('added');
            if (crn in thisTimeslotObj)
                thisTimeslotObj[crn] += 1;
            else
                thisTimeslotObj[crn] = 1;
        }
        else {
            if (Object.keys(thisTimeslotObj).length <= 1)
                $entry.removeClass('added');
            thisTimeslotObj[crn] -= 1;
        }
    }
    else {
        if (adding) {
            $entry.addClass('previewing');
            if (crn in thisTimeslotObj)
                thisTimeslotObj[crn] += 1;
            else
                thisTimeslotObj[crn] = 1;
        }
        else {
            $entry.removeClass('previewing');
            thisTimeslotObj[crn] -= 1;
        }
    }

    if (thisTimeslotObj[crn] == 0)
        delete thisTimeslotObj[crn];

    // console.log('Showing: ' + day + ' - ' + timeslot + ': ' + JSON.stringify(thisTimeslotObj));

    if (Object.keys(thisTimeslotObj).length > 1) {
        $entry.addClass('conflicted');
    }
    else {
        $entry.removeClass('conflicted');
    }
}

Schedule.prototype.handleCourse = function handleCourse(days, times, crn, permanent, adding) {
    var _this = this;

    for (day in days) {
        if (!days[day]) continue;
    
        var $day = $('#' + day);

        $day.find('.sched-row').each(function eachTime(index, entry) {
            $entry = $(entry);
            var timeslot = parseInt($entry.data('timeslot'));
            if (timeslot >= times.start && timeslot <= times.end) {
                _this.handleLogic(day, timeslot, $entry, crn, permanent, adding);
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
    };
}

Schedule.prototype.decodeTime = function decodeTime(strTime) {
    // parse out the time, and mod by 1200 to remove issue with 12:30 PM becoming 2430. Add 1200 if PM.
    return ( parseInt(strTime.replace(/:| /g, '')) % 1200 ) + ( strTime.slice(-2) == "PM" ? 1200 : 0 );
}

// ============================= Global Stuff ==================================

var wavePage = wavePage || {};

wavePage.addOrRemoveCourse = function(crn) {
    var alreadyPresent = wavePage.cart[wavePage.currentSemester].has(crn);

    wavePage.setCourseStatus(crn, !alreadyPresent)
}

wavePage.setCourseStatus = function(crn, status) {
    wavePage.setStatusInCart(crn, status);
    wavePage.setCourseDivStatus(crn, status);
    wavePage.setScheduleStatus(crn, status);

}

wavePage.setStatusInCart = function(crn, adding) {
    var cartIdPrefix = 'cart-';

    if (adding) {
        $('#cart').append($('<div/>', { id: cartIdPrefix + crn, html: crn }));
        wavePage.cart[wavePage.currentSemester].add(crn);
    }
    else {
        wavePage.cart[wavePage.currentSemester].delete(crn);
        $('#cart').find('#' + cartIdPrefix + crn).remove();
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
    // TODO: The logic of highlighting the schedule
}

// ============================= OnLoad ========================================

setUpWavePage();
