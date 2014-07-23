/*
Special functions for building popcorn.js scenes and managing audio tracks
Written by John Resig (jeresig@gmail.com) and Nell Shaw Cohen (nell@nellshawcohen.com)
for use in "Explore John Muir's Yosemite" (http://beyondthenotes.org/yosemite)
*/

var Slides = {
    slides: [null],
    activeSlideNum: 0,
    activeSlide: null,
    volume: 1,
    tracks: {},

    init: function(options) {
        var self = this;

        this.tracks = options.tracks;
        this.initialAudio = options.initialAudio;
        this.startOnLoad = options.startOnLoad;

        this.bindEventListeners();

        this.loadAudio(this.tracks, function() {
            self.onPreload();
        });

        if (options.slides) {
            $.each(options.slides, function(i, slide) {
                self.add(slide);
            });
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
            self.jump(slideNum);
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
    },

    add: function(options) {
        var slideNum = this.slides.length;
        var $el = $("#slide" + slideNum);
        var icon = $el.find(".columns").length > 0 ? "fa-info-circle" : "fa-circle";

        var $jump = $('<span id="jumpSlide' + slideNum +
            '" class="button"><a href="#"><i class="fa ' + icon + '">' +
            '</i></a></span>').appendTo("#buttonsNav");

        options = $.extend({
            $el: $el,
            $jump: $jump
        }, options);

        this.slides.push(options);
    },

    next: function() {
        if (this.activeSlideNum + 1 < this.slides.length) {
            this.jump(this.activeSlideNum + 1);
        }
    },

    previous: function() {
        if (this.activeSlideNum > 1) {
            this.jump(this.activeSlideNum - 1);
        }
    },

    jump: function(slideNum) {
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
        } else {
            $(".columns").addClass("hidden");
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
        if (this.activeSlideNum === totalSlides) {
            $("#next, #previous").addClass("fadeOut");
        }

        setTimeout(function() {
            // fade in the divs with class of .boxWrap inside this slide
            slide.$el.find(".boxWrap, .endNav, .columnLeft, .caption, " +
                    ".columnRight, .infoText, .infoPics, .fullscreen")
                .removeClass("fadeOut");
        }, 3000);
    },

    onPreload: function() {
        var self = this;

        if (this.initialAudio) {
            this.playTracks(this.initialAudio);
        }

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

        if (window.isiPad) {
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
                }, 3000);
            }
        }
    },

    onSlideExit: function(prevSlide) {
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
            prevSlide.$el.removeClass("activeSlide");
        }, 2000);
    },

    onTitleExit: function() {
        // get rid of title page stuff
        $("#next").removeClass("beginPosition fadeOut").addClass("nextPosition");
        $("#titleBG").removeClass("transparent");
        var $hiding = $("#begin, #titleText, #titleCard, #titleCaption, #titleBG");
        $hiding.addClass("fadeOut");
        setTimeout(function() {
            $hiding.hide();
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

            sound.fade(start, end, 1000);
        });
    },

    loadAudio: function(files, callback) {
        var loaded = 0;
        var total = 0;

        var isLoaded = function() {
            loaded += 1;
            if (loaded === total) {
                $("#loadingText").text("");
                callback();
            } else {
                var loading = Math.round((loaded / total) * 100);
                $("#loadingText").text(loading + "% loaded...");
            }
        };

        for (var name in files) {
            total += 1;
            var filePath = files[name];
            this.tracks[name] = new Howl({
                urls: [filePath + ".mp3", filePath + ".ogg"],
                autoplay: false,
                loop: true,
                volume: 0,
                onload: isLoaded
            });
        }

        var otherMedia = $("img, video");
        otherMedia.on("load canplay", isLoaded);
        total += otherMedia.length;

         if (total === 0) {
             callback();
         }
    }
};

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-23759871-1']);
_gaq.push(['_setDomainName', 'none']);
_gaq.push(['_setAllowLinker', true]);
_gaq.push(['_trackPageview']);

(function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

// Add iPad class if we're on an iPad
window.isiPad = /ipad/i.test(navigator.userAgent) || true;
if (window.isiPad) {
    document.documentElement.className += " ipad";
}