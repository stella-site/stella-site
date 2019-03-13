(function ($, Drupal, window, document, undefined) {
    jQuery(function () {
        // Проставляем реферрер, если это чужой сайт
        // Условие со страницы http://wiki.dev/%D0%A4%D0%BE%D1%80%D0%BC%D1%8B_%D0%B2_CRM
        var RegExp = /(http:\/\/)?(?:www\.|[\w\-а-я]+\.|)*([\w\-а-я]+\.[\wа-я]{2,4})/; 
        if (!!document.referrer && document.referrer.match(RegExp)[2] != document.location.hostname.match(RegExp)[2]) {
            jQuery.cookie('url_referer', document.referrer, 365);
        }

        if (!jQuery.cookie('url_local')) {
            jQuery.cookie('url_local', location.href, -1);
        }
    })
})(jQuery, Drupal, this, this.document);