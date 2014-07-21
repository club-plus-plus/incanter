/*
	Network Protocol
	
	Defines the communication protocol utilised by the NetworkClient class.
	
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

function NetworkProtocol()
{}

NetworkProtocol.prototype.commands = {
	'BattleRequest':  'BattleRequest',
	'BattleAccepted': 'BattleAccepted',
	'CastSpell':      'CastSpell',
	'TurnOver':       'TurnOver'
};

NetworkProtocol.prototype.castSpell = function(player){
	return this.generateRequest(this.commands.CastSpell, player);
}

NetworkProtocol.prototype.battleRequest = function(player){
	return this.generateRequest(this.commands.BattleRequest, player);
}

NetworkProtocol.prototype.battleAccept = function(player){
	return this.generateRequest(this.commands.BattleAccepted, player);
}

NetworkProtocol.prototype.turnOver = function(player){
	return this.generateRequest(this.commands.TurnOver, player);
}

NetworkProtocol.prototype.generateRequest = function(request, player)
{
	player = ((player) ? JSON.stringify(player) : player);
	return {'Request':request, 'Player':player};
}
