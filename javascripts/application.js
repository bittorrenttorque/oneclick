jQuery(function() {
    function isMac() {
        return navigator.userAgent.match(/Macintosh/) != undefined;
    }
    // Create the Btapp object that will connect us to the underlying torrent client.
    // This allows us to download the torrent file contents when a torrent file is
    // downloaded in chrome. We will simply download the torrent behind the scenes and
    // create new tabs pointing to the proxy urls of each of the torrent file entries.
    var btapp = new Btapp;
    btapp.connect({
        // Restrict the information retrieved from the client to just the download and
        // proxy urls, which is all we need to download torrents, then serve their content.
        queries: [
            ['btapp','torrent','all','*','properties','all','download_url'],
            ['btapp','torrent','all','*','properties','all','hash'],
            ['btapp','torrent','all','*','file','all','*','properties','all','streaming_url'],
            ['btapp','torrent','all','*','file','all','*','properties','all','name'],
            ['btapp', 'add']
        ],
        // If we use the same mime type here as is made available by the basic plugin,
        // web apps would lose access to it...so we use our custom version. Chrome bug?
        mime_type: 'application/x-bittorrent-torquechrome'
    });

    /**
        Handle the chrome tabs here. The goal is to only add one tab at a time to minimize
        the visual artifacts.
    **/

    var tab_queue = [];

    function check_tab_queue() {
        if(tab_queue.length == 0) {
            return;
        }

        _gaq.push(['_trackEvent', 'Stream', 'Torrent', 'File']);
        chrome.tabs.create({
            url: tab_queue.pop(),
            selected: false
        });

        if(tab_queue.length == 0) {
            _gaq.push(['_trackEvent', 'Stream', 'Torrent', 'All Started']);
        }
    }

    function queue_tab_creation(streaming_url) {
        tab_queue.push(streaming_url);
    }

    chrome.tabs.onRemoved.addListener(
        function(tabId, removeInfo) {
            _.defer(check_tab_queue);
        }
    );


    // Store the torrent urls of the torrents that we're responsible for piping back to
    // the browser as file downloads. Its possible the torrent client is being used for
    // other torrents and we don't want to magically kick off random downloads.
    var torrents = {};
    // This is where we store the streaming urls associated with torrent download urls
    // This allows us to retrieve information about the torrent (name) when we're 
    // inserting Content-Disposition headers.
    var streaming_urls = {};

    // Given the properties of a torrent that we just detected in the torrent client,
    // determine if its being downloaded as part of the one click experience, and if
    // it is, kick off a download from each of the torrent files' proxy urls.
    function download_torrent_files(properties) {
        setTimeout(function() {
            var url = properties.get('download_url');
            var rand = 0;
            if(torrents[url]) {
                delete torrents[url];
                var files = btapp.get('torrent').get(properties.get('hash')).get('file');
                _gaq.push(['_trackEvent', 'Added', 'Torrent', 'Files', files.length]);
                files.each(function(file) {
                    var streaming_url = file.get('properties').get('streaming_url') + '&service=DOWNLOAD';
                    if(!isMac()) {
                        streaming_url = streaming_url.replace('127.0.0.1', '127.0.0.' + (((++rand) % 10) + 1));
                    }
                    var name = file.get('properties').get('name');
                    streaming_urls[streaming_url] = name;
                    queue_tab_creation(streaming_url);
                });

                var uses = (jQuery.jStorage.get('uses') || 0) + 1;
                jQuery.jStorage.set('uses', uses);
                _gaq.push(['_trackEvent', 'Stream', 'Torrent', 'Uses', uses]);
                console.log(uses + ' uses so far.');
                if(uses == 4) {
                    var w = 440;
                    var h = 220;
                    var left = (screen.width/2)-(w/2);
                    var top = (screen.height/2)-(h/2);
                    chrome.windows.create({
                        url: chrome.extension.getURL('purchase.html'),
                        width: w,
                        height: h,
                        left: left,
                        top: top,
                        focused: true,
                        type: 'popup'
                    }, function() {
                    });
                } else {
                    check_tab_queue();
                }
            }
        }, 1);
    }

    // By default, only newly detected torrents are checked if they should be turned into
    // torrent file downloads. We miss out on repeat downlods in this case, so make the
    // plugin -> btapp entry point check if the torrent already exists. If it doesn't, 
    // adding it to the torrents object using its url as a key will be sufficient to start
    // the machinery when its detected in the future.
    function download(url) {
        torrents[url] = true;
        // If the torrent already exists, kick off the downloads of the files, as this
        // won't happen naturally when the torrent is added (because it already exists!)
        if(btapp.has('torrent')) {
            if(btapp.get('torrent').each(function(torrent) {
                if(torrent.has('properties')) {
                    if(torrent.get('properties').get('download_url') === url) {
                        download_torrent_files(torrent.get('properties'));
                        return;
                    }
                }
            }));
        }
    }

    // Process all new torrents (and their properties) as soon as we see then for
    // the first time. 
    btapp.live('torrent * properties', download_torrent_files);

    // This listener for onHeadersReceived is responsible for altering proxy requests
    // in flight to ensure that they are treated like downloads, and are saved using the
    // same file name that appears in the torrent file entry. 
    chrome.webRequest.onHeadersReceived.addListener(
        function(details) {
            if(!(details.url in streaming_urls)) return {};

            console.log(details.url);
            console.log(details.statusLine);
            details.statusLine = 'HTTP/1.1 303 See Other'
            var disposition = false;
            for(var i = 0; i < details.responseHeaders.length; i++) {
                if(details.responseHeaders[i].name === 'Content-Disposition') {
                    disposition = true;
                    break;
                }
            }
            // Its possible the disposition is already provided. Only add our own if it doesn't
            // already exist.
            if(!disposition) {
                details.responseHeaders.push({
                    name: 'Content-Disposition',
                    value: 'attachment; filename="' + streaming_urls[details.url] + '"'
                });
                delete streaming_urls[details.url];
            }
            return {responseHeaders: details.responseHeaders};
        },
        {urls: [
            // Chrome limits downloads from each domain to 4 at a time...
            // give ourselves more domains to download from so that we're
            // more likely to be able to start downloads for all files in 
            // the torrent.
            "http://127.0.0.1:*/proxy*",
            "http://127.0.0.2:*/proxy*",
            "http://127.0.0.3:*/proxy*",
            "http://127.0.0.4:*/proxy*",
            "http://127.0.0.5:*/proxy*",
            "http://127.0.0.6:*/proxy*",
            "http://127.0.0.7:*/proxy*",
            "http://127.0.0.8:*/proxy*",
            "http://127.0.0.9:*/proxy*",
            "http://127.0.0.10:*/proxy*"
            ]
        },
        ["blocking", "responseHeaders"]
    );

    chrome.webRequest.onHeadersReceived.addListener(
        function(details) {
            for(var i = 0; i < details.responseHeaders.length; i++) {
                var name = details.responseHeaders[i].name;
                var value = details.responseHeaders[i].value;
                if(name === 'Content-Type') {
                    var type = (value === 'application/x-bittorrent');
                    var mime = (value === 'binary/octet-stream' && details.url.match(/\.torrent/));
                    if(type || mime) {
                        _gaq.push(['_trackEvent', 'Download', 'Torrent', 'Url']);                        
                        if(btapp.has('add')) {
                            btapp.get('add').torrent(details.url);
                            download(details.url);
                        }
                    }
                }
            }
        },
        {urls: ["*://*/*"]},
        ["blocking", "responseHeaders"]
    );
});