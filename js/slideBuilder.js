/* 
Special functions for building popcorn scenes and managing audio tracks
Written by Nell Shaw Cohen (nell@nellshawcohen.com) with help from John Resig (jeresig@gmail.com)
for use in "Explore John Muir's Yosemite" (http://beyondthenotes.org/yosemite)
*/

function slideBuilder(slideNum, onStart, onEnd) {
	// use some math to determine the start time based solely on slide number 
	// (e.g. slide 3 starts at 11 seconds)
	var start = ((slideNum - 1) * 5) + 1;
	// find unique div ids in code (e.g. #slide3) by combining #slide with the slide number
	var slide = $("#slide" + slideNum);
	// find unique span ids for circlular buttons used to jump between scenes (e.g. #jumpSlide3)
	var jumpSlide = $("#jumpSlide" + slideNum);
	// find the total number of slides (i.e. divs with class of .slide) in document to use to 
	// determine when "next" button should disappear
	var totalSlides = $(".slide").length;
	// function for clicking scene-jumping buttons
	$(jumpSlide).click(function() {
		pop.play(start);
		return false;
	});
	// create pause cue in slide; e.g. slide 3 is paused at 15 seconds
	pop.cue(slideNum * 5, function() {
		pop.pause();
	});
	// manipulate page elements to construct slide
	pop.code({
		start: start,
		// slides are always 5 seconds long
		end: start + 5,
		onStart: function(){
			// Bring the current slide into view
			slide.addClass("activeSlide");
			// if a custom function for onStart is defined, then call it
			if (onStart) {
				onStart();
			}
			setTimeout(function() {
				// fade in the divs with class of .fullscreen inside this slide
				slide.find(".fullscreen").removeClass("fadeOut");
				slide.find(".caption").removeClass("fadeOut");
			}, 0);
			// highlight the circular button for the active slide
			$(jumpSlide).addClass("buttonCurrent");
			// if this slide is 2 or higher, show the previous button
			if (slideNum > 1) {
				$("#previous").removeClass("fadeOut");
			}
			// if this slide is before the last slide (less than the total number of slides),
			// then show the next button
			if (slideNum < totalSlides) {
				$("#next").removeClass("fadeOut");
			}
		},
		onEnd: function(){
			// if a custom function for onEnd is defined, then call it
			if (onEnd) {
				onEnd();
			}
			// Hide the other active slide (the slide we're transitioning out of)
			// "Hide" means to put it off the side of the page.
			$(".activeSlide").not(slide).removeClass("activeSlide");
			// fade back out again
			slide.find(".fullscreen").addClass("fadeOut");
			slide.find(".caption").addClass("fadeOut");
			$(jumpSlide).removeClass("buttonCurrent");
			$("#next, #previous").addClass("fadeOut");
		}
	});
	pop.code({
		// after a delay of 3 seconds, start
		start: start + 3,
		end: start + 5,
		onStart: function(){
			// fade in the divs with class of .boxWrap inside this slide
			slide.find(".boxWrap").removeClass("fadeOut");
			slide.find(".endNav").removeClass("fadeOut");
			slide.find(".infoText").removeClass("fadeOut");
			slide.find(".infoPics").removeClass("fadeOut");
		},
		onEnd: function(){
			// fade back out again
			slide.find(".boxWrap").addClass("fadeOut");
			slide.find(".endNav").addClass("fadeOut");
			slide.find(".infoText").addClass("fadeOut");
			slide.find(".infoPics").addClass("fadeOut");
		}
	});	
}

var masterVolume = 1;

function audioManager($toUnmute, audioVolume, videoVolume) {
	// manages which audio (including video) is muted or unmuted (faded in)
	// also uses variable volume levels based on user-manipulated masterVolume

	// if no audioVolume argument in defined in function, make it 1
	if (audioVolume === undefined) {
		audioVolume = 1;
	}

	// if no videoVolume argument in defined in function, make it 1
	if (videoVolume === undefined) {
		videoVolume = 1;
	}

	// multiply audioVolume and videoVolume by masterVolume (allowing user to set vol levels)
	audioVolume = audioVolume * masterVolume;
	videoVolume = videoVolume * masterVolume;

	// all audio and video elements in the page included in $allAudioVideo array
	var $allAudioVideo = $("audio, video");

	$allAudioVideo.each(function(i, audioVideoElem) {
		// if the audioVideoElem is a video, set var "volume" to videoVolume. If not, set
		// var "volume" to audioVolume.
		if ($(audioVideoElem).is("video")) {
			var volume = videoVolume;
		} else {
			var volume = audioVolume;
		}
		// If the element that we're currently looking at is one of the elements
		// that we want to unmute, then animate to maxVolume over 200 ms
		if ($toUnmute.index(audioVideoElem) >= 0) {
			$(audioVideoElem).animate({volume: volume}, 1000);

		// If it's not one of the audio/video elements we care about, mute it
		} else {
			$(audioVideoElem).animate({volume: 0}, 1000);
		}
	});
}

function audioLoader(files, callback) {
    var loaded = 0;
    var total = 0;

    $(document).ready(function() {
        for (var name in files) {
            var filePath = files[name];
            var elem = document.createElement("audio");
            elem.id = name;
            elem.loop = true;
            elem.volume = 0;
            elem.preload = "auto";
            elem.className = "hidden";
            if (elem.canPlayType("audio/mpeg")) {
                elem.src = filePath + ".mp3";
            } else {
                elem.src = filePath + ".ogg";
            }
            elem.oncanplay = function() {
                loaded += 1;
                if (loaded === total) {
                    callback();
                }
            };
            total += 1;
            document.body.appendChild(elem);
        }

 		if (total === 0) {
 			callback();
 		}
    });
}

/*
volume = 1
masterVolume = 1

volume * masterVolume === 1

volume = 1
masterVolume = 0.7

volume * masterVolume === 0.7

volume = 0.5
masterVolume = 0.7

volume * masterVolume === 0.35
*/


/*
e.g.
audioManager($("#track1, #track2, #video"), .7);
*/

/* to explain:

var current = $("#track1, #track2, #video") =>
	[<track1>, <track2>, <video>]

var all = $("audio, video") =>
	[<track1>, <track2>, <video>, <track1>, <track2>, <video>, <track1>, <track2>, <video>]

all[0].volume = 0;
all[1].volume = 0;
all[2].volume = 0;
// ...
*/
