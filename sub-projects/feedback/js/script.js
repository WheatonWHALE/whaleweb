// ============================= General =======================================

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

setUpFeedbackPage();
