/*
	Media Content Producer
	
	Coordinates consumers of media (audio + video) data, retrieved from the user's
	webcam and/or microphone using WebRTC.
	
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

function MediaContentProducer(flipVideo, videoElement)
{
	//Access to the media streams can be switched on and off as needed
	this.enabled = true;
	
	this.consumers = [];
	this.onMediaAvailable = function(stream) {};
	this.onError = function() {};
	this.video = null;
	this.mediaStream = null;
	this.flipVideo = (flipVideo === true);
	
	//If a <video> element was supplied, use it instead of creating our own
	if (typeof videoElement !== 'undefined') {
		this.video = videoElement;
	}
}

MediaContentProducer.prototype.setEnabled = function(enabled) {
	this.enabled = (enabled === true);
}

MediaContentProducer.prototype.mediaAvailable = function(handler) {
	this.onMediaAvailable = handler;
}

MediaContentProducer.prototype.error = function(handler) {
	this.onError = handler;
}

MediaContentProducer.prototype.addConsumer = function(consumer) {
	this.consumers.push(consumer);
}

MediaContentProducer.prototype.acquireMedia = function()
{
	this.video  = ((this.video == null) ? document.createElement('video') : this.video);
	this.canvas = document.createElement('canvas');
	this.ctx    = this.canvas.getContext('2d');
	
	//Mute playback on webcam audio, to prevent feedback loops
	this.video.setAttribute('muted', 'muted');
	this.video.muted = true;
	
	//These dimensions are the lowest available, supported by Firefox
	this.canvas.width  = this.video.width  = 320;
	this.canvas.height = this.video.height = 240;
	this.video.autoplay = 'autoplay';
	this.video.loop = true;
	
	//Set the canvas to flip the image data if requested
	if (this.flipVideo === true)
	{
		this.ctx.translate(this.canvas.width, 0);
		this.ctx.scale(-1, 1);
	}
	
	//Determine which vendor prefix we are using for getUserMedia()
	navigator.getUserMedia  = navigator.getUserMedia ||
	                          navigator.webkitGetUserMedia ||
	                          navigator.mozGetUserMedia ||
	                          navigator.msGetUserMedia;
	
	if (navigator.getUserMedia)
	{
		var that = this;
		navigator.getUserMedia(
			
			{audio: true, video: true},
			
			function(stream) 
			{
				//Keep an internal reference to the stream object
				that.mediaStream = stream;
				
				//Webcam is available
				that.video.src = window.URL.createObjectURL(stream);
				
				//Microphone is available
				that.audioContext = new AudioContext();
				that.analyser = that.audioContext.createAnalyser();
				that.microphone = that.audioContext.createMediaStreamSource(stream);
				that.processingNode = that.audioContext.createScriptProcessor(2048, 1, 1);
				
				that.analyser.smoothingTimeConstant = 0.3;
				that.analyser.fftSize = 1024;
				that.analyser.minDecibels = -100;
				that.analyser.maxDecibels = -30;
				
				that.microphone.connect(that.analyser);
				that.analyser.connect(that.processingNode);
				that.processingNode.connect(that.audioContext.destination);
				
				that.audioSamples = new Uint8Array(that.analyser.frequencyBinCount);
				that.processingNode.onaudioprocess = function() {
					that.analyser.getByteFrequencyData(that.audioSamples);
				};
				
				that.onMediaAvailable(stream);
				that.update();
			},
			
			//Called when getUserMedia() fails
			function(e) { that.onError(); }
		);
	}
	else
	{
		//getUserMedia() is unavailable
		this.onError();
	}
}

MediaContentProducer.prototype.update = function()
{
	//Determine if a new video frame is available
	if (this.enabled === true && this.video.readyState === this.video.HAVE_ENOUGH_DATA)
	{
		//Attempt to use the canvas element to retrieve the raw image data
		try {
			this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
		}
		catch (e)
		{
			//If drawImage failed, drop the frame
			return;
		}
		
		//Retrieve the raw framebuffer data
		var imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
		
		for (var consumerIndex = 0; consumerIndex < this.consumers.length; ++consumerIndex)
		{
			//Provide the video frame to the consumers who are interested in video
			if (this.consumers[consumerIndex].consumeFrame !== undefined) {
				this.consumers[consumerIndex].consumeFrame(imageData, this.video);
			}
			
			//Provide the current contents of the audio sample buffer to consumers interested in audio
			if (this.consumers[consumerIndex].consumeAudioSamples !== undefined) {
				this.consumers[consumerIndex].consumeAudioSamples(this.audioSamples);
			}
		}
	}
}
