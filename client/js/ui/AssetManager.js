/*
	Asset Manager
	
	Manages loading the game's media assets from the (server) filesystem.
	
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

function AssetManager(audioManager)
{
	this.audioManager = audioManager;
	
	this.loadSounds();
}

AssetManager.prototype.loadSounds = function()
{
	this.audioManager.loadPlaylist([
		{'name':'air',    'url':'./assets/sounds/air.mp3'},
		{'name':'earth',  'url':'./assets/sounds/earth.mp3'},
		{'name':'fire',   'url':'./assets/sounds/fire.mp3'},
		{'name':'water',  'url':'./assets/sounds/water.mp3'},
		{'name':'light',  'url':'./assets/sounds/light.mp3'},
		{'name':'dark',   'url':'./assets/sounds/dark.mp3'},
		{'name':'fizzle', 'url':'./assets/sounds/fizzle.mp3'},
		
		{'name':'begin',  'url':'./assets/sounds/begin.mp3'},
		{'name':'end',    'url':'./assets/sounds/end.mp3'},
		{'name':'damage', 'url':'./assets/sounds/damage.mp3'},
		
		{'name':'ReadyUp',               'url':'./assets/sounds/ready_up.mp3'},
		{'name':'PlayerAttacking',       'url':'./assets/sounds/cast_your_spell.mp3'},
		{'name':'PlayerDefending',       'url':'./assets/sounds/defend_yourself.mp3'},
		{'name':'PlayerWaitingToDefend', 'url':'./assets/sounds/be_ready_to_defend.mp3'},
		{'name':'EndOfTurn',             'url':'./assets/sounds/your_turn_is_over.mp3'},
		
		{'name':'Victory',               'url':'./assets/sounds/the_battle_has_been_won.mp3'}
	]);
}

AssetManager.prototype.getHotspotOverlayImages = function()
{
	return {
		'Air':   {'image':'./assets/images/AirFront.png',   'background':'./assets/images/AirBack.png',   'toolbarIcon':'./assets/images/Air.png'},
		'Water': {'image':'./assets/images/WaterFront.png', 'background':'./assets/images/WaterBack.png', 'toolbarIcon':'./assets/images/Water.png'},
		'Fire':  {'image':'./assets/images/FireFront.png',  'background':'./assets/images/FireBack.png',  'toolbarIcon':'./assets/images/Fire.png'},
		'Earth': {'image':'./assets/images/EarthFront.png', 'background':'./assets/images/EarthBack.png', 'toolbarIcon':'./assets/images/Earth.png'},
		'Light': {'image':'./assets/images/LightFront.png', 'background':'./assets/images/LightBack.png', 'toolbarIcon':'./assets/images/Light.png'},
		'Dark':  {'image':'./assets/images/DarkFront.png',  'background':'./assets/images/DarkBack.png',  'toolbarIcon':'./assets/images/Dark.png'}
	};
}

AssetManager.prototype.getSpellCastImages = function()
{
	return {
		'Air':   {'image':'./assets/images/SpellImages/air.png'},
		'Water': {'image':'./assets/images/SpellImages/water.png'},
		'Fire':  {'image':'./assets/images/SpellImages/fire.png'},
		'Earth': {'image':'./assets/images/SpellImages/earth.png'},
		'Light': {'image':'./assets/images/SpellImages/light.png'},
		'Dark':  {'image':'./assets/images/SpellImages/dark.png'}
	};
}
