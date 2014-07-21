/*
	User Interface State Manager
	
	Manages the state machine for the game's user interface.
	
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

//The list of UI states
window.UIState = {
	
	AwaitingWebcam: 'AwaitingWebcam',
	LobbyInterface: 'LobbyInterface',
	GameInterface:  'GameInterface',
	GameOverScreen: 'GameOverScreen',
	ErrorMessage:   'ErrorMessage'
	
};

function UIStateManager(gameEngine, uiElements)
{
	this.gameEngine   = gameEngine;
	this.uiElements   = uiElements;
	this.gameState    = this.gameEngine.getStateManager();
	
	//Keep track of both the current and previous UI state
	this.previousState = UIState.GameInterface;
	this.currentState  = UIState.GameInterface;
	
	//Create a no-op debug output object by default
	this.debugOutput = { update: function(time, deltaTime) {} };
	
	//Create no-op debug run loop callbacks by default
	this.debugRunLoopItemPre  = function() {};
	this.debugRunLoopItemPost = function() {};
	
	//Create the audio playback manager to coordinate sound clip playback
	this.audioManager = new AudioPlaybackManager();
	
	//Create the asset manager to coordinate loading of media assets
	this.assets = new AssetManager(this.audioManager);
	
	//Create the status indicators UI element manager
	this.statusIndicators = new GameStatusIndicators(this.gameEngine, this.uiElements, this.assets.getHotspotOverlayImages());
	
	//Create the lobby UI interface manager
	this.lobbyInterface = new LobbyInterface(this.uiElements.lobbyInterfaceContainer, this.gameEngine.getNetworkClient());
	
	//Create the peer media stream display consumer
	this.peerMediaDisplay = new PeerMediaStreamDisplay(this.gameEngine, this.uiElements.peerMediaStream.get(0));
	
	//Create the canvas-rendering components
	this.createCanvasRenderers();
	
	//Register the UI-related run loop items
	this.registerRunLoopItems();
	
	//Register error handlers
	this.registerErrorHandlers();
	
	//Register our game state observers
	this.registerGameStateObservers();
	
	//Register the window resize handler
	var that = this;
	$(window).resize(function() {
		that.resizeGameplayArea();
	});
	
	//Set the initial size of the gameplay area
	this.resizeGameplayArea();
	
	//Set the default state
	this.setState(UIState.AwaitingWebcam);
}

//Sets the current UI state
//(Note that this does not control the actual game state, but is rather a reflection of it)
UIStateManager.prototype.setState = function(newState)
{
	//If the network client has been created, perform deferred processing
	var networkClient = this.gameEngine.getNetworkClient();
	if (this.lobbyInterface.networkClient === undefined && networkClient !== undefined)
	{
		//Pass the network client to the lobby interface
		this.lobbyInterface.setNetworkClient(networkClient);
		
		//Register the timer tick handler
		this.gameEngine.turnLogic.addTickListener('state-countdown', function(timeRemaining, tag) {
			that.uiElements.timerCountdown.text( ((timeRemaining !== 0) ? '( ' + Math.floor(timeRemaining / 1000) + ' )' : '') );
		});
	}
	
	var that = this;
	var stateImplementations = {
		
		//UIState.AwaitingWebcam
		'AwaitingWebcam': function()
		{
			//Hide the other views
			that.uiElements.gameInterfaceContainer.hide();
			that.uiElements.errorMessageContainer.hide();
			that.uiElements.lobbyInterfaceContainer.hide();
			that.uiElements.gameOverScreenContainer.hide();
			
			//Show the 'awaiting webcam' message
			that.uiElements.awaitingWebcamContainer.show();
		},
		
		//UIState.LobbyInterface
		'LobbyInterface': function()
		{
			//Hide the other views
			that.uiElements.gameInterfaceContainer.hide();
			that.uiElements.errorMessageContainer.hide();
			that.uiElements.awaitingWebcamContainer.hide();
			that.uiElements.gameOverScreenContainer.hide();
			
			//Show the lobby interface container
			that.uiElements.lobbyInterfaceContainer.show();
		},
		
		//UIState.GameInterface
		//Displays the main game interface
		'GameInterface': function()
		{
			//Hide the other views
			that.uiElements.lobbyInterfaceContainer.hide();
			that.uiElements.errorMessageContainer.hide();
			that.uiElements.awaitingWebcamContainer.hide();
			that.uiElements.gameOverScreenContainer.hide();
			
			//Show the main game container
			that.uiElements.gameInterfaceContainer.show();
			
		},
		
		//UIState.GameOverScreen
		//Displays the 'Game Over' screen
		'GameOverScreen': function()
		{
			//Hide the other views
			that.uiElements.lobbyInterfaceContainer.hide();
			that.uiElements.errorMessageContainer.hide();
			that.uiElements.awaitingWebcamContainer.hide();
			that.uiElements.gameInterfaceContainer.hide();
			
			//Determine if we won or lost the game
			var playerHealth   = that.gameState.getClientPlayer().health;
			var opponentHealth = that.gameState.getPeerPlayer().health;
			var didWin = (playerHealth > opponentHealth);
			var endMessage = ((didWin) ? 'Victory! You have vanquished your foe!' : 'Defeat! Ruin! Woe! Misery!');
			
			//If we won, play the victory audio clip
			if (didWin === true) {
				that.audioManager.play('Victory');
			}
			
			//Show the 'Game Over' screen
			that.uiElements.gameOverScreenContainer.find('.endgameMessage').text(endMessage);
			that.uiElements.gameOverScreenContainer.show();
			
		},
		
		//UIState.ErrorMessage
		//Displays an error message
		'ErrorMessage': function()
		{
			//Hide the other views
			that.uiElements.gameInterfaceContainer.hide();
			that.uiElements.lobbyInterfaceContainer.hide();
			that.uiElements.awaitingWebcamContainer.hide();
			that.uiElements.gameOverScreenContainer.hide();
			
			//Show the error message container
			that.uiElements.errorMessageContainer.show();
		}
	};
	
	//If the requested state is valid, transition to it
	if (stateImplementations[newState] !== undefined)
	{
		stateImplementations[newState]();
		this.previousState = this.currentState;
		this.currentState = newState;
	}
}

UIStateManager.prototype.displayError = function(error)
{
	this.uiElements.errorMessageContainer.find('.errorMessageContent').text(error);
	this.setState(UIState.ErrorMessage);
}

//Enables debug output, using the specified HTML element for output
UIStateManager.prototype.enableDebugOutput = function(containerElem, outputElem, blendedImageCanvas) {
	this.debugOutput = new DebugOutput(containerElem, outputElem.get(0), blendedImageCanvas.get(0));
}

//Enables debug controls, using the specified HTML button elements
UIStateManager.prototype.enableDebugControls = function(btnResetAccumulation, btnGenerateSpell, chkUseGrid, chkRenderRects, chkRenderOutlines, chkRenderCounts)
{
	//Wire up the debug control click events
	var that = this;
	
	btnResetAccumulation.click(function()
	{
		//Reset the accumulated motion counts for all motion hotspots
		that.gameEngine.motionAccumulator.resetAccumulatedMotion();
	});
	
	btnGenerateSpell.click(function()
	{
		//Test the spell generation functionality
		alert(JSON.stringify(that.gameEngine.getSpellBook().generateSpell( that.gameEngine.getAccumulatedMotion() )));
	});
	
	//Enable the debug run loop callbacks
	
	this.debugRunLoopItemPre = function()
	{
		//Enable debug motion detection visualisation, if requested
		that.debugMotion.setEnabled( chkRenderRects.is(':checked') );
	};
	
	this.debugRunLoopItemPost = function()
	{
		//Render hotspot outlines, if enabled
		if (chkRenderOutlines.is(':checked')) {
			that.debugMotion.outlineRegisteredHotspots( that.gameEngine.getMotionHotspots() );
		}
		
		//Render hotspot accumulated motion counts, if enabled
		if (chkRenderCounts.is(':checked')) {
			that.debugMotion.drawHotspotAccumulationCounts( that.gameEngine.getMotionHotspots(), that.gameEngine.getAccumulatedMotion() );
		}
	};
}

UIStateManager.prototype.createCanvasRenderers = function()
{
	//Create a a video consumer to render webcam video to a canvas
	this.webcamVideoRenderer = new CanvasRendererVideoConsumer(this.uiElements.webcamVideoCanvas.get(0));
	this.gameEngine.registerContentConsumer(this.webcamVideoRenderer);
	
	//Create a canvas-rendering audio volume display
	this.volumeRenderer = new VolumeLevelRenderer(this.gameEngine.getAudioVolumeMonitor(), this.uiElements.audioVolumeCanvas.get(0));
	
	//Create the overlay compositing manager
	this.overlay = new OverlayCompositingManager(this.uiElements.compositingOverlayCanvas.get(0));
	
	//Create the hotspot icon overlay
	this.hotspotIconOverlay = new ImageOverlayMotionObserver(this.overlay, this.gameEngine.getMotionHotspots(), this.assets.getHotspotOverlayImages(), this.assets.getSpellCastImages());
	this.gameEngine.registerMotionObserver(this.hotspotIconOverlay);
	
	//Create the debug motion detection visualiser
	this.debugMotion = new DebugMotionVisualiser(this.uiElements.webcamVideoCanvas.get(0), this.gameEngine.getGameSettings().gridRows, this.gameEngine.getGameSettings().gridColumns);
	this.gameEngine.registerMotionObserver(this.debugMotion);
}

UIStateManager.prototype.registerRunLoopItems = function()
{
	var that = this;
	
	//Register the pre-processing run loop items
	this.gameEngine.registerPreProcessingRunItem(function(timestamp, deltaTime)
	{
		//Clear the overlay
		that.overlay.clear();
		
		//Perform motion decay in the hotspot icon overlay
		that.hotspotIconOverlay.decayMotionLevels();
		
		//Perform the debug run loop item, if enabled
		that.debugRunLoopItemPre();
	});
	
	//Register the post-processing run loop items
	this.gameEngine.registerPostProcessingRunItem(function(timestamp, deltaTime)
	{
		//Perform the debug run loop item, if enabled
		that.debugRunLoopItemPost();
		
		//Determine if motion detection is enabled
		var motionEnabled = that.gameEngine.motionDetection.isEnabled();
		
		//Update and render everything
		that.volumeRenderer.update();
		that.hotspotIconOverlay.renderOverlay(motionEnabled);
		that.statusIndicators.update();
		that.debugOutput.update(timestamp, deltaTime);
		
		//If we have just cast a spell and are awaiting the opponent's defence, render the image overlay
		var currState = that.gameState.getCurrentState();
		if (currState === GameState.PlayerWaitingForDefence || currState === GameState.EndOfTurn) {
			that.hotspotIconOverlay.renderSpellCastImage( that.gameState.getClientPlayer().lastSpell, deltaTime );
		}
	});
}

UIStateManager.prototype.registerErrorHandlers = function()
{
	//Register the error handler for audio playback errors
	var that = this;
	this.audioManager.error(function(e) { that.displayError('Audio error: ' + JSON.stringify(e)); });
}

UIStateManager.prototype.gameStateChanged = function(prevState, currState)
{
	//If we are in a non-game playing state, display the correct overlay
	if (currState === GameState.AwaitingWebcam)
	{
		//Display the awaiting webcam message
		this.setState(UIState.AwaitingWebcam);
	}
	else if (currState === GameState.Error)
	{
		//Display the error message
		this.displayError(this.gameEngine.getLastError());
	}
	else if (currState === GameState.NotPlaying)
	{
		//Display the lobby
		this.setState(UIState.LobbyInterface);
	}
	else if (currState === GameState.GameOver)
	{
		//Display the 'Game Over' screen
		this.setState(UIState.GameOverScreen);
	}
	else
	{
		//Display the gameplay interface
		this.setState(UIState.GameInterface);
		
		//Retrieve the last spells cast by both the player and the opponent
		var playerSpell   = this.gameState.getClientPlayer().lastSpell;
		var opponentSpell = this.gameState.getPeerPlayer().lastSpell;
		
		//Determine the primary element in the player's last spell
		var spellElement = ((playerSpell === null) ? 'fizzle' : playerSpell.elems[0].toLowerCase());
		
		//The status messages for each turn state
		var stateStatusMessages = {
			ReadyUp:                 'Prepare to craft your attack spell...',
			PlayerAttacking:         'Craft your attack spell!',
			PlayerDefending:         'Craft your defence spell! ' + (opponentSpell === null ? '(Opponent spell fizzled)' : '(Opponent cast ' + opponentSpell.name + ', intensity ' + opponentSpell.intensity + ')'),
			PlayerWaitingToDefend:   'Prepare to defend...',
			PlayerWaitingForDefence: (playerSpell === null ? 'Your spell fizzled!' : 'You cast ' + playerSpell.name + ', intensity ' + playerSpell.intensity + '!') + ' Awaiting opponent defence...',
			EndOfTurn:               'Turn complete'
		}
		
		//The audio clips for each turn state
		var stateAudioClips = {
			ReadyUp:                 'ReadyUp',
			PlayerAttacking:         'PlayerAttacking',
			PlayerDefending:         'PlayerDefending',
			PlayerWaitingToDefend:   'PlayerWaitingToDefend',
			PlayerWaitingForDefence: spellElement,
			EndOfTurn:               'EndOfTurn'
		};
		
		//If a status message is defined for the current state, display it
		if (stateStatusMessages[currState] !== undefined) {
			this.uiElements.stateStatusText.text(stateStatusMessages[currState]);
		}
		
		//If an audio clip is defined for the current state, play it
		if (stateAudioClips[currState] !== undefined && stateAudioClips[currState] !== null) {
			this.audioManager.play(stateAudioClips[currState], false);
		}
	}
}

UIStateManager.prototype.registerGameStateObservers = function()
{
	var that = this;
	
	//When the game starts, show the game interface
	this.gameState.addTransitionObserver(GameStateTransition.StartGame, function()
	{
		that.setState(UIState.GameInterface);
		that.audioManager.play('begin');
	});
	
	//When the game ends, play the corresponding sound
	this.gameState.addTransitionObserver(GameStateTransition.EndGame, function() {
		that.audioManager.play('end');
	});
	
	//When our defend state ends, play the corresponding sound
	this.gameState.addTransitionObserver(GameStateTransition.CompleteDefend, function()
	{
		if (that.gameState.getPeerPlayer().lastSpell !== null) {
			that.audioManager.play('damage');
		}
	});
	
	//Register our general-purpose state change observer
	this.gameState.addStateObserver(this);
}

UIStateManager.prototype.resizeGameplayArea = function()
{
	//Calculate the height of the gameplay area
	var gameplayAreaHeight = this.uiElements.gameInterfaceContainer.innerHeight() - this.uiElements.stateStatusText.outerHeight();
	this.uiElements.gameplayArea.css('height', gameplayAreaHeight + 'px');
	
	//Resize the video display
	this.uiElements.overlayContainer.css('height', gameplayAreaHeight + 'px');
	this.uiElements.overlayContainer.css('width', gameplayAreaHeight + 'px');
	this.uiElements.webcamVideoCanvas.css('height', gameplayAreaHeight + 'px');
	this.uiElements.webcamVideoCanvas.css('width', gameplayAreaHeight + 'px');
	this.uiElements.compositingOverlayCanvas.css('height', gameplayAreaHeight + 'px');
	this.uiElements.compositingOverlayCanvas.css('width', gameplayAreaHeight + 'px');
	this.uiElements.audioVolumeCanvas.css('height', gameplayAreaHeight + 'px');
}
