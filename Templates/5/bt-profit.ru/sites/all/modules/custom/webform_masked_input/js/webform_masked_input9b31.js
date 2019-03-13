(function ($) {
    Drupal.behaviors.webform_masked_input = {
        attach: function (context, settings) {
            $('input[data-maskedinput]', context).each(function () {
                var $input = $(this);
                var mask = $input.data('maskedinput');
                $input.inputmask({
                    mask: mask,
                    clearIncomplete: true
                });
            });
        }
    };
})(jQuery);
