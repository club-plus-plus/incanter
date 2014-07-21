/*
	Motion Detection Consumer
	
	Consumes webcam video frame data and performs hotspot-based and (optionally)
	grid-based motion detection.
	
	-------
	
	Sections of the code in this file are adapted directly from the JS Motion
	Detection Library, from <https://github.com/ReallyGood/js-motion-detection/>.

	The adapted sections of code are explicitly marked, and fall under a Creative
	Commons Attribution-Noncommercial-Share Alike 3.0 Unported License.
	
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

function MotionDetectionConsumer(gridRows, gridColumns, detectionThreshold, blendedCanvas)
{
	//Motion detection can be switched on and off as needed
	this.enabled = true;
	
	//The size above which a hotspot's confidence scale factor becomes greater than 1.0
	this.maxHotspotPixelSize = (256 * 256);
	
	//If no detection threshold was specified, use a small default value
	this.detectionThreshold = ((typeof detectionThreshold !== 'undefined') ? detectionThreshold : 10);
	
	//We divide the image into a grid of rectangles
	this.gridRows = gridRows;
	this.gridColumns = gridColumns;
	
	//We can toggle whether or not we utilise a grid for motion detection
	this.useGrid = true;
	
	//Our list of motion observers
	this.observers = [];
	
	//Maintain a list of registered hotspots
	this.hotspots = [];
	
	//We keep track of the previous frame
	this.previousFrame = null;
	
	//If a <canvas> element was supplied, use it instead of creating our own
	this.blendedCanvas = ((typeof blendedCanvas !== 'undefined') ? blendedCanvas : document.createElement('canvas'));
	this.blendedCtx    = this.blendedCanvas.getContext('2d');
}

MotionDetectionConsumer.prototype.isEnabled = function() {
	return this.enabled;
}

MotionDetectionConsumer.prototype.setEnabled = function(enabled) {
	this.enabled = (enabled === true);
}

MotionDetectionConsumer.prototype.setGridEnabled = function(enabled) {
	this.useGrid = enabled;
}

MotionDetectionConsumer.prototype.addObserver = function(observer) {
	this.observers.push(observer);
}

MotionDetectionConsumer.prototype.registerHotspots = function(hotspots)
{
	for (var hotspotIndex = 0; hotspotIndex < hotspots.length; ++hotspotIndex)
	{
		var currHotspot = hotspots[hotspotIndex];
		this.registerHotspot(currHotspot.name, currHotspot.x, currHotspot.y, currHotspot.w, currHotspot.h);
	}
}

MotionDetectionConsumer.prototype.registerHotspot = function(name, x, y, w, h) {
	this.hotspots.push({ x:x, y:y, w:w, h:h, name:name });
}

MotionDetectionConsumer.prototype.getHotspotList = function() {
	return this.hotspots;
}

MotionDetectionConsumer.prototype.motionDetected = function(confidence, rect)
{
	for (var observerIndex = 0; observerIndex < this.observers.length; ++observerIndex) {
		this.observers[observerIndex].onMotion(confidence, rect);
	}
}

MotionDetectionConsumer.prototype.consumeFrame = function(frame, videoObject)
{
	//Motion detection can be switched off when not required
	if (this.enabled !== true) {
		return;
	}
	
	//Don't perform motion detection until we have the first pair of frames to compare
	if (this.previousFrame === null)
	{
		this.previousFrame = frame;
		return;
	}
	
	//Size the canvas that holds the blended image data
	this.blendedCanvas.width  = frame.width;
	this.blendedCanvas.height = frame.height;
	
	//Blend the previous frame with the current frame
	var blendedFrame = this.blendedCtx.createImageData(frame.width, frame.height);
	this.blendFrames(blendedFrame.data, this.previousFrame.data, frame.data);
	this.blendedCtx.putImageData(blendedFrame, 0, 0);
	
	//Store the current frame as the new previous frame
	this.previousFrame = frame;
	
	//Determine if we are utilising a grid
	if (this.useGrid === true)
	{
		//Dynamically determine the dimensions of grid cells based on the image resolution
		var cellWidth  = 1.0 / this.gridColumns;
		var cellHeight = 1.0 / this.gridRows;
		
		//Iterate over the grid cells and perform motion detection in each one
		for (var currRow = 0; currRow < this.gridRows; ++currRow)
		{
			for (var currCol = 0; currCol < this.gridColumns; ++currCol)
			{
				var cellRect = {
					
					//Rectangle for the current grid cell
					x: currCol * cellWidth,
					y: currRow * cellHeight,
					w: cellWidth,
					h: cellHeight,
					
					//These fields are not used for motion detection,
					//but are passed unmodified to motion observers
					row: currRow,
					col: currCol
				};
				
				this.detectMotion(cellRect);
			}
		}
	}
	
	//Iterate over the hotspots and perform motion detection in each one
	for (var hotspotIndex = 0; hotspotIndex < this.hotspots.length; ++hotspotIndex) {
		this.detectMotion(this.hotspots[hotspotIndex]);
	}
}

//All functions below this point are adapted directly from the JS Motion Detection Library, from
//<https://github.com/ReallyGood/js-motion-detection/>

//As a derivative work, this code inherits the license of the original, which is a
//Creative Commons Attribution-Noncommercial-Share Alike 3.0 Unported License.

MotionDetectionConsumer.prototype.fastAbs = function(value)
{
	//Optimised bitwise implementation of Math.abs
	return (value ^ (value >> 31)) - (value >> 31);
}

MotionDetectionConsumer.prototype.threshold = function(value) {
	return (value > 0x15) ? 0xFF : 0;
}

MotionDetectionConsumer.prototype.blendFrames = function(blendResult, prevFrame, currFrame)
{
	if (prevFrame.length != currFrame.length) return null;
	for (var i = 0; i < (prevFrame.length * 0.25); ++i)
	{
		var average1 = (prevFrame[4 * i] + prevFrame[4 * i + 1] + prevFrame[4 * i + 2]) / 3;
		var average2 = (currFrame[4 * i] + currFrame[4 * i + 1] + currFrame[4 * i + 2]) / 3;
		var diff = this.threshold(this.fastAbs(average1 - average2));
		blendResult[4 * i] = diff;
		blendResult[4 * i + 1] = diff;
		blendResult[4 * i + 2] = diff;
		blendResult[4 * i + 3] = 0xFF;
	}
}

MotionDetectionConsumer.prototype.detectMotion = function(rect)
{
	//Retrieve the blended image data for the specified rectangle
	var x = Math.floor(rect.x * this.previousFrame.width);
	var y = Math.floor(rect.y * this.previousFrame.height);
	var w = Math.floor(rect.w * this.previousFrame.width);
	var h = Math.floor(rect.h * this.previousFrame.height);
	var blendedRect = this.blendedCtx.getImageData(x, y, w, h);
	
	//Average the colour channels
	var average = 0;
	for (var i = 0; i < (blendedRect.data.length * 0.25); ++i) {
		average += (blendedRect.data[i * 4] + blendedRect.data[i * 4 + 1] + blendedRect.data[i * 4 + 2]) / 3;
	}
	
	//Determine the confidence value, scaling based on rectange size
	var confidence = average / (blendedRect.data.length * 0.25);
	confidence    += (confidence * ((blendedRect.data.length * 0.25) / this.maxHotspotPixelSize));
	confidence     = Math.round(confidence);
	
	//Detect movement above the predefined threshold
	if (confidence > this.detectionThreshold) {
		this.motionDetected(confidence, rect);
	}
}
