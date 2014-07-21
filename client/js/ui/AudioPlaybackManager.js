/*
	Audio Playback Manager
	
	Manages audio playback for the UI.
	
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

function AudioPlaybackManager()
{
	this.clips = {};
	this.playlist = {};
	
	this.onError = function(e) {};
}

AudioPlaybackManager.prototype.error = function(handler) {
	this.onError = handler;
}

AudioPlaybackManager.prototype.loadPlaylist = function(playlist) {
	this.playlist = playlist;
}

AudioPlaybackManager.prototype.urlForClip = function(clipID)
{
	for (var itemIndex = 0; itemIndex < this.playlist.length; ++itemIndex)
	{
		if (this.playlist[itemIndex].name === clipID) {
			return this.playlist[itemIndex].url;
		}
	}
	
	return null;
}

AudioPlaybackManager.prototype.play = function(clipID, loop)
{
	var that = this;
	var doLoop = (loop === true);
	
	//Determine if the clip is already loaded into memory
	var existingClip = this.clips[clipID];
	if (existingClip !== undefined)
	{
		//Play the clip if it is not already playing
		existingClip.loop = doLoop;
		if (existingClip.paused === true || existingClip.ended === true) {
			existingClip.play();
		}
	}
	else
	{
		//Determine if the clip is in our playlist
		var clipURL = this.urlForClip(clipID);
		if (clipURL !== null)
		{
			//Create an in-memory <audio> tag
			var newClip = document.createElement('audio');
			
			//Attempt to load and play the audio clip
			newClip.loop = doLoop;
			newClip.setAttribute('src', clipURL);
			newClip.load();
			newClip.play();
			this.clips[clipID] = newClip;
		}
		else
		{
			//Clip is not in the playlist
			this.onError('Invalid audio clip identifier "' + clipID + '"');
		}
	}
}

AudioPlaybackManager.prototype.stop = function(clipID)
{
	//Determine if the clip is already loaded into memory
	var existingClip = this.clips[clipID];
	if (existingClip !== undefined)
	{
		existingClip.pause();
		existingClip.currentTime = 0;
	}
}
