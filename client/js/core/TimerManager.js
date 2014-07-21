/*
	Timer Manager
	
	Manages named timers that are driven by the game loop's delta time increments.
	
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

function TimerManager()
{
	this.timers = {};
	this.timerListeners = {};
}

//Sets a timer with the specified tag
TimerManager.prototype.setTimer = function(tag, milliseconds, callback)
{
	//Do not permit use of the wildcard '*' as a tag name
	if (tag != '*') {
		this.timers[tag] = {'remaining': milliseconds, 'callback': callback};
	}
}

//Cancels a timer with the specified tag
TimerManager.prototype.cancelTimer = function(tag)
{
	if (this.timers[tag] !== undefined) {
		delete this.timers[tag];
	}
}

//Cancels all timers
TimerManager.prototype.cancelAllTimers = function() {
	this.timers = {};
}

//Registers a new timer tick listener for the specified tag (use '*' for all timers)
//[Tick listeners are instances of callable that take the arguments(timeRemaining, tag)]
TimerManager.prototype.addTickListener = function(tag, listener)
{
	//We maintain a list of listeners for each unique tag
	if (this.timerListeners[tag] === undefined) {
		this.timerListeners[tag] = [];
	}
	
	this.timerListeners[tag].push(listener);
}

TimerManager.prototype.getListeners = function(tag)
{
	var listeners = [];
	
	//Retrieve the listeners for the specific tag
	if (this.timerListeners[tag] !== undefined) {
		listeners = listeners.concat(this.timerListeners[tag]);
	}
	
	//Retrieve the listeners for the wildcard '*'
	if (this.timerListeners['*'] !== undefined) {
		listeners = listeners.concat(this.timerListeners['*']);
	}
	
	return listeners;
}

//Performs a tick for all active timers, should be called every frame
TimerManager.prototype.tick = function(deltaTime)
{
	//Perform a tick for each active timer
	var timerTags = Object.keys(this.timers);
	for (var timerIndex = 0; timerIndex < timerTags.length; ++timerIndex)
	{
		var currTimerTag = timerTags[timerIndex];
		var currTimer    = this.timers[currTimerTag];
		
		//Decrement the timer, guarding against a negative remaining time
		currTimer.remaining = Math.max(0, currTimer.remaining - deltaTime);
		
		//Invoke the tick listeners for the timer
		var listeners = this.getListeners(currTimerTag);
		for (var listenerIndex = 0; listenerIndex < listeners.length; ++listenerIndex) {
			listeners[listenerIndex](currTimer.remaining, currTimerTag);
		}
		
		//If the timer has completed, invoke its callback and remove the timer
		if (currTimer.remaining === 0)
		{
			//Grab a reference to the callback and delete the timer
			var callback = currTimer.callback;
			delete this.timers[currTimerTag];
			
			//Invoke the callback
			callback();
		}
	}
}
