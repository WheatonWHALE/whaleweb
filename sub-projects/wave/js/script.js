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

function post(url, data) {
    return Promise.resolve(
        $.ajax({
            type: 'POST',
            url: url,
            data: data
        })
    );
}

// ============================= Wave ==========================================

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
    return (parseInt(strTime.replace(/:| /g, '')) % 1200) + (strTime.slice(-2) == "PM" ? 1200 : 0);
}

var currPreview;
function setUpWaveCourseCallbacks() {
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
function getAndSetupWaveData() {
    var semester = $('input#semester').val();

    // If first time, grab placeholder "while loading" contents
    loadingContents = loadingContents || $('.dataContainer').html();
    // Set up loading contents
    $('.dataContainer').html(loadingContents);

    return get('/wave/data?semester=' + semester, updateProgress).then(function appendToPage(html) {
        $('.dataContainer #loading-placeholder').remove();
        $('.dataContainer').html(html);
        $('.dataContainer a').attr('target', '_blank');
    }).then(setUpWaveCourseCallbacks)
    .then(function triggerFilters() {
        // console.log('Triggering filters');
        $('select[name=department]').change();
        $('select[name=foundation], select[name=division], select[name=area]').change();
    }).catch(function handleError(err) {
        console.error(err);
    });
}

function setUpWavePage() {
    getAndSetupWaveData().then(function() {
        wavePage.schedule = new Schedule($('#schedule'), scheduleData);
    });

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

    $('select[name=semester]').val($('input#semester').val());

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

window.onbeforeunload = function saveData(e) {
    post('save', { schedule: JSON.stringify(wavePage.schedule.sched), sessionId: sessionId });

    return null; // We want no confirmation popup dialog
}

// ============================= OnLoad ========================================


setUpWavePage();
