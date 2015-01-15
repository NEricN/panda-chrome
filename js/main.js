$(document).ready(function() {
    var $tunefield = $("#tunefield");
    var $broadcastfield = $("#broadcastfield");
    var $tunebutton = $("#tunebutton");
    var $broadcastbutton = $("#broadcastbutton");
    var $notification = $("#notifications");

    var $volume = $("#volume");

    var state, song, album, artist;

    $('marquee').marquee();

    var enableButton = function($field, $button, on_class, text) {
        $field.prop('disabled', false);
        $button.removeClass();

        $button.addClass('text-center');
        $button.addClass(on_class);
        $button.html(text);
    }

    var disableButton = function($field, $button, off_class, text) {
        $field.prop('disabled', true);
        $button.removeClass();

        $button.addClass('text-center');
        $button.addClass(off_class);
        $button.html(text);
    }

    var updateMetaData = function(song, album, title) {
        song = song;
        album = album;
        title = title;

        changeNotification("listen");
    }

    var changeNotification = function(state, message, station) {
        var defaultMessage = "";
        if(state === "listen") {
            $notification.attr("class", "streaming");
            defaultMessage = (artist && song) ? artist + " - " + song : "Listening to " + station;
        } else if(state == "broadcast") {
            $notification.attr("class", "broadcasting");
            defaultMessage = "Broadcasting  " + station; 
        } else {
            $notification.attr("class", "dead");
            defaultMessage = "No Station"; 
        }

        $("#marquee").html((message||defaultMessage));
    }

    $tunebutton.click(function() {
        if($tunefield.val()) {
            $tunebutton.attr("disabled", true);
            $tunebutton.html(state === "listen" ? "Tuning out..." : "Tuning in...");
            chrome.runtime.sendMessage({method: state === "listen" ? "off" : 'tune', target: 'background', station: $tunefield.val()}, function(err) {
                $tunebutton.attr("disabled", false);
                if(err) {
                    $tunebutton.attr("disabled", false);
                    $tunebutton.html("Tune in");
                    changeNotification("dead", err);
                } else {
                    if(state === "listen") {
                        enableButton($tunefield, $tunebutton, "button_tune", "Tune in");
                        changeNotification("dead");
                        state = "dead";
                    } else {
                        disableButton($tunefield, $tunebutton, "button_dead", "Tune out");
                        changeNotification("listen", "", $tunefield.val());

                        if(state === "broadcast") {
                            enableButton($broadcastfield, $broadcastbutton, "button_broadcast", "Broadcast");
                        }

                        state = "listen";
                    }
                }
            });
        }
    });

    $broadcastbutton.click(function() {
        if($broadcastfield.val()) {
            $broadcastbutton.attr("disabled", true);
            $broadcastbutton.html(state === "broadcast" ? "Turning off broadcast..." : "Trying to broadcast...");
            chrome.runtime.sendMessage({method: state === "broadcast" ? "off" : 'broadcast', target: 'background', station: $broadcastfield.val()}, function(err) {
                $broadcastbutton.attr("disabled", false);
                if(err) {
                    $broadcastbutton.attr("disabled", false);
                    $broadcastbutton.html("Broadcast");
                    changeNotification("dead", err);
                } else {
                    if(state === "broadcast") {
                        enableButton($broadcastfield, $broadcastbutton, "button_broadcast", "Broadcast");
                        changeNotification("dead");
                        state = "dead";
                    } else {
                        disableButton($broadcastfield, $broadcastbutton, "button_dead", "Stop broadcast");
                        changeNotification("broadcast", "", $broadcastfield.val());

                        if(state === "listen") {
                            enableButton($tunefield, $tunebutton, "button_tune", "Tune in");
                        }

                        state = "broadcast";
                    }
                }
            });
        }
    });

    $volume.change(function() {
        chrome.runtime.sendMessage({method: "volume", volume: $volume.val()/100, target: "background"});
    });

    chrome.storage.local.get(['volume','state','tune','broadcast','artist','song','album'], function(data) {
        console.log(data);
        $volume.val((data.volume||1)*100);
        $broadcastfield.val(data.broadcast);
        $tunefield.val(data.tune);

        state = data.state;

        song = data.song;
        artist = data.artist;
        album = data.album;

        changeNotification(data.state, "", data.state === "broadcast" ? data.broadcast : data.tune);

        if(data.state === "broadcast") {
            // grey out broadcast button
            disableButton($broadcastfield, $broadcastbutton, "button_dead", "Stop broadcast");
        } else if(data.state === "listen") {
            // grey out listen button
            disableButton($tunefield, $tunebutton, "button_dead", "Tune out");
        }
    })

    chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
        if(req.target === "popup") {
            switch(req.method) {
                case "unlisten" : changeVolume(req.volume); sendResponse(""); break;
                case "metadata": updateMetaData(req.song, req.album, req.title); sendResponse(""); break;
            }
        }
        return true;
    });
})