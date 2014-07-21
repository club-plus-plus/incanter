/*
	Debug Motion Visualiser
	
	Provides visual feedback of motion detection activity for debugging purposes.
	
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

function DebugMotionVisualiser(canvas, gridRows, gridColumns)
{
	this.canvas = canvas;
	this.canvasContext = this.canvas.getContext('2d');
	this.gridRows = gridRows;
	this.gridColumns = gridColumns;
	
	this.enabled = true;
}

DebugMotionVisualiser.prototype.setEnabled = function(enabled) {
	this.enabled = enabled;
}

DebugMotionVisualiser.prototype.outlineRegisteredHotspots = function(hotspots)
{
	for (var hotspotIndex = 0; hotspotIndex < hotspots.length; ++hotspotIndex)
	{
		var adjustedRect = this.getAdjustedRectangle(hotspots[hotspotIndex]);
		
		this.canvasContext.strokeStyle = '#000';
		this.canvasContext.strokeRect(adjustedRect.x, adjustedRect.y, adjustedRect.w, adjustedRect.h);
	}
}

DebugMotionVisualiser.prototype.drawHotspotAccumulationCounts = function(hotspots, accumulationCounts)
{
	for (var hotspotIndex = 0; hotspotIndex < hotspots.length; ++hotspotIndex)
	{
		var currHotspot = hotspots[hotspotIndex];
		var accumulationCount = ((accumulationCounts[currHotspot.name] !== undefined) ? accumulationCounts[currHotspot.name] : 0)
		var adjustedRect = this.getAdjustedRectangle(currHotspot);
		
		this.canvasContext.fillStyle = '#000';
		this.canvasContext.strokeStyle = '#fff';
		this.canvasContext.strokeText(Math.floor(accumulationCount), adjustedRect.x + (adjustedRect.w / 2), adjustedRect.y + (adjustedRect.h / 2));
		this.canvasContext.fillText(Math.floor(accumulationCount), adjustedRect.x + (adjustedRect.w / 2), adjustedRect.y + (adjustedRect.h / 2));
	}
}

DebugMotionVisualiser.prototype.onMotion = function(confidence, rect)
{
	if (this.enabled === false) {
		return;
	}
	
	if (rect.row === undefined || rect.col === undefined)
	{
		if (rect.name !== undefined) {
			this.highlightRect(rect, confidence);
		}
		else {
			return;
		}
	}
	
	//Highlight the grid cell that motion was detected in
	this.highlightCell(rect.row, rect.col, confidence);
}

DebugMotionVisualiser.prototype.highlightCell = function(row, col, intensity)
{
	//Dynamically determine the dimensions of grid cells based on the image resolution
	var cellWidth  = Math.floor(this.canvas.width  / this.gridColumns);
	var cellHeight = Math.floor(this.canvas.height / this.gridRows);
	
	var cellRect = {
		
		//Rectangle for the current grid cell
		x: col * cellWidth,
		y: row * cellHeight,
		w: cellWidth,
		h: cellHeight
	};
	
	this.canvasContext.fillStyle = 'rgba(0,0,255, ' + (intensity / 100.0) + ')';
	this.canvasContext.fillRect(cellRect.x, cellRect.y, cellRect.w, cellRect.h);
}

DebugMotionVisualiser.prototype.getAdjustedRectangle = function(rect)
{
	return {
		x: rect.x * this.canvas.width,
		y: rect.y * this.canvas.height,
		w: rect.w * this.canvas.width,
		h: rect.h * this.canvas.height
	};
}

DebugMotionVisualiser.prototype.highlightRect = function(rect, intensity)
{
	var adjustedRect = this.getAdjustedRectangle(rect);
	
	this.canvasContext.fillStyle = 'rgba(255,0,0, ' + (intensity / 100.0) + ')';
	this.canvasContext.fillRect(adjustedRect.x, adjustedRect.y, adjustedRect.w, adjustedRect.h);
}
