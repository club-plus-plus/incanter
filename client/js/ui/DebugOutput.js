/*
	Debug Output Manager
	
	Provides onscreen debug output for development use.
	
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

function DebugOutput(containerElem, outputElem, blendedImageCanvas)
{
	this.containerElem = containerElem;
	this.outputElem = outputElem;
	this.blendedImageCanvas = blendedImageCanvas;
	this.blendedCtx = this.blendedImageCanvas.getContext('2d');
	
	//Keep track of any TurnLogic timer ticks
	this.timerRemaining = 0;
	this.tickListenerRegistered = false;
	
	//Register our keyboard visibility toggle event handler
	var that = this;
	$(document).keydown(function(event)
	{
		//Toggle debug panel visibility when escape is pressed
		if (event.which == 27) {
			that.containerElem.toggle();
		}
	});
}

DebugOutput.prototype.registerTickListener = function()
{
	var that = this;
	this.tickListenerRegistered = true;
	window.gameEngine.turnLogic.addTickListener('state-countdown', function(timeRemaining) {
		that.timerRemaining = timeRemaining;
	});
}

DebugOutput.prototype.generateWhitespace = function(length)
{
	var whitespace = '';
	for (var i = 0; i < length; ++i) {
		whitespace += ' ';
	}
	
	return whitespace;
}

DebugOutput.prototype.update = function(time, deltaTime)
{
	//Defer registration of our tick listener until after the TurnLogic instance has been created (happens once webcam access is allowed)
	if (this.tickListenerRegistered === false && window.gameEngine.turnLogic !== undefined) {
		this.registerTickListener();
	}
	
	var output = '';
	
	output += 'Time:       ' + time + "\n" + 'Delta Time: ' + deltaTime + "\n";
	
	output += 'Current State: ' + window.gameEngine.gameState.getCurrentState() + "\n";
	output += 'Current Timer: ' + this.timerRemaining + "\n";
	
	output += "\n\nVolume level:     " + window.gameEngine.getAudioVolumeMonitor().getCurrentVolume() + "\n";
	output += "In trigger zone:  " + window.gameEngine.getAudioVolumeMonitor().isInTriggerZone() + "\n";
	
	var damageCalc = window.gameEngine.spellBook.lastDamageCalculation;
	if (damageCalc !== undefined)
	{
		output += "\n\nDAMAGE CALCULATION:\n";
		output += 'intensityMultiplier: ' + damageCalc.intensityMultiplier + "\n";
		output += 'remainingIntensity:  ' + damageCalc.remainingIntensity + "\n";
		output += 'scaledIntensity:     ' + damageCalc.scaledIntensity + "\n";
		output += 'damage:              ' + damageCalc.damage + "\n";
	}
	
	output += "\n\nHotspots:\n";
	
	var hotspots = window.gameEngine.getMotionHotspots();
	var accumulatedMotion = window.gameEngine.getAccumulatedMotion();
	var hotspotNameLengths = hotspots.map( function(x) { return x.name.length; } );
	var maxNameLength = Math.max.apply(null, hotspotNameLengths);
	
	for (var hotspotIndex = 0; hotspotIndex < hotspots.length; ++hotspotIndex)
	{
		var currHotspot = hotspots[hotspotIndex];
		var accumulationCount = ((accumulatedMotion[currHotspot.name] !== undefined) ? accumulatedMotion[currHotspot.name] : 0);
		output += currHotspot.name + ': ' + this.generateWhitespace(maxNameLength - currHotspot.name.length) + accumulationCount + "\n";
	}
	
	this.outputElem.innerHTML = output;
	
	//Retrieve the blended image and render it to the debug canvas
	this.blendedImageCanvas.width  = window.gameEngine.motionDetection.blendedCanvas.width;
	this.blendedImageCanvas.height = window.gameEngine.motionDetection.blendedCanvas.height;
	this.blendedCtx.putImageData(window.gameEngine.motionDetection.blendedCtx.getImageData(0, 0, this.blendedImageCanvas.width, this.blendedImageCanvas.height), 0, 0);
}
