Number.prototype.mod = function(n) { return ((this%n)+n)%n; }

var baseAsciiShift = 'A'.charCodeAt(0);

function findDifference(a, b) {
    return a.charCodeAt(0) - b.charCodeAt(0);
}

function shiftLetter(letter, shift) {
    return String.fromCharCode(
        (((letter.charCodeAt(0) - shift) - baseAsciiShift).mod(26)) + baseAsciiShift
    );
}

function decryptWithShifts(cipher, shifts, offset) {
    var numShifts = shifts.length;

    var plain = '';
    var i = (-offset).mod(numShifts);

    for (var j = 0; j < cipher.length; ++j) {
        var letter = cipher[j];

        if (letter === ' ' || letter === '\n') {
            plain += letter;
        }
        else {
            plain += shiftLetter(letter, shifts[i]);

            i = (i + 1).mod(numShifts);
        }
    }

    return plain;
}

function doAllSolving() {
    var $output = $('#output #text');
    $output.html('');

    var cipher = $('#cipher').val().toUpperCase().replace(/\s/g, '');
    var guessedWord = $('#guess').val().toUpperCase();

    if (!cipher || !guessedWord) {
        alert('Missing the cipher text or the guess word');
    }

    // console.log('Decoding:', cipher, 'with', guessedWord);

    for (var i = 0; i < cipher.length; ++i) {
        if (i + guessedWord.length > cipher.length)
            break;

        var temp = i;
        var shifts = [];

        for (var j = 0; j < guessedWord.length; ++j, ++temp) {
            var diff = findDifference(cipher[temp], guessedWord[j]);
            shifts.push(diff);
        }

        var key = shifts.map(function(shift) {
            return String.fromCharCode(shift.mod(26) + baseAsciiShift);
        }).join('');

        // console.log(key, '-', decryptWithShifts(cipher, shifts, i));
        $output.append(key + ' - ' + decryptWithShifts(cipher, shifts, i) + '<br>');

    }
}

$(function() {
    $('#solve').click(function(evt) {
        evt.preventDefault();
        var $this = $(this);

        setTimeout(function() {
            $this.blur(); // Unfocus, to make it feel like something happened
        }, 200);

        doAllSolving();
    });
});