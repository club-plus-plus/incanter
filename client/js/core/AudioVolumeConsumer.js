/*
	Audio Volume Consumer
	
	Consumes microphone audio samples and monitors volume levels to determine if
	they fall inside a specified trigger zone.
	
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

function AudioVolumeConsumer(triggerMin, triggerMax)
{
	this.maxVolume = 70;
	this.minTriggerVol = this.maxVolume * triggerMin;
	this.maxTriggerVol = this.maxVolume * triggerMax;
	
	this.currVolume = 0;
	
	this.onTrigger = function(volume) {};
}

AudioVolumeConsumer.prototype.trigger = function(handler) {
	this.onTrigger = handler;
}

AudioVolumeConsumer.prototype.getCurrentVolume = function() {
	return this.currVolume;
}

AudioVolumeConsumer.prototype.getMaximumVolume = function() {
	return this.maxVolume;
}

AudioVolumeConsumer.prototype.getTriggerZone = function()
{
	return {
		
		//Raw trigger volume bounds
		min: this.minTriggerVol,
		max: this.maxTriggerVol,
		
		//Trigger volume bounds as percentages of the max volume
		minPercent: this.minTriggerVol / this.maxVolume,
		maxPercent: this.maxTriggerVol / this.maxVolume
		
	};
}

AudioVolumeConsumer.prototype.isInTriggerZone = function() {
	return (this.currVolume >= this.minTriggerVol && this.currVolume <= this.maxTriggerVol)
}

AudioVolumeConsumer.prototype.consumeAudioSamples = function(samples)
{
	//Determine the current volume of the audio in the buffer
	var sum = 0;
	for (var i = 0; i < samples.length; i++) {
		sum += samples[i];
	}
	
	//If the volume falls inside the trigger zone, invoke our handler
	this.currVolume = sum / samples.length;
	if (this.isInTriggerZone() === true) {
		this.onTrigger(this.currVolume);
	}
}
