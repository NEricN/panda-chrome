$(document).ready(function() {
    var $tunefield = $("#tunefield");
    var $broadcastfield = $("#broadcastfield");
    var $tunebutton = $("#tunebutton");
    var $broadcastbutton = $("#broadcastbutton");
    var $notification = $("#notifications");

    var $volume = $("#volume");

    var state;

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

    var changeNotification = function(state, message, station) {
        var defaultMessage = "";
        if(state === "listen") {
            $notification.attr("class", "streaming");
            defaultMessage = "Listening to " + station; 
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
        $tunebutton.attr("disabled", true);
        $tunebutton.html(state === "listen" ? "Tuning out..." : "Tuning in...");

        if($tunefield.val()) {
            chrome.runtime.sendMessage({method: state === "listen" ? "off" : 'tune', target: 'background', station: $tunefield.val()}, function(err) {
                $tunebutton.attr("disabled", false);
                if(err) {
                    changeNotification("dead", err);
                } else {
                    if(state === "listen") {
                        enableButton($tunefield, $tunebutton, "button_tune", "Tune in");
                        changeNotification("dead");
                        state = "dead";
                    } else {
                        disableButton($tunefield, $tunebutton, "button_dead", "Tune out");
                        changeNotification("listen", "Listening to " + $tunefield.val());

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
        $broadcastbutton.attr("disabled", true);
        $broadcastbutton.html(state === "broadcast" ? "Turning off broadcast..." : "Trying to broadcast...");

        if($broadcastfield.val()) {
            chrome.runtime.sendMessage({method: state === "broadcast" ? "off" : 'broadcast', target: 'background', station: $broadcastfield.val()}, function(err) {
                $broadcastbutton.attr("disabled", false);
                if(err) {
                    changeNotification("dead", err);
                } else {
                    if(state === "broadcast") {
                        enableButton($broadcastfield, $broadcastbutton, "button_broadcast", "Broadcast");
                        changeNotification("dead");
                        state = "dead";
                    } else {
                        disableButton($broadcastfield, $broadcastbutton, "button_dead", "Stop broadcast");
                        changeNotification("broadcast", "Broadcasting " + $broadcastfield.val());

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

    chrome.storage.local.get(['volume','state','tune','broadcast'], function(data) {
        $volume.val((data.volume||1)*100);
        changeNotification(data.state, "", data.state === "broadcast" ? data.broadcast : data.tune);
        $broadcastfield.val(data.broadcast);
        $tunefield.val(data.tune);

        state = data.state;

        if(data.state === "broadcast") {
            // grey out broadcast button
            disableButton($broadcastfield, $broadcastbutton, "button_dead", "Stop broadcast");
        } else if(data.state === "listen") {
            // grey out listen button
            disableButton($tunefield, $tunebutton, "button_dead", "Tune out");
        }
    })
})