/*
	Image Overlay Motion Observer
	
	Provides visual feedback on hotspot motion activity using element icons.
	Also provides visual feedback on spell casting success using an image overlay.
	
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

function ImageOverlayMotionObserver(overlay, hotspots, imageMappings, spellCastImages)
{
	this.overlay = overlay;
	this.hotspots = hotspots;
	this.imageMappings = this.processImageMappings(imageMappings);
	this.spellCastImages = this.processImageMappings(spellCastImages);
	
	this.spellOverlayRotation = 0;
	this.spellOverlayRotationSpeed = 2;
	
	this.hotspotMotionLevels = {};
	this.resetMotionLevels();
}

ImageOverlayMotionObserver.prototype.resetMotionLevels = function()
{
	for (var hotspotIndex = 0; hotspotIndex < this.hotspots.length; ++hotspotIndex) {
		this.hotspotMotionLevels[ this.hotspots[hotspotIndex].name ] = 0;
	}
}

ImageOverlayMotionObserver.prototype.decayMotionLevels = function()
{
	for (var hotspotIndex = 0; hotspotIndex < this.hotspots.length; ++hotspotIndex)
	{
		this.hotspotMotionLevels[ this.hotspots[hotspotIndex].name ] -= 20;
		if (this.hotspotMotionLevels[ this.hotspots[hotspotIndex].name ] < 0) {
			this.hotspotMotionLevels[ this.hotspots[hotspotIndex].name ] = 0;
		}
	}
}

ImageOverlayMotionObserver.prototype.onMotion = function(confidence, rect)
{
	if (rect.name !== undefined) {
		this.hotspotMotionLevels[rect.name] = confidence;
	}
}

ImageOverlayMotionObserver.prototype.processImageMappings = function(mappingDetails)
{
	var mappings = {};
	
	var hotspotNames = Object.keys(mappingDetails);
	for (var hotspotIndex = 0; hotspotIndex < hotspotNames.length; ++hotspotIndex)
	{
		var processedMapping = {};
		var currHotspot  = hotspotNames[hotspotIndex];
		var imageDetails = mappingDetails[currHotspot];
		
		//If an image URL was supplied, load the image
		if (imageDetails.image !== undefined)
		{
			processedMapping.image = document.createElement('img');
			processedMapping.image.src = imageDetails.image;
		}
		
		//If a background image URL was supplied, load the image
		if (imageDetails.background !== undefined)
		{
			processedMapping.background = document.createElement('img');
			processedMapping.background.src = imageDetails.background;
		}
		
		//Add the processed mapping to our result
		mappings[currHotspot] = processedMapping;
	}
	
	return mappings;
}

ImageOverlayMotionObserver.prototype.renderOverlay = function(isMotionEnabled)
{
	for (var hotspotIndex = 0; hotspotIndex < this.hotspots.length; ++hotspotIndex)
	{
		var currHotspot  = this.hotspots[hotspotIndex];
		var motionLevel  = this.hotspotMotionLevels[currHotspot.name];
		var imageDetails = this.imageMappings[currHotspot.name];
		
		//Render the background image
		if (imageDetails !== undefined && imageDetails.background !== undefined) {
			this.overlay.drawImage(imageDetails.background, currHotspot, Math.min(1.0, motionLevel / 10));
		}
		
		//Render the foreground image
		if (imageDetails !== undefined && imageDetails.image !== undefined) {
			this.overlay.drawImage(imageDetails.image, currHotspot, (isMotionEnabled ? 1.0 : 0.5));
		}
	}
}

ImageOverlayMotionObserver.prototype.renderSpellCastImage = function(spell, deltaTime)
{
	//If the spell fizzled, don't render anything
	if (spell === null) {
		return;
	}
	
	//Retrieve the spell-cast image for the spell
	var spellImage = this.spellCastImages[ spell.elems[0] ];
	
	//Update the rotation of the spell image based on deltaTime
	this.spellOverlayRotation += (this.spellOverlayRotationSpeed * (deltaTime / 1000));
	this.spellOverlayRotation = this.spellOverlayRotation % 360;
	
	//Render the image over everything else
	this.overlay.drawImage(spellImage.image, {x:0,y:0,w:1,h:1}, 1.0, this.spellOverlayRotation, true);
}
