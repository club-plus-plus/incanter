/*
	Volume Level Renderer
	
	Draws a volume meter to a canvas element, based on information queried from
	an AudioVolumeConsumer instance.
	
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

function VolumeLevelRenderer(volumeInfo, canvas)
{
	this.volumeInfo = volumeInfo;
	
	this.canvas = canvas;
	this.canvasContext = this.canvas.getContext('2d');
	
	this.canvas.width  = $(this.canvas).innerWidth();
	this.canvas.height = $(this.canvas).innerHeight();
}

VolumeLevelRenderer.prototype.update = function()
{
	//Retrieve the current volume and trigger zone details
	var currVolume = this.volumeInfo.getCurrentVolume();
	var triggerZone = this.volumeInfo.getTriggerZone();
	
	//Clear the canvas
	this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
	
	//Render the trigger zone rectangle
	this.canvasContext.fillStyle = '#777777';
	this.canvasContext.fillRect(0, this.canvas.height * (1.0 - triggerZone.maxPercent), this.canvas.width, this.canvas.height * (triggerZone.maxPercent - triggerZone.minPercent));
	
	//Render the volume bar
	this.canvasContext.fillStyle = ((this.volumeInfo.isInTriggerZone() === true) ? '#00ff00' : '#ff0000');
	this.canvasContext.fillRect(0, this.canvas.height - ((currVolume / this.volumeInfo.getMaximumVolume()) * this.canvas.height), this.canvas.width, this.canvas.height);
}
