/*
	Peer Media Stream Display
	
	Displays the media stream of a peer in a video element.
	
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

function PeerMediaStreamDisplay(gameEngine, videoElement)
{
	this.gameEngine   = gameEngine;
	this.videoElement = videoElement;
	
	//These dimensions are the lowest available, supported by Firefox
	this.videoElement.width    = 320;
	this.videoElement.height   = 240;
	this.videoElement.autoplay = 'autoplay';
	this.videoElement.loop     = true;
	
	//Mute playback on the peer's audio stream
	this.videoElement.setAttribute('muted', 'muted');
	this.videoElement.muted = true;
	
	//Register ourself as a peer media stream consumer
	this.gameEngine.registerPeerMediaStreamConsumer(this);
}

PeerMediaStreamDisplay.prototype.peerMediaStreamAvailable = function(peerStream) {
	this.videoElement.src = window.URL.createObjectURL(peerStream);
}
