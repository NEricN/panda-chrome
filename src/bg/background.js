var baseURL = "http://panda-panda.herokuapp.com";
//var baseURL = "127.0.0.1:3000";

var AudioManager = function() {
}

AudioManager.prototype.generateAudio = function(src) {
    var container = new Audio(src);
    container.addEventListener('loadeddata', function(e) { e.target.play(); });
    container.autoplay = false;
    container.setAttribute('type', 'audio/mp4');
    container.load();
    return container;
}

AudioManager.prototype.playSong = function(src) {
    if(this.container) {
        this.container.pause();
        $(this.container).attr('src', src);
        this.container.load();
    } else {
        this.container = this.generateAudio(src);
    }
}

AudioManager.prototype.changeVolume = function(vol) {
    this.volume = vol;

    if(this.container) {
        this.container.volume = vol;
    }
}

var audioManager = new AudioManager();
var curStation;
var state;
var gcmId;

var grabMetaData = function(cb) {
    chrome.tabs.query({url: "http://www.pandora.com/*"}, function(data) {
        console.log(data);
        var tab = data[0];

        if(tab) {
            chrome.tabs.sendMessage(tab.id, {target: "content", method: "metadata"}, function(data) {
                cb(data);
            });
        } else {
            cb(null);
        }
    });
}

var addGcmListener = function() {
    chrome.gcm.onMessage.addListener(function(data) {
        //console.log(data);
        if(state === "listen") {
            if(data.data['song']) {
                // play this song bro
                if(audioManager.container.url === data.data['song']) {
                    //dupe, ignore but log message
                    console.log("Dupe glitch occured with " + data.data['song']);
                } else {
                    audioManager.playSong(data.data['song']);
                }
            } else if(data.data['end']) {
                //STOP EVERYTHING
                audioManager.playSong("");
                cleanUp();

                chrome.runtime.sendMessage({target: "popup", method: "unlisten"});
            } else if(data.data['meta']) {
                // grab meta data

                chrome.storage.local.set({album: data.data['album'], song: data.data['song'], artist: data.data['artist']});
                chrome.runtime.sendMessage({target: "popup", method: "metadata", album: data.data['album'], song: data.data['song'], artist: data.data['artist']});
            }
        }
    });
}

var changeVolume = function(vol) {
    chrome.storage.local.set({volume: vol}, function(err) {
    });

    audioManager.changeVolume(vol);

    //do something with volume
}

var cleanUp = function(cb) {
    if(state === "broadcast") {
        $.post(baseURL+"/unbroadcast", JSON.stringify({station: curStation}), function(data) {
            console.log(data);
            //state = "none";
        });
    } else if(state === "listen") {
        $.post(baseURL+"/unlisten", JSON.stringify({station: curStation, gcm: gcmId}), function(data) {
            console.log(data);
            //state = "none";
        });
    }

    state = "none";
    curStation = "none";

    chrome.storage.local.set({state: state}, cb);
}

var broadcast = function(station, cb) {
    audioManager.playSong(""); // cancel all the things
    cleanUp(function() {
        $.post(baseURL+"/broadcast", JSON.stringify({station: station, songurl: "placeholder", newBroadcast: true}), function(data) {
            console.log(data);
            //set curStation here
            //set state here
            curStation = station;
            state = "broadcast";

            chrome.storage.local.set({state: state, broadcast: curStation}, function() { cb(false); });
        }).fail(function(blarg) {
            cb("Station Already Exists");
        });;
    });    
}

var tuneInto = function(station, cb) {
    audioManager.playSong(""); // cancel all the things
    cleanUp(function() {
        $.post(baseURL+"/listen", JSON.stringify({station: station, gcm: gcmId}), function(data) {
            console.log(data);
            audioManager.playSong((JSON.parse(data))["url"]);
            //set curStation here
            //set state here
            curStation = station;
            state = "listen";

            chrome.storage.local.set({state: state, tune: curStation}, function() { cb(false); });
        }).fail(function(blarg) {
            cb("Station Not Found");
        });
    });
}

chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
    console.log(req);
    if(req.target === "background") {
        switch(req.method) {
            case "volume" : changeVolume(req.volume); sendResponse(""); break;
            case "broadcast" : broadcast(req.station, sendResponse); break;
            case "tune": tuneInto(req.station, sendResponse); break;
            case "off": cleanUp(function() { sendResponse(""); }); break;
        }
    }
    return true;
});

chrome.storage.local.get('registrationId', function(data) {
    if(!data.registrationId) {
        chrome.gcm.unregister(function() {
            chrome.gcm.register(['576374287167'], function(regId) {
                chrome.storage.local.set({registrationId: regId});

                gcmId = regId;

                addGcmListener();
            });
        });
    } else {
        gcmId = data.registrationId;
        addGcmListener();
    }
})


chrome.webRequest.onHeadersReceived.addListener(function(data) {
    if(data.responseHeaders && state === "broadcast") {
        data.responseHeaders.forEach(function(item) {
            if(item.name === "Content-Type" && item.value === "audio/mp4") {
                //found it! now what?
                //console.log(data.url);

                $.post(baseURL+"/broadcast", JSON.stringify({station: curStation, songurl: data.url, newBroadcast: false}), function(data) {
                    console.log(data);
                    //set curStation here
                    //set state here
                    grabMetaData(function(metadata) {
                        $.post(baseURL+"/broadcast", JSON.stringify({station: curStation, artist: metadata.artist, song: metadata.song, album: metadata.album}), function(data) {
                            console.log("Meta data sent!");
                            console.log(metadata);
                        });
                    })
                });
            }
        });
    }
}, {urls: ["http://*.pandora.com/*"]}, ["responseHeaders"]);

chrome.storage.local.get(['volume','state','tune','broadcast'], function(data) {
    audioManager.changeVolume(data.volum||1*100);

    if(data.state === "broadcast") {
        curStation = data.broadcast;
    } else if(data.state === "listen") {
        curStation = data.tune;
    } else {
        curStation = "";
    }

    state = data.state;
})