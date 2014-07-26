Incanter
========

Incanter is an augmented reality wizard battle game that runs right in your browser! Using motion detection, players charge elements (Air, Earth, Fire, Water, Light, and Dark) to craft spells to attack or counter their opponent. A webcam and a little imagination is all that's required for hours of spell-slinging fun!

Please note that Incanter works best over a local network and has not yet been tested for online play.


Client
------

The Incanter client relies on WebRTC for webcam access and peer-to-peer network communication, and has been tested in the latest versions of Mozilla Firefox and Google Chrome. Any web server running PHP is suitable for serving the client to browsers (only a single line of PHP code is used for setting the server IP, all of the files aside from `index.php` are static.)


Server
------

The Incanter server is a simple wrapper for the [PeerJS](http://peerjs.com/) server that enables peer discovery mode and specifies the path and port number, and runs using Node.js. The client is configured to expect the Incanter server to be available on the same IP address as the web server that served the client files to the browser.

To install the server, simply run `npm install .` from the `server` directory, which will install the PeerJS server package and its dependencies. The server can then be run using `node server.js`.


License and credits
-------------------

Incanter is licensed under the MIT License (see `LICENSE` for details), except for parts of the motion detection code, which are based on the JS Motion Detection Library, from <https://github.com/ReallyGood/js-motion-detection/>, and fall under a [Creative Commons Attribution-Noncommercial-Share Alike 3.0 Unported License](http://creativecommons.org/licenses/by-nc-sa/3.0/).

The Incanter client code includes unmodified copies of the [jQuery](http://jquery.com/) and [PeerJS](http://peerjs.com/) libraries, both of which are licensed under the MIT License.

Credits and attributions for the game's art and sound assets are listed in `CREDITS`.