(function ($) {
  
  if (!$.cookie('ga_uid')) {
    $(document).ready(function () {
      var interval_id = setInterval(function() {
        if (typeof ga === 'function') {
          clearInterval(interval_id);
          ga(function () {
            var trackers = ga.getAll();
            
            if (trackers.length) {
              var clientId = ga.getAll()[0].get('clientId');
              $.get('/geo/get_uid', {'client_id': clientId}, function () {
                setDataLayer();
              }, 'json'); 
            }
          });
        }
      }, 1000);
    });  
  }
  
  function setDataLayer () {
    if (typeof dataLayer !== 'object' || typeof dataLayer[0] !== 'object') { 
      dataLayer = [{}];
    }

    var data = dataLayer[0];
  
    var userLang = navigator.language || navigator.userLanguage; 
    data.Lang = userLang;
    
    if ($.cookie('ga_uid')) {
      data.uid = $.cookie('ga_uid')
    }

    if ($.cookie('ga_country')) {
      data.Country = $.cookie('ga_country')
    }

    if ($.cookie('ga_city')) {
      data.City = $.cookie('ga_city')
    }      
    
    if ($.cookie('ga_oid')) {
      data.Officeid = $.cookie('ga_oid')
    }
    
  }
  
  setDataLayer(); 
  
})(jQuery)