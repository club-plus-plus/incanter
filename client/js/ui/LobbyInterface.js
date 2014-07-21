/*
	Lobby Interface Manager
	
	Manages the state of the game's network lobby UI.
	
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

function LobbyInterface(lobbyInterfaceContainer, networkClient)
{
	this.lobbyInterfaceContainer = lobbyInterfaceContainer;
	this.networkClient = networkClient;
	
	this.loadingScreen    = this.lobbyInterfaceContainer.find('.lobbyLoading');
	this.peerSelectScreen = this.lobbyInterfaceContainer.find('.lobbyPeerSelect');
	this.requestScreen    = this.lobbyInterfaceContainer.find('.lobbyRequest');
	this.statusText       = this.lobbyInterfaceContainer.find('.lobbyStatus');
	this.peerCount        = this.lobbyInterfaceContainer.find('.numPeers');
	this.peerList         = this.lobbyInterfaceContainer.find('.peerList');
	this.refreshPeerList  = this.lobbyInterfaceContainer.find('.refreshPeerList');
	this.clientIdDisplay  = this.lobbyInterfaceContainer.find('.clientID');
	this.peerIdDisplay    = this.lobbyInterfaceContainer.find('.peerID');
	this.acceptRequest    = this.lobbyInterfaceContainer.find('.acceptRequest');
	this.declineRequest   = this.lobbyInterfaceContainer.find('.declineRequest');
	
	//Wire up the lobby controls
	this.activateControls();
	
	//Show the initial loading screen
	this.showLoadingScreen('Connecting to server...');
}

LobbyInterface.prototype.setNetworkClient = function(networkClient)
{
	//Register our event listeners with the network client
	this.networkClient = networkClient;
	this.registerNetworkEventListeners();
}

LobbyInterface.prototype.setStatus = function(newText) {
	this.statusText.text(newText);
}

LobbyInterface.prototype.showRequestScreen = function(peerID)
{
	//Display the ID of the peer that sent the battle request
	this.peerIdDisplay.text(peerID);
	
	this.requestScreen.show();
	this.loadingScreen.hide();
	this.peerSelectScreen.hide();
}

LobbyInterface.prototype.showLoadingScreen = function(statusMessage)
{
	//If a status message was supplied, display it
	if (statusMessage !== undefined) {
		this.setStatus(statusMessage);
	}
	
	this.loadingScreen.show();
	this.peerSelectScreen.hide();
	this.requestScreen.hide();
}

LobbyInterface.prototype.connectToPeer = function(peerID)
{
	//Attempt to connect to the specified peer
	this.showLoadingScreen('Connecting to peer ' + peerID + '...');
	this.networkClient.connectToPeer(peerID);
}

LobbyInterface.prototype.showPeerList = function(peers)
{
	//If a new peer list has been supplied, replace any previous list
	if (peers !== undefined)
	{
		//Clear the existing list of peers on the UI
		this.peerList.empty();
		
		//Update the UI with the new list of peers
		var that = this;
		this.peerCount.text(peers.length);
		for (var peerIndex = 0; peerIndex < peers.length; ++peerIndex)
		{
			var currPeer = peers[peerIndex];
			var listItem = $(document.createElement('li')).text(currPeer);
			listItem.click(function() { that.connectToPeer(currPeer); });
			this.peerList.append(listItem);
		}
	}
	
	//Show the peer selection screen
	this.peerSelectScreen.show();
	this.loadingScreen.hide();
	this.requestScreen.hide();
}

LobbyInterface.prototype.getPeerList = function()
{
	this.showLoadingScreen('Requesting peer list from server...');
	
	//Retrieve the list of peers from the server
	var that = this;
	this.networkClient.retrievePeerList(function(peers)
	{
		//Show the peer selection screen
		that.setStatus('Peer list retrieved successfully');
		that.showPeerList(peers);
	});
}

LobbyInterface.prototype.activateControls = function()
{
	var that = this;
	
	//Click handler for the refresh peer list button
	this.refreshPeerList.click(function() {
		that.getPeerList();
	});
	
	//Click handler for the accept request button
	this.acceptRequest.click(function() {
		that.networkClient.acceptBattleRequest();
	});
	
	//Click handler for the decline request button
	this.declineRequest.click(function()
	{
		that.networkClient.declineBattleRequest();
		that.getPeerList();
	});
}

LobbyInterface.prototype.registerNetworkEventListeners = function()
{
	var that = this;
	
	//Upon establishing a connection to the server, request the list of peers
	this.networkClient.on(NetworkEvent.ServerConnected, function()
	{
		that.clientIdDisplay.text(that.networkClient.getClientID());
		that.getPeerList();
	});
	
	//When a connection is opened, update the status text
	this.networkClient.on(NetworkEvent.PeerConnected, function() {
		that.setStatus('Connection established with peer...');
	});
	
	//When a peer disconnects, return to the peer selection screen
	this.networkClient.on(NetworkEvent.PeerDisconnected, function()
	{
		that.setStatus('Peer disconnected');
		that.showPeerList();
	});
	
	//When a battle request is sent, show the loading screen
	this.networkClient.on(NetworkEvent.BattleRequestSent, function() {
		that.showLoadingScreen('Sending battle request to peer...');
	});
	
	//When a battle request is received, show the battle request screen
	this.networkClient.on(NetworkEvent.BattleRequestReceived, function(peerID) {
		that.showRequestScreen(peerID);
	});
	
	//When we accept a battle request, display the loading screen until the game begins
	this.networkClient.on(NetworkEvent.AcceptedPeerRequest, function(peerID) {
		that.showLoadingScreen('Accepted battle request, waiting for game to begin...');
	});
	
	//When a peer accepts our battle request, display the loading screen until the game begins
	this.networkClient.on(NetworkEvent.PeerAcceptedClientRequest, function(peerID) {
		that.showLoadingScreen('Peer accepted our battle request, waiting for game to begin...');
	});
}
