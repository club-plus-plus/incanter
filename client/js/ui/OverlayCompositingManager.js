/*
	Overlay Compositing Manager
	
	Abstracts drawing to an overlay canvas element being used for compositing.
	
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

function OverlayCompositingManager(canvas)
{
	this.canvas = canvas;
	this.canvasContext = this.canvas.getContext('2d');
	
	this.resizeCanvas();
}

OverlayCompositingManager.prototype.resizeCanvas = function()
{
	var canvasStyle    = window.getComputedStyle(this.canvas);
	this.canvas.width  = parseInt(canvasStyle.getPropertyValue('width').replace('px', ''));
	this.canvas.height = parseInt(canvasStyle.getPropertyValue('height').replace('px', ''));
}

OverlayCompositingManager.prototype.clear = function()
{
	this.resizeCanvas();
	this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
}

OverlayCompositingManager.prototype.fillRect = function(rect, fillStyle)
{
	//Save current context state
	this.canvasContext.save();
	
	//Render the rectangle
	var adjustedRect = this.getAdjustedRectangle(rect);
	this.canvasContext.fillStyle = fillStyle;
	this.canvasContext.fillRect(adjustedRect.x, adjustedRect.y, adjustedRect.w, adjustedRect.h);
	
	//Restore original context state
	this.canvasContext.restore();
}

OverlayCompositingManager.prototype.drawImage = function(image, rect, alpha, rotation, forceStretch)
{
	//Save current context state
	this.canvasContext.save();
	
	//Set the alpha if specified
	if (alpha !== undefined) {
		this.canvasContext.globalAlpha = alpha;
	}
	
	//If a rotation was specified, apply it
	if (rotation !== undefined)
	{
		//Move the pivot point to the centre of the canvas
		this.canvasContext.translate(this.canvas.width / 2, this.canvas.height / 2);
		
		//Perform rotation
		this.canvasContext.rotate(rotation);
		
		//Move the pivot point back to the top-left corner of the canvas
		this.canvasContext.translate((this.canvas.width / 2) * -1, (this.canvas.height / 2) * -1);
	}
	
	try
	{
		//Draw the image, either scaled to the rectange or centred in it if smaller
		var boundingRect = this.getAdjustedRectangle(rect);
		if (image.naturalWidth < boundingRect.w && image.naturalHeight < boundingRect.h && (forceStretch !== true))
		{
			//Image is smaller than bounding rectangle and we are not forcing stretch mode, render in the centre
			var imageX = (boundingRect.x + (boundingRect.w / 2) - (image.naturalWidth / 2));
			var imageY = (boundingRect.y + (boundingRect.h / 2) - (image.naturalHeight / 2));
			this.canvasContext.drawImage(image, imageX, imageY, image.naturalWidth, image.naturalHeight);
		}
		else
		{
			//Image is larger than the bounding rectangle or we are forcing stretch mode, scale to rectangle
			this.canvasContext.drawImage(image, boundingRect.x, boundingRect.y, boundingRect.w, boundingRect.h);
		}
	}
	catch (e) {
		//If drawing failed this frame, simply ignore the error
	}
	
	//Restore original context state
	this.canvasContext.restore();
}

OverlayCompositingManager.prototype.getAdjustedRectangle = function(rect)
{
	return {
		x: rect.x * this.canvas.width,
		y: rect.y * this.canvas.height,
		w: rect.w * this.canvas.width,
		h: rect.h * this.canvas.height
	};
}
