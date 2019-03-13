(function ($) {
    $(document).ready(function () {
        
        var interval_id = setInterval(function() {
            if (typeof ga === 'function') {
                clearInterval(interval_id);
                ga(function () {
                    var trackers = ga.getAll();
                    if (trackers.length) {
                        var clientId = ga.getAll()[0].get('clientId');
                        $.cookie('webform_rest_profit_ga_client_id', clientId, {expires: 7, path: '/'});
                    }
                });
            }
        }, 1000);
        
    });
})(jQuery);