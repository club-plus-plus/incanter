/*
	Game State Manager
	
	Manages the game's state machine.
	
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

//Game states enum
window.GameState = {
	AwaitingWebcam:          'AwaitingWebcam',
	Error:                   'Error',
	NotPlaying:              'NotPlaying',
	ReadyUp:                 'ReadyUp',
	PlayerAttacking:         'PlayerAttacking',
	PlayerDefending:         'PlayerDefending',
	PlayerWaitingToDefend:   'PlayerWaitingToDefend',
	PlayerWaitingForDefence: 'PlayerWaitingForDefence',
	EndOfTurn:               'EndOfTurn',
	GameOver:                'GameOver'
};

//Transition events enum
window.GameStateTransition = {
	StartGame:               'StartGame',
	BeginAttack:             'BeginAttack',
	BeginDefend:             'BeginDefend',
	CompleteAttack:          'CompleteAttack',
	CompleteDefend:          'CompleteDefend',
	TurnCompleted:           'TurnCompleted',
	NextTurn:                'NextTurn',
	EndGame:                 'EndGame'
};

function GameStateManager()
{
	this.previousState = GameState.NotPlaying;
	this.currentState  = GameState.NotPlaying;
	
	//Data that is persistent across all states
	this.clientPlayer = new Player(0); 
	this.peerPlayer = new Player(0);
	
	this.stateObservers = [];
	this.transitionObservers = {};
}

//The target states and prerequisite states of the supported transition events
GameStateManager.prototype.transitionDetails = {
	
	//Starts the game after leaving the lobby
	StartGame:      {targetState: 'arg',                     prerequisites: ['NotPlaying']},
	
	//Enters the attack or defend state
	BeginAttack:    {targetState: 'PlayerAttacking',         prerequisites: ['ReadyUp']},
	BeginDefend:    {targetState: 'PlayerDefending',         prerequisites: ['PlayerWaitingToDefend']},
	
	//Completes the attack or defend state
	CompleteAttack: {targetState: 'PlayerWaitingForDefence', prerequisites: ['PlayerAttacking']},
	CompleteDefend: {targetState: 'EndOfTurn',               prerequisites: ['PlayerDefending']},
	
	//Completes the turn when the opponent completes their defend state
	TurnCompleted:  {targetState: 'EndOfTurn',               prerequisites: ['PlayerWaitingForDefence']},
	
	//Starts the next turn
	NextTurn:       {targetState: 'arg',                     prerequisites: ['EndOfTurn']},
	
	//Completes the game
	EndGame:        {targetState: 'GameOver',                prerequisites: []}
}

//Retrieves the client player object
GameStateManager.prototype.getClientPlayer = function() {
	return this.clientPlayer;
}

//Retrieves the peer player object
GameStateManager.prototype.getPeerPlayer = function() {
	return this.peerPlayer;
}

//Registers a new state observer
//[State observers implement the method gameStateChanged(prevState, currState)]
GameStateManager.prototype.addStateObserver = function(observer) {
	this.stateObservers.push(observer);
}

//Registers a new transition event observer
//[Transition event observers are instances of callable]
GameStateManager.prototype.addTransitionObserver = function(transitionName, observer)
{
	//We maintain a list of observers for each unique transition name
	if (this.transitionObservers[transitionName] === undefined) {
		this.transitionObservers[transitionName] = [];
	}
	
	this.transitionObservers[transitionName].push(observer);
}

//Retrieves the current state
GameStateManager.prototype.getCurrentState = function() {
	return this.currentState;
}

//Transitions from one state to another using a specific event
GameStateManager.prototype.performTransition = function(transitionName, transitionArgument)
{
	//Check that the specified transition name is valid
	var transition = this.transitionDetails[transitionName];
	if (transition === undefined) {
		throw 'Unknown game state transition event "' + transitionName + '"';
	}
	
	//Enforce the prerequisites of the transition event, if specified
	if (transition.prerequisites.length > 0 && transition.prerequisites.indexOf(this.currentState) === -1) {
		throw 'Attempted to perform transition "' + transitionName + '" from unsupported state "' + this.currentState + '"';
	}
	
	//Notify any registered transition observers prior to performing the state change
	if (this.transitionObservers[transitionName] !== undefined)
	{
		for (var observerIndex = 0; observerIndex < this.transitionObservers[transitionName].length; ++observerIndex) {
			this.transitionObservers[transitionName][observerIndex]();
		}
	}
	
	//Perform the transition
	var targetState = ((transition.targetState !== 'arg') ? transition.targetState : transitionArgument);
	this.setState(targetState);
}

//Sets the current state
GameStateManager.prototype.setState = function(newState)
{
	//Check that the specified state is valid
	if (newState === undefined || window.GameState[newState] === undefined) {
		return;
	}
	
	//Set the new state, keeping track of the previous state
	this.previousState = this.currentState;
	this.currentState  = newState;
	
	//Notify any registered state observers
    for (var observerIndex = 0; observerIndex < this.stateObservers.length; ++observerIndex)
	{
		var currObserver = this.stateObservers[observerIndex];
		if (currObserver.gameStateChanged !== undefined) {
			currObserver.gameStateChanged(this.previousState, this.currentState);
		}
	}
}
