/* 
Special functions for building popcorn.js scenes and managing audio tracks
Written by John Resig (jeresig@gmail.com) and Nell Shaw Cohen (nell@nellshawcohen.com)
for use in "Explore John Muir's Yosemite" (http://beyondthenotes.org/yosemite)
*/

// audio pre-loading
var allSounds = {};
var masterVolume = 1;

var Slides = {
    slides: [null],
    activeSlideNum: 0,
    activeSlide: null,

    init: function() {
    	$("#next").on("click", function() {
    		Slides.next();
    		return false;
    	});

    	$("#previous").on("click", function() {
    		Slides.previous();
    		return false;
    	});

    	// find unique span ids for circlular buttons used to jump between
        // scenes (e.g. #jumpSlide3)
        // TODO: Generate this dynamically
    	var jumpSlide = $("#jumpSlide" + slideNum);

    	// function for clicking scene-jumping buttons
        // TODO: Delegate
    	$(jumpSlide).click(function() {
            Slides.jump(slideNum);
    		return false;
    	});
    },

    add: function(onStart, onEnd) {
        var slideNum = this.slides.length + 1;

        // TODO: Add jump thing here

        this.slides.push({
            $el: $("#slide" + slideNum),
            $jump: $("#jumpSlide" + slideNum),
            onStart: onStart,
            onEnd: onEnd
        });
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
    		// Fade out the contents of the slide
    		prevSlide.$el.find(".boxWrap, .endNav, .columnLeft, .caption, " +
                    ".columnRight, .infoText, .infoPics, .fullscreen")
                .addClass("fadeOut");

    		// if a custom function for onEnd is defined, then call it
    		if (prevSlide.onEnd) {
    			prevSlide.onEnd();
    		}

    		// Hide the other active slide (the slide we're transitioning out
            // of) "Hide" means to put it off the side of the page.
            prevSlide.$el.removeClass("activeSlide");

            // Remove highlight on the jump button
    		slide.$jump.removeClass("buttonCurrent");

            // Fade out the navigation buttons
    		$("#next, #previous").addClass("fadeOut");
        } else {
        	// get rid of title page stuff
        	$("#next").removeClass("beginPosition fadeOut").addClass("nextPosition");
        	$("#titleBG").removeClass("transparent");
        	var $hiding = $("#begin, #titleText, #titleCard, #titleCaption, #titleBG");
            $hiding.addClass("fadeOut");
            setTimeout(function() {
                $hiding.hide();
            }, 2000);
        	$("#buttonsNav").removeClass("fadeOut");
        }

		// Bring the current slide into view
		slide.$el.addClass("activeSlide");

		// if a custom function for onStart is defined, then call it
		if (slide.onStart) {
			slide.onStart();
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
		if (this.activeSlideNum < totalSlides) {
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
    }
}

function audioManager(toUnmute, audioVolume, videoVolume) {
	// manages which audio (including video) is muted or unmuted (faded in)
	// also uses variable volume levels based on user-manipulated masterVolume

	// if no audioVolume argument in defined in function, make it 100
	if (audioVolume === undefined) {
		audioVolume = 1;
	}

	// if no videoVolume argument in defined in function, make it 100
	if (videoVolume === undefined) {
		videoVolume = 1;
	}

	// multiply audioVolume and videoVolume by masterVolume (allowing user to
	// set volume levels)
	audioVolume = audioVolume * masterVolume;
	videoVolume = videoVolume * masterVolume;

	// all video elements in the page included in $allVideo array
	$("video").each(function(i, videoElem) {
		// If the element that we're currently looking at is one of the elements
		// that we want to unmute, then animate to maxVolume over 200 ms
		if (toUnmute.indexOf(videoElem.id) >= 0) {
			$(videoElem).animate({volume: videoVolume}, 1000);
		// If it's not one of the audio/video elements we care about, mute it
		} else {
			$(videoElem).animate({volume: 0}, 1000);
		}
	});

	$.each(Object.keys(allSounds), function(i, id) {
		var sound = allSounds[id];
		var start = sound.volume();
		var end = audioVolume;

		if (toUnmute.indexOf(id) < 0) {
			end = 0;
		}

		sound.fade(start, end, 1000);
	});
}

function audioLoader(files, callback) {
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

	$(document).ready(function() {
		for (var name in files) {
			total += 1;
			var filePath = files[name];
			allSounds[name] = new Howl({
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
	});
}

// audio playback when hovering over map links

function mapHoverAudio(sceneName) {
	$("#map_" + sceneName).hover(
		  	function() {
		  	// Once you enter
		  	$("#audio_" + sceneName).animate({volume: 1}, 1000)[0].play();
		  	}, function() {
		  	// Once you leave
		  	$("#audio_" + sceneName).animate({volume: 0}, 750, function() {
		  		this.pause();
		  	});
		  }
		);
}