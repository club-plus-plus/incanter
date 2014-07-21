/*
	Hotspot Motion Accumulator
	
	Accumulates motion activity for motion hotspots over time, providing decay
	functionality if desired.
	
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

function HotspotMotionAccumulator(decayRate)
{
	this.accumulatedMotion = {};
	this.mutuallyExclusivePairs = {};
	
	this.currFrameDeltaTime = 0;
	this.decayRate = ((decayRate !== undefined) ? decayRate : 0)
}

HotspotMotionAccumulator.prototype.setFrameDeltaTime = function(deltaTime)
{
	this.currFrameDeltaTime = deltaTime;
	
	//If decay has been enabled, apply it now
	if (this.decayRate > 0)
	{
		var hotspotIDs = Object.keys(this.accumulatedMotion);
		for (var hotspotIndex = 0; hotspotIndex < hotspotIDs.length; ++hotspotIndex) {
			this.decrementAccumulatedCount(hotspotIDs[hotspotIndex], this.decayRate * (deltaTime / 1000));
		}
	}
}

HotspotMotionAccumulator.prototype.resetAccumulatedMotion = function() {
	this.accumulatedMotion = {};
}

HotspotMotionAccumulator.prototype.addMutuallyExclusivePair = function(hotspotID1, hotspotID2)
{
	if (this.getOpposingHotspot(hotspotID1) === null && this.getOpposingHotspot(hotspotID2) === null)
	{
		this.mutuallyExclusivePairs[hotspotID1] = hotspotID2;
		this.mutuallyExclusivePairs[hotspotID2] = hotspotID1;
	}
}

HotspotMotionAccumulator.prototype.getAccumulatedMotion = function() {
	return this.accumulatedMotion;
}

HotspotMotionAccumulator.prototype.getOpposingHotspot = function(hotspotID)
{
	if (this.mutuallyExclusivePairs[hotspotID] !== undefined) {
		return this.mutuallyExclusivePairs[hotspotID];
	}
	
	return null;
}

HotspotMotionAccumulator.prototype.decrementAccumulatedCount = function(hotspotID, decrementBy)
{
	if (this.accumulatedMotion[hotspotID] !== undefined)
	{
		//Reduce the accumulated motion of the specified hotspot, preventing it from becoming negative
		var accumulation = this.accumulatedMotion[hotspotID];
		accumulation -= decrementBy;
		this.accumulatedMotion[hotspotID] = Math.max(0, accumulation);
	}
}

HotspotMotionAccumulator.prototype.onMotion = function(confidence, rect)
{
	if (this.currFrameDeltaTime === 0 || rect.name === undefined) {
		return;
	}
	
	//Accumulate based on the amount of motion detected
	var currAccumulatedTime = ((this.accumulatedMotion[rect.name] !== undefined) ? this.accumulatedMotion[rect.name] : 0)
	var newAccumulation = (this.currFrameDeltaTime / 1000) * confidence;
	this.accumulatedMotion[rect.name] = currAccumulatedTime + newAccumulation;
	
	//Determine if the hotspot has a mutually exclusive opposite hotspot
	var oppositeHotspot = this.getOpposingHotspot(rect.name);
	if (oppositeHotspot !== null && this.accumulatedMotion[oppositeHotspot] !== undefined) {
		this.decrementAccumulatedCount(oppositeHotspot, newAccumulation);
	}
}
