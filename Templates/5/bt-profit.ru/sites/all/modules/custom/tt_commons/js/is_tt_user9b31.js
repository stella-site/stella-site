(function() {
    // checks if user entered phone in webforn or if there is GET param is_tt_user
    if (jQuery.cookie('user_phone') || window.location.search.match(/^\?(?:.*&)?is_tt_user(?:[&=].*)?$/)) {
        jQuery.cookie('is_tt_user', '1', { expires: 365, path: '/' });
    }
})();