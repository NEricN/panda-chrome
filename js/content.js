var grabMetaData = function(cb) {
    var data = {
        "artist": $(".artistSummary").html(),
        "title": $(".songTitle").html(),
        "album": $(".albumTitle").html()
    }

    console.log(data);
    cb(data);
}

chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
    console.log(req);
    if(req.target === "content") {
        switch(req.method) {
            case "metadata" : grabMetaData(sendResponse); break;
            case "test": sendResponse("hi there"); break;
        }
    }
    return true;
});