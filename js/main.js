$(document).ready(function() {
    var $tunefield = $("#tunefield");
    var $broadcastfield = $("#broadcastfield");
    var $tunebutton = $("#tunebutton");
    var $broadcastbutton = $("#broadcastbutton");
    var $notification = $("#notifications");

    var $volume = $("#volume");

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

        $notification.html("<h4>"+(message||defaultMessage)+"</h4>");
    }

    $tunebutton.click(function() {
        if($tunefield.val()) {
            chrome.runtime.sendMessage({method: 'tune', target: 'background', station: $tunefield.val()}, function(err) {
                console.log("hi!");
                if(err) {
                    changeNotification("dead", err);
                } else {
                    changeNotification("listen", "Listening to " + $tunefield.val());
                }
            });
        }
    });

    $broadcastbutton.click(function() {
        if($broadcastfield.val()) {
            chrome.runtime.sendMessage({method: 'broadcast', target: 'background', station: $broadcastfield.val()}, function(err) {
                if(err) {
                    changeNotification("dead", err);
                } else {
                    changeNotification("broadcast", "Broadcasting " + $broadcastfield.val());
                }
            });
        }
    });

    $volume.change(function() {
        chrome.runtime.sendMessage({method: "volume", volume: $volume.val()/100, target: "background"});
    });

    chrome.storage.local.get(['volume','state','tune','broadcast'], function(data) {
        $volume.val((data.volume||1)*100);
        console.log(data);

        changeNotification(data.state, "", data.state === "broadcast" ? data.broadcast : data.tune);

        $broadcastfield.val(data.broadcast);
        $tunefield.val(data.tune);
    })
})