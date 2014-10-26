/*
 * Special functions for building scenes and managing audio tracks
 * Written by John Resig (jeresig@gmail.com) and
 * Nell Shaw Cohen (nell@nellshawcohen.com)
 * for use in "Explore John Muir's Yosemite"
 * http://beyondthenotes.org/yosemite
 */

var Slides = {
    slides: [null],
    activeSlideNum: 0,
    activeSlide: null,
    volume: 1,
    tracks: {},

    init: function(options) {
        var self = this;

        this.tracks = {};
        this.audioFiles = options.tracks;
        this.startOnLoad = options.startOnLoad;

        this.bindEventListeners();

        if (options.slides) {
            $.each(options.slides, function(i, slide) {
                self.add(slide);
            });
        }

        // Stub in the title slide, uses the audio of the first slide
        this.slides[0] = {
            $el: $("#titleBG"),
            audio: this.slides.length > 1 ?
                this.slides[1].audio :
                []
        };

        var onPreload = function() {
            self.onPreload();
        };

        this.loadAllAudio(onPreload);
        this.loadSlideMedia(0, onPreload);

        if (this.slides.length > 1) {
            this.loadSlideMedia(1, onPreload);
        }
    },

    bindEventListeners: function() {
        var self = this;

        $(document).on("click", "#next", function() {
            self.next();
            return false;
        });

        $(document).on("click", "#previous", function() {
            self.previous();
            return false;
        });

        $(document).on("click", "#buttonsNav .button", function() {
            var slideNum = parseFloat(/\d+$/.exec(this.id)[0]);
            self.loadSlideMedia(slideNum, function() {
                self.jump(slideNum);
            });
            return false;
        });

        $(document).on("mouseenter", ".mapIcon", function() {
            var id = this.id.replace(/map_/, "");
            self.tracks[id].fade(0, 1, 1000);
        });

        $(document).on("mouseleave", ".mapIcon", function() {
            var id = this.id.replace(/map_/, "");
            self.tracks[id].fade(1, 0, 750);
        });

        $(document).on("click", "a[target=_blank]", function(e) {
            // Work as normal if we're not an app
            if (!window.isApp) {
                return;
            }

            // Ignore navigating to the link as normal
            e.preventDefault();

            // Instead, open the link in the native system browser
            window.open(this.href, "_system");
        });
    },

    add: function(options) {
        var slideNum = this.slides.length;
        var $el = $("#slide" + slideNum);
        var icon = $el.find(".columns").length > 0 ?
            "fa-info-circle" : "fa-circle";

        var $jump = $('<span id="jumpSlide' + slideNum +
            '" class="button"><a href="#"><i class="fa ' + icon + '">' +
            '</i></a></span>').appendTo("#buttonsNav");

        options = $.extend({
            $el: $el,
            $jump: $jump
        }, options);

        this.slides.push(options);
    },

    loaded: 0,
    total: 0,
    trackLoaded: {},

    trackLoading: function(id) {
        if (!(id in this.trackLoaded)) {
            this.total += 1;
            this.trackLoaded[id] = false;
        }
    },

    handleLoaded: function(id, callback) {
        if (!(id in this.trackLoaded) || this.trackLoaded[id]) {
            return;
        }

        this.trackLoaded[id] = true;
        this.loaded += 1;

        //console.log("Loaded:", id, this.loaded, this.total, this.trackLoaded)

        if (this.loaded >= this.total) {
            this.total = 0;
            this.loaded = 0;
            this.trackLoaded = {};

            $("#loadingText").text("");
            if (callback) {
                callback();
            }
        } else {
            var loading = Math.round((this.loaded / this.total) * 100);
            $("#loadingText").text(loading + "% loaded...");
        }
    },

    loadAllAudio: function(callback) {
        var self = this;

        $.each(Object.keys(this.audioFiles), function(i, name) {
            var filePath = self.audioFiles[name];
            self.tracks[name] = new Howl({
                urls: [
                    "www/media/" + filePath + ".mp3",
                    "alt_media/" + filePath + ".ogg"
                ],
                autoplay: false,
                loop: true,
                volume: 0,
                onload: function() {
                    self.handleLoaded(name, callback);
                }
            });
            self.trackLoading(name);
        });
    },

    loadSlideMedia: function(slideNum, callback) {
        var self = this;
        var slide = this.slides[slideNum];

        slide.$el.find("div.img:not(.loaded)").each(function() {
            var elem = this;
            var src = $(this).attr("data-src");
            $("<img>")
                .attr("src", src)
                .on("load", function() {
                    $(elem).addClass("loaded");
                    self.handleLoaded(src, callback);
                })
                .appendTo(this);
            self.trackLoading(src);
        });

        slide.$el.find("div.video:not(.loaded)").each(function() {
            var elem = this;
            var src = $(this).attr("data-src");
            $("<video>")
                .prop({
                    loop: true,
                    autoplay: true
                })
                .on("load canplay", function() {
                    $(elem).addClass("loaded");
                    self.handleLoaded(src, callback);
                })
                .append($("<source>")
                    .attr("src", "www/media/" + src + ".mp4"))
                .append($("<source>")
                    .attr("src", "alt_media/" + src + ".ogg"))
                .appendTo(this);
            self.trackLoading(src);
        });

        if (this.total === 0) {
            callback();
        }
    },

    unloadSlideMedia: function(slide) {
        slide.$el
            .find("div.img.loaded")
                .removeClass("loaded")
                .find("img").remove().end()
            .end()
            .find("div.video.loaded")
                .removeClass("loaded")
                .find("video").remove().end()
            .end();
    },

    next: function() {
        if (this.activeSlideNum + 1 < this.slides.length) {
            var self = this;
            var slideNum = this.activeSlideNum + 1;
            this.loadSlideMedia(slideNum, function() {
                self.jump(slideNum);
            });
        }
    },

    previous: function() {
        if (this.activeSlideNum > 1) {
            var self = this;
            var slideNum = this.activeSlideNum - 1;
            this.loadSlideMedia(slideNum, function() {
                self.jump(slideNum);
            });
        }
    },

    jump: function(slideNum) {
        var self = this;
        var totalSlides = this.slides.length;
        var prevSlide = this.activeSlide;

        this.activeSlideNum = slideNum;
        var slide = this.activeSlide = this.slides[slideNum];

        if (prevSlide) {
            this.onSlideExit(prevSlide);
        } else {
            this.onTitleExit();
        }

        // Bring the current slide into view
        slide.$el.addClass("activeSlide");

        // if a custom function for onStart is defined, then call it
        if (slide.onStart) {
            slide.onStart();
        }

        if (slide.audio) {
            this.playTracks(slide.audio);
        }

        var $columns = slide.$el.find(".columns");

        if ($columns.length > 0) {
            $columns.removeClass("hidden");
        }

        setTimeout(function() {
            // fade in the divs with class of .fullscreen inside this slide
            slide.$el.find(".fullscreen, .caption").removeClass("fadeOut");
        }, 0);

        // highlight the circular button for the active slide
        slide.$jump.addClass("buttonCurrent");

        // if this slide is 2 or higher, show the previous button
        if (this.activeSlideNum > 1) {
            $("#previous").removeClass("fadeOut");
        }

        // if this slide is before the last slide (less than the total number
        // of slides), then show the next button
        if (this.activeSlideNum + 1 < totalSlides) {
            $("#next").removeClass("fadeOut");
        }

        // if this slide is the last (info) slide, hide the previous and next
        // buttons
        if (this.activeSlideNum + 1 === totalSlides) {
            $("#next, #previous").addClass("fadeOut");
        }

        setTimeout(function() {
            // Don't fade in if we're no longer on the slide
            if (self.activeSlideNum !== slideNum) {
                return;
            }

            // fade in the divs with class of .boxWrap inside this slide
            slide.$el.find(".boxWrap, .endNav, .columnLeft, .caption, " +
                    ".columnRight, .infoText, .infoPics, .fullscreen")
                .removeClass("fadeOut");
        }, 3000);
    },

    onPreload: function() {
        var self = this;

        this.playTracks(this.slides[0].audio);

        // Hide the loading indicator
        $("#loading").addClass("fadeOut");

        setTimeout(function() {
            $("#loading").hide();
        }, 2000);

        // Show the next/begin link
        $("#next").removeClass("fadeOut");

        // start playing all audio and video
        $("video").prop("volume", 0).trigger("play");

        for (var name in this.tracks) {
            this.tracks[name].play();
        }

        if (this.startOnLoad) {
            $("#next").click();
        }

        if (window.isApp) {
            var iconPos = 0;
            var prevIcon;
            var icons = $(".mapIcon");
            var toggleMapIcon = function() {
                curIcon = icons[iconPos];

                if (prevIcon) {
                    $(prevIcon).removeClass("hover");
                    var id = prevIcon.id.replace(/map_/, "");
                    self.tracks[id].fade(1, 0, 750);
                }

                $(curIcon).addClass("hover");
                var id = curIcon.id.replace(/map_/, "");
                self.tracks[id].fade(0, 1, 1000);

                prevIcon = curIcon;
                iconPos += 1;
                if (iconPos >= icons.length) {
                    iconPos = 0;
                }
            };

            if (icons.length > 0) {
                setTimeout(function() {
                    toggleMapIcon();
                    setInterval(toggleMapIcon, 5000);
                }, 1000);
            }
        }
    },

    onSlideExit: function(prevSlide) {
        var self = this;

        // Fade out the contents of the slide
        prevSlide.$el.find(".boxWrap, .endNav, .columnLeft, .caption, " +
                ".columnRight, .infoText, .infoPics, .fullscreen")
            .addClass("fadeOut");

        // if a custom function for onEnd is defined, then call it
        if (prevSlide.onEnd) {
            prevSlide.onEnd();
        }

        // Remove highlight on the jump button
        prevSlide.$jump.removeClass("buttonCurrent");

        // Fade out the navigation buttons
        $("#next, #previous").addClass("fadeOut");

        // Hide the other active slide (the slide we're transitioning out
        // of) "Hide" means to put it off the side of the page.
        setTimeout(function() {
            // Don't become not-active if we've been navigated back to
            if (self.activeSlide === prevSlide) {
                return;
            }

            prevSlide.$el.find(".columns").addClass("hidden");
            prevSlide.$el.removeClass("activeSlide");
            self.unloadSlideMedia(prevSlide);
        }, 2000);
    },

    onTitleExit: function() {
        var self = this;

        // get rid of title page stuff
        $("#next").removeClass("beginPosition fadeOut").addClass("nextPosition");
        $("#titleBG").removeClass("transparent");
        var $hiding = $("#begin, #titleText, #titleCard, #titleCaption, #titleBG");
        $hiding.addClass("fadeOut");
        setTimeout(function() {
            $hiding.hide();
            self.unloadSlideMedia(self.slides[0]);
        }, 2000);
        $("#buttonsNav").removeClass("fadeOut");
    },

    playTracks: function(toPlay) {
        var self = this;
        var volumes = {};

        if (!("length" in toPlay)) {
            volumes = toPlay;
            toPlay = Object.keys(toPlay);
        }

        $.each(Object.keys(this.tracks), function(i, id) {
            var sound = self.tracks[id];
            var start = sound.volume();
            var end = 1;

            if (toPlay.indexOf(id) < 0) {
                end = 0;
            } else if (id in volumes) {
                end = volumes[id] * self.volume;
            }

            if (start !== end) {
                sound.fade(start, end, 1000);
            }
        });
    }
};


// Google analytics
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-55986641-1', 'auto');
  ga('send', 'pageview');


// Add app class if we're in a Cordova app
window.isApp = !!window.cordova;
if (window.isApp) {
    document.documentElement.className += " app";

// Redirect to the mobile page if the user is attempting to access
// on a mobile device
} else if (/android|ios|ipad|iphone|ipod/i.test(navigator.userAgent)) {
    window.location = "mobile.html";
}