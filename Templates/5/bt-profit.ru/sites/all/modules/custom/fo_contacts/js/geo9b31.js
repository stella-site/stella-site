jQuery(function($) {    
  $(document).ready(function () {
    var officeId = $.cookie('office_id');
    
    if (!officeId) {
      $.getJSON(Drupal.settings.basePath + Drupal.settings.pathPrefix + 'fo_geo/geotargeting', function(data) {
        if (data.office_id) {
          var officeId = data.office_id;
          $.cookie('office_id', officeId, { expires: 2, 'path': '/'});
          $(document).trigger('fo_geo', [officeId]);
          fo_geo_current_office_id = officeId;
        }
      });
    } else {
      $(document).trigger('fo_geo', [officeId]);
      fo_geo_current_office_id = officeId;
    }
  });
});
