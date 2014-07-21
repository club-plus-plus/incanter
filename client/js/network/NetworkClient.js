/*
	Network Client
	
	Manages the game's network communication functionality.
	
	-------
	
	Copyright (c) 2014 Club++ Contributors
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.
*/

//Network events enum
window.NetworkEvent = {
	ServerConnected:           'ServerConnected',
	PeerConnected:             'PeerConnected',
	PeerDisconnected:          'PeerDisconnected',
	PeerMediaStreamAvailable:  'PeerMediaStreamAvailable',
	
	BattleRequestSent:         'BattleRequestSent',
	BattleRequestReceived:     'BattleRequestReceived',
	AcceptedPeerRequest:       'AcceptedPeerRequest',
	PeerAcceptedClientRequest: 'PeerAcceptedClientRequest',
	PeerCastSpell:             'PeerCastSpell',
	TurnOver:                  'TurnOver'
};

function NetworkClient(serverIP, serverPort, serverPath, mediaStream, playerObjectManager)
{
	this.protocol    = new NetworkProtocol();
	this.client      = new Peer({host: serverIP, port: serverPort, path: serverPath});
	this.clientID    = null;
	this.connection  = null;
	this.mediaStream = mediaStream;
	
	//Keep track of the player object manager, which provides access to the client and peer player objects
	this.playerObjectManager = playerObjectManager;
	
	//Keep track of the player data of the connected peer
	this.peerPlayer = null;
	
	//The mapping of registered event listener
	this.eventListeners = {};
	
	//Register our internal event listener chains
	this.registerInternalEventListeners();
}

//Retrieves the client ID
NetworkClient.prototype.getClientID = function() {
	return this.clientID;
}

//Registers a new event lister
//[Event listeners are instances of callable that take a single argument]
NetworkClient.prototype.on = function(eventName, listener)
{
	//Check that the specified event is valid
	if (this.isValidEventName(eventName) === false) {
		return;
	}
	
	//We maintain a list of listeners for each event
	if (this.eventListeners[eventName] === undefined) {
		this.eventListeners[eventName] = [];
	}
	
	this.eventListeners[eventName].push(listener);
}

//Retrieves the list of peers connected to the server
NetworkClient.prototype.retrievePeerList = function(callback)
{
	//Build the query URL
	var protocol = 'http://';
	var querySuffix = 'connected';
	var url = protocol + this.client.options.host + ":" + this.client.options.port + this.client.options.path + querySuffix;
	
	//Retrieve the list of peers
	var that = this;
	$.getJSON(url, function(data)
	{
		if (data && $.isFunction(callback))
		{
			//Remove our own unique ID from the list of peer IDs
			if ($.isArray(data)) {
				data.splice($.inArray(that.clientID, data), 1);
			}
			
			//Pass the list of peers to the supplied callback
			callback(data);
		}
	});
}

//Connects to the specified peer
NetworkClient.prototype.connectToPeer = function(peerID)
{
	//If we are already connected to a peer, close the existing connection
	if (this.isConnected() === true) {
		this.disconnect();
	}
	
	//Attempt to connect to the specified peer
	var that = this;
	this.connection = this.client.connect(peerID);
	
	//Once the connection is established, transmit a battle request message to the peer
	this.connection.on('open', function()
	{
		//Emit an event indicating the connection has been established, and initiate a video call
		that.emitEvent(NetworkEvent.PeerConnected);
		that.videoCall(peerID);
		
		//Send a battle request to the peer
		that.connection.send(that.protocol.battleRequest(that.playerObjectManager.getClientPlayer()));
		that.emitEvent(NetworkEvent.BattleRequestSent);
	});
	
	//Forward any data received from the peer connection to our data handler
	this.connection.on('data', function(data) { that.handleData(data); });
	
	//When the connection is closed, emit an event
	this.connection.on('close', function() { that.emitEvent(NetworkEvent.PeerDisconnected); });
}

//Accepts the most recently received battle request
NetworkClient.prototype.acceptBattleRequest = function()
{
	this.connection.send(this.protocol.battleAccept(this.playerObjectManager.getClientPlayer()));
	this.emitEvent(NetworkEvent.AcceptedPeerRequest);
}

//Declines the most recently received battle request
NetworkClient.prototype.declineBattleRequest = function()
{
	//To decline a battle request, we simply disconnect from the peer
	this.disconnect();
}

//Transmits a 'cast spell' message to the peer
NetworkClient.prototype.castSpell = function() {
	this.connection.send(this.protocol.castSpell(this.playerObjectManager.getClientPlayer()));
}

//Transmits a 'turn over' message to the peer
NetworkClient.prototype.signalTurnComplete = function() {
	this.connection.send(this.protocol.turnOver(this.playerObjectManager.getClientPlayer()));
}

NetworkClient.prototype.isConnected = function() {
	return (this.connection !== null);
}

NetworkClient.prototype.disconnect = function()
{
	if (this.isConnected() === true)
	{
		//Disconnect from the peer
		this.connection.close();
		this.connection = null;
	}
}

NetworkClient.prototype.emitEvent = function(eventName, eventData)
{
	//Check that the specified event is valid
	if (this.isValidEventName(eventName) === false) {
		return;
	}
	
	if (this.eventListeners[eventName] !== undefined)
	{
		for (var listenerIndex = 0; listenerIndex < this.eventListeners[eventName].length; ++listenerIndex) {
			this.eventListeners[eventName][listenerIndex](((eventData === undefined) ? {} : eventData));
		}
	}
}

NetworkClient.prototype.isValidEventName = function(eventName) {
	return (eventName !== undefined && window.NetworkEvent[eventName] !== undefined);
}

NetworkClient.prototype.registerInternalEventListeners = function()
{
	var that = this;
	
	//Connection to server established
	this.client.on('open', function(id)
	{
		if (id)
		{
			//Store the server-generated unique ID and emit the ServerConnected event
			that.clientID = id;
			that.playerObjectManager.getClientPlayer().setID(that.clientID);
			that.emitEvent(NetworkEvent.ServerConnected);
		}
	});
	
	//Peer connection request received
	this.client.on('connection', function(conn)
	{
		//If we are already connected to a peer, drop the incoming connection
		if (that.isConnected() === true) {
			conn.close();
		}
		else
		{
			//Store the connection
			that.connection = conn;
			
			//Forward any data received from the peer connection to our data handler
			that.connection.on('data', function(data) { that.handleData(data); });
			
			//Emit the PeerConnected event
			that.emitEvent(NetworkEvent.PeerConnected);
		}
	});
	
	//Peer video call received
	this.client.on('call', function(call)
	{
		//Answer the call with our own media stream
		call.answer(that.mediaStream);
		that.handleVideoCall(call);
	});
}

//Initiates a video call with the specified peer
NetworkClient.prototype.videoCall = function(peerID)
{
	var call = this.client.call(peerID, this.mediaStream);
	this.handleVideoCall(call);
};

NetworkClient.prototype.closeVideoCall = function()
{
	if (this.currentVideoCall !== undefined)
	{
		this.currentVideoCall.close();
		delete this.currentVideoCall;
	}
}

NetworkClient.prototype.handleVideoCall = function(call)
{
	//Hang up on any existing call
	this.closeVideoCall();
	
	//Keep track of the current call
	this.currentVideoCall = call;
	
	//If the video call receives a hangup, simply close it
	var that = this;
	this.currentVideoCall.on('close', function() { that.closeVideoCall(); });
	
	//When the peer's media stream becomes available, emit an event
	this.currentVideoCall.on('stream', function(remoteStream) {
		that.emitEvent(NetworkEvent.PeerMediaStreamAvailable, remoteStream);
	});
};

NetworkClient.prototype.handleData = function(data)
{
	//If the protocol data contains a Player object that is a JSON string, parse it
	if (typeof data.Player === 'string') {
		data.Player = $.parseJSON(data.Player);
	}
	
	//If the request was valid, copy the peer's player state
	if (NetworkProtocol.prototype.commands[data.Request] !== undefined) {
		this.playerObjectManager.getPeerPlayer().set(data.Player);
	}
	
	//Determine what type of protocol packet has been received
	if (data.Request == this.protocol.commands.BattleRequest)
	{
		//Battle request received from peer
		this.emitEvent(NetworkEvent.BattleRequestReceived, data.Player.id);
	}
	else if (data.Request == this.protocol.commands.BattleAccepted)
	{
		//Outgoing battle request accepted by peer
		this.emitEvent(NetworkEvent.PeerAcceptedClientRequest, data.Player.id);
	}
	else if (data.Request == this.protocol.commands.CastSpell)
	{
		//Opponent cast spell
		this.emitEvent(NetworkEvent.PeerCastSpell);
	}
	else if (data.Request == this.protocol.commands.TurnOver)
	{
		//Our turn is over
		this.emitEvent(NetworkEvent.TurnOver);
	}
}
