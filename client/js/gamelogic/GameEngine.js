/*
	Game Engine
	
	Manages the core logic of the game, and serves as a central point of control
	for the many smaller classes that handle game logic details.
	
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

function GameEngine(gameSettings)
{
	//Keep a reference to the game settings object
	this.gameSettings = gameSettings;
	
	//Keep track of the most recent error message
	this.lastError = null;
	
	//Create the game state manager and register ourself as a state observer
	this.gameState = new GameStateManager();
	this.gameState.addStateObserver(this);
	
	//Create the run loop
	this.runLoop = new RunLoopManager();
	
	//Create a content producer to coordinate consumers of webcam image frame data and audio sample data
	this.contentProducer = new MediaContentProducer(true);
	
	//Create the motion detection consumer, but defer registration with the content producer until later
	this.motionDetection = new MotionDetectionConsumer(this.gameSettings.gridRows, this.gameSettings.gridColumns, this.gameSettings.motionDetectionThreshold);
	this.motionDetection.setGridEnabled(false);
	
	//Create the motion accumulator to keep track of accumulated motion in hotspots
	this.motionAccumulator = new HotspotMotionAccumulator(this.gameSettings.accumulatedMotionDecay);
	this.motionDetection.addObserver(this.motionAccumulator);
	
	//Create the spellbook
	this.spellBook = new SpellBook();
	
	//Create the player state object
	this.player = new Player();
	
	//Defer creation of the network client and turn logic until we have the webcam stream
	
	//Create the audio volume monitor and register it with the content producer
	this.volumeMonitor = new AudioVolumeConsumer(this.gameSettings.audioTriggerMin, this.gameSettings.audioTriggerMax);
	this.contentProducer.addConsumer(this.volumeMonitor);
	
	//The list of consumers interested in the peer's media stream
	this.peerMediaStreamConsumers = [];
	
	//The list of callbacks that run each frame, prior to engine processing
	this.preProcessingCallbacks = [];
	
	//The list of callbacks that run each frame, after engine processing
	this.postProcessingCallbacks = [];
	
	//Register the game's motion hotspots
	this.registerHotspots();
	
	//Register our internal error handlers
	this.registerErrorHandlers();
}

//Retrieves the most recent engine error
GameEngine.prototype.getLastError = function() {
	return this.lastError;
}

//Retrieves the most recently cast spell
GameEngine.prototype.getLastSpellCast = function() {
	return this.turnLogic.getLastSpellCast();
}

//Registers a callback to be notified when the peer's media stream becomes available
GameEngine.prototype.registerPeerMediaStreamConsumer = function(consumer) {
	this.peerMediaStreamConsumers.push(consumer);
}

//Registers a content consumer with the content producer
GameEngine.prototype.registerContentConsumer = function(consumer) {
	this.contentProducer.addConsumer(consumer);
}

//Registers a motion observer with the motion detection coordinator
GameEngine.prototype.registerMotionObserver = function(observer) {
	this.motionDetection.addObserver(observer);
}

//Registers a callback to run each frame, prior to engine processing
GameEngine.prototype.registerPreProcessingRunItem = function(callback) {
	this.preProcessingCallbacks.push(callback);
}

//Registers a callback to run each frame, after engine processing
GameEngine.prototype.registerPostProcessingRunItem = function(callback) {
	this.postProcessingCallbacks.push(callback);
}

//Enables or disables access to the media content streams
GameEngine.prototype.setContentStreamsEnabled = function(enabled) {
	this.contentProducer.setEnabled((enabled === true));
}

//Enables access to the media content streams
GameEngine.prototype.enableContentStreams = function() {
	this.setContentStreamsEnabled(true);
}

//Disables access to the media content streams
GameEngine.prototype.disableContentStreams = function() {
	this.setContentStreamsEnabled(false);
}

//Enables or disables motion detection
GameEngine.prototype.setMotionDetectionEnabled = function(enabled) {
	this.motionDetection.setEnabled((enabled === true));
}

//Enables motion detection
GameEngine.prototype.enableMotionDetection = function() {
	this.setMotionDetectionEnabled(true);
}

//Disables motion detection
GameEngine.prototype.disableMotionDetection = function() {
	this.setMotionDetectionEnabled(false);
}

//Retrieves the game settings object
GameEngine.prototype.getGameSettings = function() {
	return this.gameSettings;
}

//Retrieves the network client object
GameEngine.prototype.getNetworkClient = function() {
	return this.networkClient;
}

//Retrieves the game state manager
GameEngine.prototype.getStateManager = function() {
	return this.gameState;
}

//Retrieves the audio volume monitor, for querying the current audio volume
GameEngine.prototype.getAudioVolumeMonitor = function() {
	return this.volumeMonitor;
}

//Retrieves the game's spell book
GameEngine.prototype.getSpellBook = function() {
	return this.spellBook;
}

//Retrieves the list of motion detection hotspots
GameEngine.prototype.getMotionHotspots = function() {
	return this.motionDetection.getHotspotList();
}

//Retrieves the accumulated motion counts for all motion detection hotspots
GameEngine.prototype.getAccumulatedMotion = function() {
	return this.motionAccumulator.getAccumulatedMotion();
}

GameEngine.prototype.scheduleRunLoopItems = function(callbacks)
{
	for (var callbackIndex = 0; callbackIndex < callbacks.length; ++callbackIndex) {
		this.runLoop.scheduleCallback(callbacks[callbackIndex]);
	}
}

GameEngine.prototype.registerHotspots = function()
{
	//Register element hotspots
	this.motionDetection.registerHotspots([
		{name: SpellBook.prototype.Elements.Water,  x:0,      y:0.7,    w:0.25, h:0.25},
		{name: SpellBook.prototype.Elements.Fire,   x:0.05,   y:0.35,   w:0.25, h:0.25},
		{name: SpellBook.prototype.Elements.Light,  x:0.225,  y:0.025,  w:0.25, h:0.25},
		{name: SpellBook.prototype.Elements.Dark,   x:0.525,  y:0.025,  w:0.25, h:0.25},
		{name: SpellBook.prototype.Elements.Air,    x:0.7,    y:0.35,   w:0.25, h:0.25},
		{name: SpellBook.prototype.Elements.Earth,  x:0.75,   y:0.7,    w:0.25, h:0.25}
	]);
	
	//Set mutually-exclusive element pairs
	var opposingElems = this.spellBook.getOpposingElementMappings();
	var elems = Object.keys(opposingElems);
	for (var elemIndex = 0; elemIndex < elems.length; ++elemIndex) {
		this.motionAccumulator.addMutuallyExclusivePair(elems[elemIndex], opposingElems[ elems[elemIndex] ]);
	}
}

GameEngine.prototype.registerErrorHandlers = function()
{
	var that = this;
	
	//Register the run loop error handler
	this.runLoop.error(function(e)
	{
		that.lastError = e;
		that.gameState.setState(GameState.Error);
	});
	
	//Register the content producer error handler
	this.contentProducer.error(function()
	{
		that.lastError = 'Failed to acquire media streams';
		that.gameState.setState(GameState.Error);
	});
}

GameEngine.prototype.gameStateChanged = function(prevState, currState)
{
	//Reset all accumulated motion counts on state change
	this.motionAccumulator.resetAccumulatedMotion();
}

//Starts the game
GameEngine.prototype.start = function()
{
	//Only schedule the run loop items once the webcam is available
	var that = this;
	this.contentProducer.mediaAvailable(function(stream)
	{
		//Perform deferred creation of the network client and turn logic manager now we have the webcam media stream
		that.networkClient = new NetworkClient(that.gameSettings.serverIP, that.gameSettings.serverPort, that.gameSettings.serverPath, stream, that.gameState);
		that.turnLogic = new TurnLogic(that.gameSettings, that.gameState, that.spellBook, that.motionAccumulator, that.networkClient);
		
		//Provide the peer's media stream to any registered consumers when it becomes available
		that.networkClient.on(NetworkEvent.PeerMediaStreamAvailable, function(peerStream)
		{
			for (var consumerIndex = 0; consumerIndex < that.peerMediaStreamConsumers.length; ++consumerIndex)
			{
				if (that.peerMediaStreamConsumers[consumerIndex].peerMediaStreamAvailable !== undefined) {
					that.peerMediaStreamConsumers[consumerIndex].peerMediaStreamAvailable(peerStream);
				}
			}
		});
		
		//If a peer disconnects during gameplay, change to the error state
		that.networkClient.on(NetworkEvent.PeerDisconnected, function()
		{
			//Check that we are in a gameplay state
			var currState = that.gameState.getCurrentState();
			if (currState !== GameState.AwaitingWebcam && currState !== GameState.NotPlaying && currState !== GameState.Error)
			{
				that.lastError = 'Peer disconnected during turn';
				that.gameState.setState(GameState.Error);
			}
		});
		
		//Perform deferred registration of the motion detection consumer with the content producer
		//(This ensures that motion detection is performed last, preventing the render results of
		// any registered motion observers from being overwritten by other content consumers)
		that.contentProducer.addConsumer(that.motionDetection);
		
		//Register the pre-processing run loop items
		that.scheduleRunLoopItems(that.preProcessingCallbacks);
		
		//Register our main processing function
		that.runLoop.scheduleCallback(function(timestamp, deltaTime)
		{
			//Enable or disable motion detection based on state and audio threshold
			var currState = that.gameState.getCurrentState();
			var motionEnabled = (currState === GameState.PlayerAttacking || currState === GameState.PlayerDefending);
			motionEnabled = motionEnabled && that.volumeMonitor.isInTriggerZone();
			that.setMotionDetectionEnabled(motionEnabled);
			
			that.motionAccumulator.setFrameDeltaTime(deltaTime);
			that.contentProducer.update();
			that.turnLogic.update(deltaTime);
		});
		
		//Register the post-processing run loop items
		that.scheduleRunLoopItems(that.postProcessingCallbacks);
		
		//Set the game state to display the network lobby
		that.gameState.setState(GameState.NotPlaying);
	});
	
	//Set the initial game state
	this.gameState.setState(GameState.AwaitingWebcam);
	
	//Acquire the webcam video and audio streams
	this.contentProducer.acquireMedia();
}
