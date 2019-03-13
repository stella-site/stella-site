(function ($) {
    
    $(document).on('fo_geo', function (event, office_id) {
      set_current_office(office_id);
    });
    
    function set_current_office (office_id) {
        $('.webform-client-form select.webform_citylist_autoselect').each(function () {
          var $select = $(this);
          if ($select.find('option[value="' + office_id + '"]').length) {
              $select.val(office_id);
              $select.trigger("chosen:updated");
              $select.trigger("liszt:updated");
          }
        });
    }
    
})(jQuery);
