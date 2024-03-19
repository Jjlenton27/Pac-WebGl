class Animation{
    constructor(frames){
        this.frames = frames;
        this.frameIndex = 0;
        this.hasLooped = false;
    }

    Start(time){
        this.startTime = time;
        this.frameIndex = 0;
        this.nextFrameTime = this.CalculateNextFrameTime(time);
        this.hasLooped = false;
    }

    FetchFrame(time){
        if(time >= this.nextFrameTime){
            this.frameIndex++;
            if(this.frameIndex > this.frames.length - 1){
                this.frameIndex = 0;
                if(!this.hasLooped)
                    this.hasLooped = true;
            }

            this.nextFrameTime = this.CalculateNextFrameTime(time);
        }

        if(this.frames[this.frameIndex] == null)
            console.log("null frame");
        return this.frames[this.frameIndex];
    }

    CalculateNextFrameTime(time){
        return time + (this.frames[this.frameIndex].length)
    }
}

export {Animation}