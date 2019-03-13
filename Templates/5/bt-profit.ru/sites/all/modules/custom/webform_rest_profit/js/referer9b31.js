(function ($) {
    $(document).ready(function() {
        // сохраняем таймзону
        var now = new Date();
        var timezone = (now.getTimezoneOffset() / 60) * -1;
        $.cookie('user_timezone', timezone, {'path': '/'});



        // Это для совместимости со старой версией: то, что лежало в form_firstpage теперь должно лежать в form_firstpage_first
        if (!$.cookie('form_firstpage_first') && $.cookie('form_firstpage')) {
            setCookies($.cookie('form_referrer'), $.cookie('form_firstpage'));
        }


        // а тут уже непосредственно ставим нужные куки, связанные в URL-ами
        var currUrl = decodeURIComponent(document.location.href);
        var currDomain = getDomainFromUrl(currUrl);

        var refererUrl = decodeURIComponent(document.referrer);
        var refererDomain = getDomainFromUrl(refererUrl);

        var utmSource = getUrlParam(window.location.href, 'utm_source');

        if (refererDomain && (refererDomain != currDomain)) {
            setCookies(refererUrl, currUrl);
        } else if (utmSource) {
            setCookies(utmSource, currUrl);
        } else if (!$.cookie('form_firstpage')) {
            setCookies(null, currUrl);
        } else {
            setCookies($.cookie('form_referrer'), $.cookie('form_firstpage'));
        }
		
		if (getUrlParam(window.location.href, 'click_group_id') && !$.cookie('click_group_id') && getUrlParam(window.location.href, 'click_group_id') * 1) {
			setCookie('click_group_id', getUrlParam(window.location.href, 'click_group_id'), {'path': '/', expires: 180});
		}		
    });


    function getDomainFromUrl(url) {
        if (typeof url != 'string') {
            return null;
        }

        return url.toLowerCase().replace(/^(?:https?:\/\/)?(?:www\.)?([-_a-z0-9\.]+)(?:\/.*)?$/, "$1");
    }

    function getUrlWithoputProtocol(url) {
        if (typeof url != 'string') {
            return null;
        }

        return url.replace(/^(?:https?:\/\/)?(?:www\.)?(.+)$/i, "$1");
    }

    function getUrlParam(url, paramName) {
        if (typeof url != 'string') {
            return null;
        }
        var found = url.match(new RegExp('[\?&]' + encodeURIComponent(paramName) + '=([^&#]*)'));
        return found ? decodeURIComponent(found[1]) : null;
    }

    function setCookies(refererValue, firstpageValue) {
        if (!$.cookie('form_firstpage_first')) {
            setCookie('form_referrer_first', getUrlWithoputProtocol(refererValue), {expires: 3650});
            setCookie('form_firstpage_first', getUrlWithoputProtocol(firstpageValue), {expires: 3650});
        } else {
            setCookie('form_referrer_first', $.cookie('form_referrer_first'), {expires: 3650});
            setCookie('form_firstpage_first', $.cookie('form_firstpage_first'), {expires: 3650});
        }

        setCookie('form_referrer', getUrlWithoputProtocol(refererValue));
        setCookie('form_firstpage', getUrlWithoputProtocol(firstpageValue));
    }

    function setCookie(name, value, options) {
        options = $.extend({path: '/'}, options);
        if (!value || (value == 'null')) {  // ради этого и отдельная функция
            options.expires = -1;
        }
        return $.cookie(name, value, options);
    }
})(jQuery);