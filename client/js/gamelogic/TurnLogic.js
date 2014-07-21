/*
	Turn Logic Manager
	
	Manages the battle logic for each turn, and powers turn-based state transitions.
	
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

function TurnLogic(gameSettings, gameState, spellBook, motionAccumulator, networkClient)
{
	this.gameSettings      = gameSettings;
	this.gameState         = gameState;
	this.spellBook         = spellBook;
	this.motionAccumulator = motionAccumulator;
	this.networkClient     = networkClient;
	
	//Our internal timers
	this.timers = new TimerManager();
	
	//Register our game state observer
	this.gameState.addStateObserver(this);
	
	//Register our transition observers
	this.registerStateTransitionObservers();
	
	//Register our network event listeners
	this.registerNetworkEventListeners();
}

//Registers a new timer tick listener for the specified tag (use '*' for all timers)
//[Tick listeners are instances of callable that take the arguments(timeRemaining, tag)]
TurnLogic.prototype.addTickListener = function(tag, listener) {
	this.timers.addTickListener(tag, listener);
}

//Triggers casting a spell as a result of player incantation instead of timer firing
TurnLogic.prototype.castSpellIncantation = function()
{
	//Check that we are in the attack or defend state
	var currState = this.gameState.getCurrentState();
	if (currState === GameState.PlayerAttacking || currState === GameState.PlayerDefending)
	{
		//Cancel the countdown timer and trigger the transition immediately
		this.timers.cancelTimer('state-countdown');
		var transition = ((currState === GameState.PlayerAttacking) ? GameStateTransition.CompleteAttack : GameStateTransition.CompleteDefend);
		this.gameState.performTransition(transition);
	}
}

TurnLogic.prototype.setStateCompletionTimer = function(duration, transitionName, transitionData)
{
	var that = this;
	this.timers.setTimer('state-countdown', duration, function() {
		that.gameState.performTransition(transitionName, transitionData);
	});
}

TurnLogic.prototype.calculateDamage = function()
{
	//Retrieve the opponent's spell and our counter-spell
	var opponentSpell = this.gameState.getPeerPlayer().lastSpell;
	var playerSpell = this.gameState.getClientPlayer().lastSpell;
	
	//Calculate damage and apply to the player
	var damageInflicted = this.spellBook.calculateDamage(opponentSpell, playerSpell);
	this.gameState.getClientPlayer().inflictDamage(damageInflicted);
}

TurnLogic.prototype.gameStateChanged = function(prevState, currState)
{
	switch (currState)
	{
		//Not playing (currently in the network lobby)
		case GameState.NotPlaying:
		{
			//Cancel all timers, turn not in progress
			this.timers.cancelAllTimers();
			break;
		}
		
		//Error
		case GameState.Error:
		{
			//Cancel all timers, turn not in progress
			this.timers.cancelAllTimers();
			break;
		}
		
		//Preparing to enter attack state (time-bound)
		case GameState.ReadyUp:
		{
			//Activate the timer for completion of this state
			this.setStateCompletionTimer(this.gameSettings.durationReadyUp, GameStateTransition.BeginAttack);
			break;
		}
		
		//Attack state (time-bound)
		case GameState.PlayerAttacking:
		{
			//Activate the timer for completion of this state
			this.setStateCompletionTimer(this.gameSettings.durationAttacking, GameStateTransition.CompleteAttack);
			break;
		}
		
		//Defend state (time-bound)
		case GameState.PlayerDefending:
		{
			//Activate the timer for completion of this state
			this.setStateCompletionTimer(this.gameSettings.durationDefending, GameStateTransition.CompleteDefend);
			break;
		}
		
		//Preparing to enter defend state (network-bound)
		case GameState.PlayerWaitingToDefend: {
			break;
		}
		
		//Waiting for opponent to complete defend state (network-bound)
		case GameState.PlayerWaitingForDefence: {
			break;
		}
		
		//Turn complete (time-bound)
		case GameState.EndOfTurn:
		{
			//Determine if the game is over
			var playerHealth   = this.gameState.getClientPlayer().health;
			var opponentHealth = this.gameState.getPeerPlayer().health;
			if (playerHealth === 0 || opponentHealth === 0)
			{
				//Game over, set timer for final transition, indicating if we won or not
				this.setStateCompletionTimer(this.gameSettings.durationTurnOver, GameStateTransition.EndGame, (playerHealth > opponentHealth));
			}
			else
			{
				//Determine if we are attacking or defending in the next turn
				var nextState = ((prevState === GameState.PlayerDefending) ? GameState.ReadyUp : GameState.PlayerWaitingToDefend);
				
				//Activate the timer for completion of this state
				this.setStateCompletionTimer(this.gameSettings.durationTurnOver, GameStateTransition.NextTurn, nextState);
			}
			break;
		}
	}
}

TurnLogic.prototype.registerStateTransitionObservers = function()
{
	var that = this;
	
	//When our attack state is complete, transmit the generated spell to the peer
	this.gameState.addTransitionObserver(GameStateTransition.CompleteAttack, function()
	{
		//Generate our spell from the accumulated motion data and transmit it to the peer
		var spellCast = that.spellBook.generateSpell( that.motionAccumulator.getAccumulatedMotion() );
		that.gameState.getClientPlayer().setLastSpell(spellCast);
		that.networkClient.castSpell();
	});
	
	//When our defend state is complete, transmit a 'turn complete' message to the peer
	this.gameState.addTransitionObserver(GameStateTransition.CompleteDefend, function()
	{
		//Calculate the damage inflicted by the opponent's spell, and transmit it to the peer
		that.calculateDamage();
		that.networkClient.signalTurnComplete();
	});
}

TurnLogic.prototype.registerNetworkEventListeners = function()
{
	var that = this;
	
	//When the game starts because we accepted a battle request, we are defending
	this.networkClient.on(NetworkEvent.AcceptedPeerRequest, function() {
		that.gameState.performTransition(GameStateTransition.StartGame, GameState.PlayerWaitingToDefend);
	});
	
	//When the game starts because the peer accepted our battle request, we are attacking
	this.networkClient.on(NetworkEvent.PeerAcceptedClientRequest, function() {
		that.gameState.performTransition(GameStateTransition.StartGame, GameState.ReadyUp);
	});
	
	//When the opponent casts a spell, we begin defending
	this.networkClient.on(NetworkEvent.PeerCastSpell, function(spell)
	{
		that.lastOpponentSpell = spell;
		that.gameState.performTransition(GameStateTransition.BeginDefend);
	});
	
	//When the opponent completes their defend state, the turn is over
	this.networkClient.on(NetworkEvent.TurnOver, function() {
		that.gameState.performTransition(GameStateTransition.TurnCompleted);
	});
}

TurnLogic.prototype.update = function(deltaTime)
{
	this.timers.tick(deltaTime);
}
