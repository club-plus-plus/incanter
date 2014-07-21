/*
	Run Loop Manager
	
	Coordinates the game's run loop, which is powered by requestAnimationFrame()
	(where available) and facilitates a delta time-based game loop.
	
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

function RunLoopManager(intervalFallback, forceFallback)
{
	var that = this;
	this.callbacks = [];
	this.intervalFallback = ((intervalFallback !== undefined) ? intervalFallback : 1000 / 60)
	
	//Our default error handler
	this.onError = function(e) { alert('Uncaught exception: ' + JSON.stringify(e)); };
	
	//Keep track of the previous timestamp so we can provide the delta each frame
	this.previousTimestamp = 0;
	
	//Make sure we use the correct version of requestAnimationFrame()
	window.requestAnimationFrame = window.requestAnimationFrame       ||
	                               window.webkitRequestAnimationFrame ||
	                               window.mozRequestAnimationFrame    ||
	                               window.oRequestAnimationFrame      ||
	                               window.msRequestAnimationFrame;
	
	//Check if we're falling back to using setInterval()
	this.requestAnimFrame = function(callback) { window.requestAnimationFrame(callback); };
	if (window.requestAnimationFrame === undefined || forceFallback === true)
	{
		this.requestAnimFrame = function(callback)
		{
			//Fallback to setInterval()
			setInterval(function() { callback( performance.now() ); }, that.intervalFallback);
			
			//Prevent subsequent calls from scheduling additional intervals
			//(One-shot setInterval() is more effecient than repeated setTimeout() for what we're doing)
			that.requestAnimFrame = function(callback) {};
		};
	}
	
	//Request the initial animation frame
	this.animFrame = function(timestamp) { that.update(timestamp); };
	this.requestAnimFrame(this.animFrame);
}

RunLoopManager.prototype.error = function(handler) {
	this.onError = handler;
}

RunLoopManager.prototype.scheduleCallback = function(callback) {
	this.callbacks.push(callback);
}

RunLoopManager.prototype.update = function(timestamp)
{
	//Request the next animation frame each time
	this.requestAnimFrame(this.animFrame);
	
	//Determine the timestamp delta
	var deltaTime = ((this.previousTimestamp != 0) ? timestamp - this.previousTimestamp : 0);
	this.previousTimestamp = timestamp;
	
	//If any uncaught exceptions occur, forward them to our error handler
	try
	{
		for (var callbackIndex = 0; callbackIndex < this.callbacks.length; ++callbackIndex) {
			this.callbacks[callbackIndex](timestamp, deltaTime);
		}
	}
	catch (e) {
		this.onError(e);
	}
}
