/*
	Health Bar Renderer
	
	Renders a visual representation of a player's health.
	
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

function HealthBarRenderer(containerElem, maxHealth)
{
	this.containerElem = containerElem;
	this.maxHealth     = ((maxHealth !== undefined) ? maxHealth : 100);
	this.healthLevel   = this.maxHealth;
	
	this.createBar();
	this.redrawBar();
}

HealthBarRenderer.prototype.setHealth = function(newHealth)
{
	this.healthLevel = newHealth;
	this.redrawBar();
}

HealthBarRenderer.prototype.redrawBar = function()
{
	var barWidth = Math.floor((this.healthLevel / this.maxHealth) * 100.0);
	this.healthBar.css('width', barWidth + '%');
	this.healthBar.css('background-color', this.getBarColour(barWidth));
}

HealthBarRenderer.prototype.getBarColour = function(barWidth)
{
	if (barWidth > 50) {
		return 'rgba(0,255,0,1)';
	}
	else if (barWidth > 15) {
		return 'rgba(255,255,0,1)';
	}
	else {
		return 'rgba(255,0,0,1)';
	}
}

HealthBarRenderer.prototype.createBar = function()
{
	//Create the health bar itself
	this.healthBar = $(document.createElement('span'));
	this.healthBar.css('display',  'block');
	this.healthBar.css('position', 'absolute');
	this.healthBar.css('top',      '0');
	this.healthBar.css('left',     '0');
	this.healthBar.css('width',    '0');
	this.healthBar.css('height',   '100%');
	this.healthBar.css('z-index',  '1');
	
	//Add the health bar to the container element
	this.healthBar.css('position', 'relative');
	this.containerElem.append(this.healthBar);
}
