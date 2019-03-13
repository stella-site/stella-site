/* jshint browser:true */

(function(root) {
    // trim function shim for ie8
    if (typeof String.prototype.trim !== 'function') {
        String.prototype.trim = function() {
            return this.replace(/^\s+|\s+$/g, '');
        };
    }

    var topFrame = window.self === window.top;

    // content="IE=8" fix
    var getStyle = window.getComputedStyle;

    if (!getStyle) {
        getStyle = function getStyle(el) {
            return el.currentStyle;
        };
    }

    // do not load the same code twice, just use the previous
    // in case multiple scripts are included
    if (root.InfogramEmbed) {
        root.InfogramEmbed.load();
        return;
    }

    var InfogramEmbed = function() {
        this._cache = {};
        this._origin = null;
        this._cacheIframe = {};
        this._visibilitySent = {};
        this._eventsAdded = false;
    };

    InfogramEmbed.prototype = {
        // Looks up for script tags and loads infographics
        // that are not already loaded
        load: function() {
            var scripts = document.getElementsByTagName('script');

            var scriptsCount = scripts.length;
            var i = 0;

            var presentScripts = {};
            for (i; i < scriptsCount; i++) {
                var script = scripts[i];
                var scriptId = script.getAttribute('id');

                if (!this.isValidId(scriptId) || this.isHidden(script.parentNode)) {
                    continue;
                }

                var opts = this.parseId(scriptId);
                opts.title = script.getAttribute('title');

                presentScripts[opts.id] = script;
                if (!this._cache[opts.id]) {
                    this._cache[opts.id] = script;
                    this.loadInfographic(script, opts);
                }
            }

            Object.keys(this._cache).forEach(function(key) {
                if (!presentScripts[key]) {
                    this.cleanCaches(key);
                }
            }.bind(this));

            if (this._eventsAdded) {
                return;
            }

            this._eventsAdded = true;

            var docEvents = {}; // event variable for document

            docEvents.scroll = this.handleViewUpdate.bind(this);
            docEvents.resize = this.handleViewUpdate.bind(this);

            docEvents.message = function(e) {
                if ('data' in e && typeof e.data === 'string') {
                    var msgObj = e.data.split(':');

                    var key = msgObj.shift();
                    var val = e.data.substr(key.length + 1).trim();

                    if (/^iframeLoaded/.test(key)) {
                        this.processIframeLoaded(e, key, val);
                        return;
                    }

                    if (/^iframeHeight/.test(key)) {
                        this.processIframeHeight(e, key, val);
                    }
                }
            }.bind(this);

            this.addEvt(root, docEvents); // Add message event listener
        },

        handleViewUpdate: function() {

            this.vWidth = window.innerWidth || document.documentElement.clientWidth;
            this.vHeight = window.innerHeight || document.documentElement.clientHeight;

            if (!this._origin) {
                return;
            }

            // performance, so we don't stress out scrolling experience
            if (!this.scrollBuffer) {
                this.scrollBuffer = requestAnimationFrame(function () {
                    this.reportElementVisibility();
                    this.scrollBuffer = null;
                }.bind(this));
            }
        },

        getViewportInfo: function(bounds) {
            return {
                root: topFrame ? {
                    left: 0,
                    top: 0,
                    bottom: this.vHeight,
                    right: this.vWidth,
                    width: this.vWidth,
                    height: this.vHeight,
                } : {
                    left: -Number.MAX_VALUE/2,
                    top: -Number.MAX_VALUE/2,
                    bottom: Number.MAX_VALUE/2,
                    right: Number.MAX_VALUE/2,
                    width: Number.MAX_VALUE,
                    height: Number.MAX_VALUE,
                },
                rect: {
                    left: bounds.left,
                    top: bounds.top,
                    bottom: bounds.bottom,
                    right: bounds.right,
                    width: bounds.width,
                    height: bounds.height,
                },
            };
        },

        cleanCaches: function(id) {
            delete this._cacheIframe[id];
            delete this._visibilitySent[id];
            delete this._cache[id];
        },

        reportElementVisibility: function() {
            for (var infographicId in this._cacheIframe) {

                var iframe = this._cacheIframe[infographicId];

                var bounds = iframe && iframe.getBoundingClientRect();

                if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage('iframePositionChange:' + JSON.stringify(this.getViewportInfo(bounds)), this._origin);
                } else {
                    this.cleanCaches(infographicId);
                    continue;
                }

                if (this._visibilitySent[infographicId]) {
                    continue;
                }

                var visible = bounds && this.isElementVisible(bounds);

                if (visible) {
                    this._visibilitySent[infographicId] = true;
                }
            }
        },

        isElementVisible: function(rect) {

            // Return false if it's not in the viewport
            if (rect.right < 0 || rect.bottom < 0 || rect.left > this.vWidth || rect.top > this.vHeight) {
                return false;
            }

            // Return false if object is not in the dom or has 0 size and position for other reasons, with such size it is not seen
            if (rect.width === 0 && rect.height === 0 && rect.left === 0 && rect.top === 0) {
                return false;
            }

            var width = Math.min(this.vWidth - rect.left, rect.width);
            var height = Math.min(this.vHeight - rect.top, rect.height);

            var left = Math.min(rect.left, -0) * (-1);
            var top = Math.min(rect.top, -0) * (-1);

            return {top: top, left: left, width: width, height: height};
        },

        processIframeLoaded: function(e, key) {
            key = key.replace('iframeLoaded', '');

            var ids = key.split('#');

            var scriptId = this.getCacheScriptId(ids);
            var script = this._cache[scriptId];

            if (!script) {
                return;
            }

            var location = this.getLocation(script.getAttribute('src'));

            var protocol = location.protocol || window.location.protocol || 'https:';

            if (location.protocol === ':') {
                protocol = document.location.protocol;
            }

            // Get origin location
            var originLocation = this.getLocation(e.origin);

            // Check if message has the hostname of iframe
            if (location.hostname !== originLocation.hostname) {
                return;
            }

            // Upgrade origin from http => https as we got url with http, but due to HSTS it was internally
            // redirected to https
            if (location.protocol !== originLocation.protocol && location.protocol.indexOf('https') === -1) {
                protocol = originLocation.protocol;
            }

            var infogramUrl = protocol + '//' + location.host;

            // Store origin for later use when sending to iframeResizeContents
            this._origin = infogramUrl;

            var iframe = this._cacheIframe[scriptId];

            this.iframeResizeContents(iframe, infogramUrl, parseInt(getStyle(iframe).getPropertyValue('width'), 10));

            this.handleViewUpdate();
        },

        processIframeHeight: function(e, key, val) {
            key = key.replace('iframeHeight', '');

            var ids = key.split('#');

            var scriptId = this.getCacheScriptId(ids);
            var script = this._cache[scriptId];

            if (!script) {
                return;
            }

            var iframe = this._cacheIframe[scriptId];

            // Set the iframe size
            var newHeight = val + 'px';
            if (iframe.style.height !== newHeight) {
                iframe.style.height = newHeight;
            }
        },

        getCacheScriptId: function(ids) {
            if (!ids.length) {
                return;
            }

            for (var i = 0, l = ids.length; i < l; i++) {
                var id = ids[i];
                if (this._cache[id]) {
                    return id;
                }
            }
        },

        // Load infographic with its options
        loadInfographic: function(elem, opts) {
            var location = this.getLocation(elem.getAttribute('src'));
            var loaded = false;
            var protocol = location.protocol;
            var regPercent = new RegExp(/^[0-9]+%$/i);
            if (location.protocol === ':') {
                protocol = document.location.protocol;
            }
            var type = '';

            if (opts.type === 'image') {
                type = '&type=image';
            }

            var url = protocol + '//' + location.host + '/' + opts.id + '?src=embed' + type + '#async_embed';
            var iframe = this._cacheIframe[opts.id] = this.createIframe(opts.width);

            var oldWidth = iframe.style.width;

            var events = {}; // event variable for iframe

            events.load = function() {
                // Remove event from iframe
                this.removeEvt(iframe, events);

                // IE8 load event bug
                if (loaded) {
                    return;
                }

                // In case of 100% width get parent width
                if (regPercent.test(oldWidth)) {
                    var percent = parseInt(oldWidth, 10) * 0.01;
                    var parent = iframe.parentNode;
                    var parentStyle = getStyle(parent);

                    var offset = this.getHorizBorders(parentStyle) + this.getHorizPaddings(parentStyle);
                    var newWidth = parseInt(parent.offsetWidth * percent, 10) - offset;

                    iframe.style.width = newWidth + 'px';

                    // If size to 100% check for window resize
                    var oldParentWidth = parent.offsetWidth;

                    // If iframe parent width is changed, change also iframe width + ask to resize all contents
                    var interval = setInterval(function() {
                        if (iframe && iframe.contentWindow) {
                            if (oldParentWidth !== parent.offsetWidth) {
                                oldParentWidth = parent.offsetWidth;

                                var offset = this.getHorizBorders(parentStyle) + this.getHorizPaddings(parentStyle);
                                var newWidth = parseInt(parent.offsetWidth * percent, 10) - offset;

                                iframe.style.width = newWidth + 'px';

                                var origin = this._origin || protocol + '//' + location.hostname;

                                this.iframeResizeContents(iframe, origin, newWidth);
                            } else if (oldParentWidth === 0 && parentStyle.display === 'inline') { // fix for inline elements having 0 width choose it's parent element's width
                                parent = parent.parentNode;
                                parentStyle = getStyle(parent);
                            }
                        } else {
                            clearInterval(interval);
                            this.cleanCaches(opts.id);
                        }
                    }.bind(this), 200);
                }

                // Safari and Opera need a kick-start.
                iframe.src = '';
                iframe.src = url;

                iframe.title = '';
                iframe.title = opts.title;

                // IE load event bug fix
                loaded = true;
            }.bind(this);

            this.addEvt(iframe, events); // Add iframe load event
            this.addAfter(elem, iframe); // Place iframe after script
        },

        // Resize iframe contents providing host
        iframeResizeContents: function(iframe, host, width) {
            width = typeof width === 'undefined' ? '' : ':' + width;

            iframe.contentWindow.postMessage(('iframeWidth' + width), host);
        },

        // Create an iframe
        createIframe: function(width) {
            width = parseInt(width, 10);

            // if width is 0 then assign 100%
            width = width ? width + 'px' : '100%';

            var iframe = document.createElement('IFRAME');
            iframe.style.border = 'none';
            iframe.setAttribute('scrolling', 'no');
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allowfullscreen', '');

            iframe.style.width = width;
            iframe.style.height = '130px';

            return iframe;
        },

        // Return A element from which we can get host parameters
        getLocation: function(href) {
            var l = document.createElement('A');
            l.href = href;
            return l;
        },

        getHorizBorders: function(elStyle) {
            var leftBorder = parseInt(elStyle.getPropertyValue('border-left-width') || 0, 10);
            var rightBorder = parseInt(elStyle.getPropertyValue('border-right-width') || 0, 10);

            return leftBorder + rightBorder;
        },

        getHorizPaddings: function(elStyle) {
            var leftPadding = parseInt(elStyle.getPropertyValue('padding-left') || 0, 10);
            var rightPadding = parseInt(elStyle.getPropertyValue('padding-right') || 0, 10);

            return leftPadding + rightPadding;
        },

        // Add event helper function
        addEvt: function(el, events) {
            for (var type in events) {
                if (events.hasOwnProperty(type)) {
                    var func = events[type];
                    if (el.addEventListener) {
                        el.addEventListener(type, func, false);
                    } else if (el.attachEvent) {
                        // Pass global element as parameter
                        el.attachEvent('on' + type, this.bind(el, func, root.event));
                    } else {
                        el['on' + type] = func;
                    }
                }
            }
        },

        // Remove event helper function
        removeEvt: function(el, events) {
            for (var type in events) {
                if (events.hasOwnProperty(type)) {
                    var func = events[type];
                    if (el.removeEventListener) {
                        el.removeEventListener(type, func, false);
                    } else if (el.detachEvent) {
                        el.detachEvent('on' + type, func);
                    } else {
                        el['on' + type] = false;
                    }
                }
            }
        },

        // Bind helper function
        bind: function(obj, fn) {
            return function() {
                return fn.apply(obj, arguments);
            };
        },

        // Adds an elem after afterElem in dom tree
        addAfter: function(afterElem, elem) {
            afterElem.parentNode.insertBefore(elem, afterElem.nextSibling);
        },

        // Check if id is valid
        isValidId: function(id) {
            return (/^infogram(?:img)?_[0-9]+_[\w\-]{16,}$/i.test(id)) || (/^infogram(?:img)?_[0-9]+__\/[\w\-]{20,}$/i.test(id));
        },

        isHidden: function(el) {
            return getStyle(el).display === 'none';
        },

        // Turn script id into object of infographic id and width
        parseId: function(id) {
            var parts = id.split('_');
            var main = parts.shift(); // remove the infogram string
            var type = 'interactive';
            if (main === 'infogramimg') {
                type = 'image';
            }

            var w = parts.shift(); // get the width
            return {
                width: w,
                id: parts.join('_'),
                type: type,
            };
        },
    };

    root.InfogramEmbed = new InfogramEmbed();
    root.InfogramEmbed.load();

    window.addEventListener('popstate', function() {
        root.InfogramEmbed.load();
    });
    var ps = window.history.pushState;
    window.history.pushState = function() {
        ps.apply(window.history, arguments);
        requestAnimationFrame(function() {
            root.InfogramEmbed.load();
        });
    };

})(window);
