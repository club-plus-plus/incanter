//Start the PeerJS server, enabling peer discovery mode using the <SERVER-IP>:9000/incanter/peerjs/peers endpoint
var PeerServer = require('peer').PeerServer;
var server = new PeerServer({port: 9000, path: '/incanter', allow_discovery:true});