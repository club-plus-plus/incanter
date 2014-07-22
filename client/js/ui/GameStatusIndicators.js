/*
	Gameplay Status Indicators
	
	Manages the UI status indicators for gameplay state (player health, element
	charge levels, etc.)
	
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

function GameStatusIndicators(gameEngine, uiElements, elementImages)
{
	this.gameEngine = gameEngine;
	this.uiElements = uiElements;
	this.elementStatusTable = uiElements.elementStatusTable;
	
	//Build the element status table
	this.elementChargeTableCells = {};
	this.buildElementStatusTable(elementImages);
	
	//Create the player and opponent health bars
	this.playerHealthBar   = new HealthBarRenderer(this.uiElements.playerHealthBar);
	this.opponentHealthBar = new HealthBarRenderer(this.uiElements.opponentHealthBar);
}

GameStatusIndicators.prototype.buildElementStatusTable = function(elementImages)
{
	var elementNames = Object.keys(elementImages);
	for (var elementIndex = 0; elementIndex < elementNames.length; ++elementIndex)
	{
		//Create the table row for each element
		var currElement = elementNames[elementIndex];
		var tableRow    = $(document.createElement('tr'));
		var iconImage   = $(document.createElement('img'));
		var iconCell    = $(document.createElement('td')).append(iconImage);
		var chargeCell  = $(document.createElement('td')).text('0');
		iconImage.attr('src', elementImages[currElement].toolbarIcon);
		iconImage.attr('alt', currElement);
		iconImage.attr('title', currElement);
		
		//Add the charge cell to our mapping
		this.elementChargeTableCells[ currElement ] = chargeCell;
		
		//Add the row to the element charges table
		tableRow.append(iconCell);
		tableRow.append(chargeCell);
		this.elementStatusTable.append(tableRow);
	}
}

GameStatusIndicators.prototype.update = function()
{
	//Update the player and opponent health indicators
	var playerHealth   = this.gameEngine.gameState.getClientPlayer().health;
	var opponentHealth = this.gameEngine.gameState.getPeerPlayer().health;
	this.uiElements.playerHealth.text(playerHealth);
	this.uiElements.opponentHealth.text(opponentHealth);
	this.playerHealthBar.setHealth(playerHealth);
	this.opponentHealthBar.setHealth(opponentHealth);
	
	//Update the table of element charges
	var hotspots = this.gameEngine.getMotionHotspots();
	var accumulatedMotion = this.gameEngine.getAccumulatedMotion();
	for (var hotspotIndex = 0; hotspotIndex < hotspots.length; ++hotspotIndex)
	{
		var currHotspot = hotspots[hotspotIndex];
		var accumulationCount = Math.floor((accumulatedMotion[currHotspot.name] !== undefined) ? accumulatedMotion[currHotspot.name] : 0);
		this.elementChargeTableCells[ currHotspot.name ].text(accumulationCount);
	}
}
