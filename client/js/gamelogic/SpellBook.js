/*
	Spell Book
	
	Contains definitions of the game's spells, and provides functionality for
	generating spells from element charges, and determining the effectiveness of
	counter-spells for performing damage calculation.
	
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

function SpellBook()
{
	//The charge threshold used for including elements in spells
	this.chargeThreshold = 10;
	
	//The maximum damage a spell can do
	this.maximumSpellDamage = 40;
	
	//Create the default opposing element mappings
	this.opposingElemsMapping = {};
	this.addElemOpposingMappings();
	
	//Add the default spells
	this.spells = {};
	this.addSpells( this.getDefaultSpells() );
}

SpellBook.prototype.Elements = {
	Air:   'Air',
	Fire:  'Fire',
	Water: 'Water',
	Earth: 'Earth',
	Light: 'Light',
	Dark:  'Dark'
}

SpellBook.prototype.getOpposingElementMappings = function() {
	return this.opposingElemsMapping;
}

SpellBook.prototype.generateSpell = function(elemCharges)
{
	//The elements that will be included in the spell
	var includedElems = [];
	var intensity = 0;
	
	//Determine which elements were sufficiently charged
	var elems = Object.keys(elemCharges);
	for (var elemIndex = 0; elemIndex < elems.length; ++elemIndex)
	{
		//Don't include elements that are not in our enum
		if (SpellBook.prototype.Elements.hasOwnProperty(elems[elemIndex]) === true)
		{
			//Only include elements whose charge satisfies the threshold
			var elemCharge = elemCharges[ elems[elemIndex] ];
			if (elemCharge >= this.chargeThreshold)
			{
				includedElems.push(elems[elemIndex]);
				intensity += elemCharge;
			}
		}
	}
	
	//Balance multi-element spells
	intensity /= includedElems.length;
	
	//Determine which spell matches the included elements
	var generatedSpell = this.getSpell(includedElems);
	if (generatedSpell !== null) {
		return {'name': generatedSpell, 'intensity': Math.floor(intensity), 'elems':includedElems};
	}
	
	//No matching spell in the spellbook
	return null;
}

SpellBook.prototype.calculateDamage = function(spell, counterSpell)
{
	//If the attack spell fizzled, no damage was taken
	if (spell === null) {
		return 0;
	}
	
	//Retrieve the opposing elements for the original spell's elements
	var opposingElems = [];
	for (var elemIndex = 0; elemIndex < spell.elems.length; ++elemIndex) {
		opposingElems.push( this.opposingElemsMapping[ spell.elems[elemIndex] ] );
	}
	
	//Determine the intensity multiplier based on the counter-spell elements
	var intensityMultiplier = 0.1;
	for (var elemIndex = 0; elemIndex < opposingElems.length; ++elemIndex)
	{
		if (counterSpell !== null && counterSpell.elems.indexOf( opposingElems[elemIndex] ) !== -1) {
			intensityMultiplier += 0.4;
		}
	}
	
	//Determine damage based on the non-countered intensity
	var remainingIntensity = Math.max(0, spell.intensity - (((counterSpell !== null) ? counterSpell.intensity : 0) * intensityMultiplier));
	var scaledIntensity    = Math.min(1.0, remainingIntensity / 200.0);
	var damage             = Math.min(this.maximumSpellDamage, scaledIntensity * this.maximumSpellDamage);
	damage                 = Math.floor(Math.max(1.0, damage));
	
	//Store the intermediate values for debug output
	this.lastDamageCalculation = {
		'intensityMultiplier': intensityMultiplier,
		'remainingIntensity':  remainingIntensity,
		'scaledIntensity':     scaledIntensity,
		'damage':              damage
	};
	
	return damage;
}

SpellBook.prototype.addSpell = function(spellID, elements)
{
	//Ensure the elements are sorted, so hashes are consistent regardless of order
	var sortedElems = elements.slice(0);
	sortedElems.sort();
	
	var key = this.generateHash(sortedElems);
	if (this.spells[key] === undefined) {
		this.spells[key] = spellID;
	}
}

SpellBook.prototype.addSpells = function(spells)
{
	var spellNames = Object.keys(spells);
	for (var spellIndex = 0; spellIndex < spellNames.length; ++spellIndex)
	{
		var currSpellName  = spellNames[spellIndex];
		var currSpellElems = spells[currSpellName];
		
		this.addSpell(currSpellName, currSpellElems);
	}
}

SpellBook.prototype.getSpell = function(elems)
{
	//Ensure the elements are sorted, so hashes are consistent regardless of order
	var sortedElems = elems.slice(0);
	sortedElems.sort();
	
	var key = this.generateHash(sortedElems);
	if (this.spells[key] !== undefined) {
		return this.spells[key];
	}
	
	return null;
}

SpellBook.prototype.generateHash = function(obj) {
	return JSON.stringify(obj);
}

SpellBook.prototype.getDefaultSpells = function()
{
	return {

		//Single-element spells
		'Lightning Bolt':   [SpellBook.prototype.Elements.Air],
		'Fireball':         [SpellBook.prototype.Elements.Fire],
		'Water Gun':        [SpellBook.prototype.Elements.Water],
		'Earthquake':       [SpellBook.prototype.Elements.Earth],
		'Blinding Light':   [SpellBook.prototype.Elements.Light],
		'Dark Grasp':       [SpellBook.prototype.Elements.Dark],
		
		//Air-primary spells
		'Searing Wind':     [SpellBook.prototype.Elements.Air, SpellBook.prototype.Elements.Fire],
		'Cyclone':          [SpellBook.prototype.Elements.Air, SpellBook.prototype.Elements.Water],
		'Sandstorm':        [SpellBook.prototype.Elements.Air, SpellBook.prototype.Elements.Earth],
		'Prismatic Light':  [SpellBook.prototype.Elements.Air, SpellBook.prototype.Elements.Light],
		'Blind':            [SpellBook.prototype.Elements.Air, SpellBook.prototype.Elements.Dark],
		
		//Fire-primary spells
		'Concealing Steam': [SpellBook.prototype.Elements.Fire, SpellBook.prototype.Elements.Water],
		'Meteor':           [SpellBook.prototype.Elements.Fire, SpellBook.prototype.Elements.Earth],
		'Sun Beam':         [SpellBook.prototype.Elements.Fire, SpellBook.prototype.Elements.Light],
		'Shadowflame Bolt': [SpellBook.prototype.Elements.Fire, SpellBook.prototype.Elements.Dark],
		
		//Water-primary spells
		'Ice Shards':       [SpellBook.prototype.Elements.Water, SpellBook.prototype.Elements.Earth],
		'Refraction':       [SpellBook.prototype.Elements.Water, SpellBook.prototype.Elements.Light],
		'Drown':            [SpellBook.prototype.Elements.Water, SpellBook.prototype.Elements.Dark],
		
		//Earth-primary spells
		'Magical Aegis':    [SpellBook.prototype.Elements.Earth, SpellBook.prototype.Elements.Light],
		'Entomb':           [SpellBook.prototype.Elements.Earth, SpellBook.prototype.Elements.Dark],
		
		//Light-primary spells
		'Negation':         [SpellBook.prototype.Elements.Light, SpellBook.prototype.Elements.Dark]
	};
}

SpellBook.prototype.addElemOpposingMappings = function()
{
	this.opposingElemsMapping = {
			
			'Air':   SpellBook.prototype.Elements.Earth,
			'Earth': SpellBook.prototype.Elements.Air,
			'Fire':  SpellBook.prototype.Elements.Water,
			'Water': SpellBook.prototype.Elements.Fire,
			'Light': SpellBook.prototype.Elements.Dark,
			'Dark':  SpellBook.prototype.Elements.Light
			
	};
}
