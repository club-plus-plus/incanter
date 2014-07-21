<!DOCTYPE html>
<html>
	<head>
		<title>Incanter Client</title>
		
		<meta http-equiv="Content-Type" content="text/html;charset=UTF-8" />
		
		<link href='http://fonts.googleapis.com/css?family=Philosopher:400,700' rel='stylesheet' type='text/css'>
		<link href='http://fonts.googleapis.com/css?family=Roboto+Condensed:400,300,700' rel='stylesheet' type='text/css'>
		<link href='http://fonts.googleapis.com/css?family=Open+Sans:400,300,600,700' rel='stylesheet' type='text/css'>
		<link href='http://fonts.googleapis.com/css?family=Dosis:400,300,600' rel='stylesheet' type='text/css'>
		<link rel="stylesheet" type="text/css" href="./css/ui.css" media="screen">
		
		<!-- Third-party JS components -->
		<script type="text/javascript" src="./js/thirdparty/jquery-1.11.0.min.js"></script>
		<script type="text/javascript" src="./js/thirdparty/peer.js"></script>
		
		<!-- Core JS components -->
		<script type="text/javascript" src="./js/core/RunLoopManager.js"></script>
		<script type="text/javascript" src="./js/core/MediaContentProducer.js"></script>
		<script type="text/javascript" src="./js/core/AudioVolumeConsumer.js"></script>
		<script type="text/javascript" src="./js/core/MotionDetectionConsumer.js"></script>
		<script type="text/javascript" src="./js/core/HotspotMotionAccumulator.js"></script>
		<script type="text/javascript" src="./js/core/TimerManager.js"></script>
		
		<!-- Networking JS components -->
		<script type="text/javascript" src="./js/network/NetworkProtocol.js"></script>
		<script type="text/javascript" src="./js/network/NetworkClient.js"></script>
		
		<!-- Game logic JS components -->
		<script type="text/javascript" src="./js/gamelogic/SpellBook.js"></script>
		<script type="text/javascript" src="./js/gamelogic/Player.js"></script>
		<script type="text/javascript" src="./js/gamelogic/GameStateManager.js"></script>
		<script type="text/javascript" src="./js/gamelogic/TurnLogic.js"></script>
		<script type="text/javascript" src="./js/gamelogic/GameEngine.js"></script>
		
		<!-- UI JS components -->
		<script type="text/javascript" src="./js/ui/AssetManager.js"></script>
		<script type="text/javascript" src="./js/ui/CanvasRendererVideoConsumer.js"></script>
		<script type="text/javascript" src="./js/ui/AudioPlaybackManager.js"></script>
		<script type="text/javascript" src="./js/ui/VolumeLevelRenderer.js"></script>
		<script type="text/javascript" src="./js/ui/OverlayCompositingManager.js"></script>
		<script type="text/javascript" src="./js/ui/ImageOverlayMotionObserver.js"></script>
		<script type="text/javascript" src="./js/ui/GameStatusIndicators.js"></script>
		<script type="text/javascript" src="./js/ui/DebugMotionVisualiser.js"></script>
		<script type="text/javascript" src="./js/ui/DebugOutput.js"></script>
		<script type="text/javascript" src="./js/ui/LobbyInterface.js"></script>
		<script type="text/javascript" src="./js/ui/PeerMediaStreamDisplay.js"></script>
		<script type="text/javascript" src="./js/ui/UIStateManager.js"></script>
		
		<script type="text/javascript">
			
			$(document).ready(function()
			{
				//Game settings
				window.gameSettings = {
					
					//Server settings
					serverIP:   '<?php echo $_SERVER['HTTP_HOST']; ?>',
					serverPort: 9000,
					serverPath: '/incanter',
					
					//DEBUG: grid size settings
					gridRows:    20,
					gridColumns: 20,
					
					//Motion detection settings
					motionDetectionThreshold: 20,
					accumulatedMotionDecay:   1,
					
					//Sound volume threshold settings
					audioTriggerMin: 0.2,
					audioTriggerMax: 1.0,
					
					//State duration settings (in milliseconds)
					durationReadyUp:   4000,
					durationAttacking: 8000,
					durationDefending: 8000,
					durationTurnOver:  6000
				};
				
				//Create the game engine, which holds all of the non-UI components
				window.gameEngine = new GameEngine(window.gameSettings);
				
				//Create the UI state manager
				window.uiState = new UIStateManager(window.gameEngine, {
					
					awaitingWebcamContainer:  $('#awaitingWebcamContainer'),
					lobbyInterfaceContainer:  $('#lobbyInterfaceContainer'),
					errorMessageContainer:    $('#errorMessageContainer'),
					gameInterfaceContainer:   $('#gameInterfaceContainer'),
					gameOverScreenContainer:  $('#gameOverScreenContainer'),
					overlayContainer:         $('#overlayContainer'),
					webcamVideoCanvas:        $('#vidCanvas'),
					audioVolumeCanvas:        $('#audioVolume'),
					compositingOverlayCanvas: $('#overlayCanvas'),
					elementStatusTable:       $('#charges tbody'),
					stateStatusText:          $('#stateStatusText .statusText'),
					timerCountdown:           $('#stateStatusText .timerCountdown'),
					peerMediaStream:          $('#peerMediaStream'),
					playerHealth:             $('#playerHealth'),
					opponentHealth:           $('#opponentHealth'),
					gameplayArea:             $('#gameplayArea')
					
				});
				
				//Enable debug output
				window.uiState.enableDebugOutput( $('#debugContainer'), $('#debug'), $('#blendedImage') );
				
				//Enable the debug controls
				window.uiState.enableDebugControls(
					$('#resetAccumulation'),
					$('#generateSpell'),
					$('#doUseGrid'),
					$('#doRenderRectangles'),
					$('#doRenderOutlines'),
					$('#doRenderCounts')
				);
				
				//Start the game
				window.gameEngine.start();
			});
			
		</script>
	</head>
	
	<body>
		
		<div id="gameOverScreenContainer" class="fullscreenOverlay">
			<div id="gameOverScreen" class="overlayWindow">
				<h1>Game Over</h1>
				<h2 class="endgameMessage">Victory or defeat message</h2>
			</div>
		</div>
		
		<div id="awaitingWebcamContainer" class="fullscreenOverlay">
			<div id="awaitingWebcam" class="overlayWindow">
				<h2>Allow webcam access to continue</h2>
			</div>
		</div>
		
		<div id="lobbyInterfaceContainer" class="fullscreenOverlay">
			<div id="lobbyInterface" class="overlayWindow">
				
				<h1>Incanter Local Network Lobby</h1>
				
				<div class="lobbyLoading">
					<img class="progress" src="./assets/images/progress.png" alt="Loading">
				</div>
				
				<div class="lobbyPeerSelect">
					
					<h2>Select a peer to connect to (<span class="numPeers">N</span> found)</h2>
					<ul class="peerList"></ul>
					<button class="refreshPeerList">Refresh list</button>
					
				</div>
				
				<div class="lobbyRequest">
					
					<h2>Received a battle request from peer with id <em class="peerID">ID</em></h2>
					<p><button class="acceptRequest">Accept</button> <button class="declineRequest">Decline</button></p>
					
				</div>
				
				<p class="clientIDContainer">Client ID: <strong class="clientID">requesting from server</strong></p>
				<p class="lobbyStatus">Connecting to server</p>
			</div>
		</div>
		
		<div id="errorMessageContainer" class="fullscreenOverlay">
			<div id="errorMessage" class="overlayWindow">
				
				<h1>Error</h1>
				
				<h2 class="errorMessageContent">Uncaught exception, no details captured</h2>
				
			</div>
		</div>
		
		<div id="gameInterfaceContainer">
			
			<h1 id="stateStatusText"><span class="statusText">STATE STATUS TEXT</span> <span class="timerCountdown"></span></h1>
			
			<div id="gameplayArea">
				<div id="volumeContainer">
					<canvas id="audioVolume" style="background-color: black;"></canvas>
				</div>
				
				<div id="overlayContainer">
					
					<canvas id="vidCanvas"></canvas>
					<canvas id="overlayCanvas"></canvas>
					
				</div>
				
				<div id="gameStatusIndicators">
					
					<video id="peerMediaStream"></video>
					
					<p>Player HP: <span id="playerHealth">?</span></p>
					<p>Opponent HP: <span id="opponentHealth">?</span></p>
					
					<table id="charges"><tbody></tbody></table>
					
				</div>
			</div>
			
			<div id="debugContainer">
				<pre id="debug"></pre>
				
				<div id="debugControls">
					
					<p>
						<label><input type="checkbox" id="doRenderRectangles"> Render motion rectangles</label><br>
						<label><input type="checkbox" id="doRenderCounts"> Render accumulation counts</label><br>
						<label><input type="checkbox" id="doRenderOutlines"> Render hotspot outlines</label><br>
					</p>
					
					<p>
						<button id="resetAccumulation">Reset Accumulation Counts</button><br>
						<button id="generateSpell">Generate Spell</button><br>
					</p>
					
					<p>
						<canvas id="blendedImage"></canvas>
					</p>
					
				</div>
			</div>
			
		</div>
		
	</body>
</html>