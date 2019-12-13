class Film {
    constructor(targetElementName, layers, options) {
        // Receive properties from parameters for future use.
        this.properties = {
            element: targetElementName, // the name of `div` element that holds canvas.
            width: options.width,
            height: options.height
        };
        layers.forEach(function (layer, id) {
            // Create a counter for frames to load (on `id == 0`) or add up the counter (on `id > 0`).
            this.unpreparedFrameCount = (typeof this.unpreparedFrameCount !== 'undefined') ?
                this.unpreparedFrameCount + layer.frames.length : layer.frames.length;
            // Copy everything from the `layers` parameter, except frames[] is made up of img element(s) instead of their URL.
            let layerSlice = {
                patch: layer.patch,
                position: layer.patch ? layer.position : undefined,
                startFrame: layer.startFrame,
                endFrame: layer.startFrame + layer.frames.length - 1,
                freezing: (typeof layer.freezing !== 'undefined') ? layer.freezing : {"start": false, "end": false},
                frames: []
            };
            layer.frames.forEach(function (url) {
                // Create an img element.
                let imgElement = document.createElement("img");
                // Add a one-time event listener before putting the URL into imgElement's attribute. This will result in
                // the image being load. When loading is complete, the registered callback function will decrease the
                // counter by one. So `unpreparedFrameCount === 0` indicates that assets of this instance are fully
                // loaded.
                imgElement.addEventListener("load", function () {
                    this.unpreparedFrameCount = this.unpreparedFrameCount - 1;
                }.bind(this), {once: true});
                imgElement.src = url;
                layerSlice.frames = layerSlice.frames.concat([imgElement]);
            }.bind(this));
            // Append slice into this.layers[], and create one with first slice if not existed.
            this.layers = (typeof this.layers !== 'undefined') ? this.layers.concat([layerSlice]) : [layerSlice];

            // Create a canvas element of this layer. All canvas elements should have the exact same size in its
            // attribute (Make sense for drawing) and "100%" in CSS styles (cover the entire div#targetElementName).
            let canvasElement = document.createElement("canvas");
            canvasElement.height = options.height;
            canvasElement.width = options.width;
            canvasElement.style.width = "100%";
            canvasElement.style.height = "100%";
            canvasElement.style.objectFit = "cover";
            // Except the first layer's canvas, every canvas should aligned in top-left corner and have absolute position.
            if (id !== 0) {
                canvasElement.style.position = "absolute";
                canvasElement.style.top = "0";
                canvasElement.style.left = "0";
                canvasElement.zIndex = id;
            }
            document.getElementById(targetElementName).appendChild(canvasElement);
        }.bind(this));

        // Set div#targetElementName's position to relative since we might have multiple overlapped canvas with absolute positions.
        document.getElementById(targetElementName).style.position = "relative";
        document.getElementById(targetElementName).style.objectFit = "cover";
        // Set div#targetElementName's overflow to hidden since it's ratio may not necessarily be the same as the canvas
        // inside. In some situations, this can avoid confusion for some libraries' size detection.
        document.getElementById(targetElementName).style.overflow = "hidden";

        // Load first frame if required.
        if (options.loadFirstFrame) {
            // In case some assets are still unprepared (typically they do), we check `unpreparedFrameCount` variable
            // and wait for them with a `waitForUnpreparedFrames` function. If every asset is prepared, trigger frame
            // load. If not, register itself for a timeout callback to check later.
            let waitForUnpreparedFrames = function () {
                if (this.unpreparedFrameCount === 0) {
                    this.requireFrame(0);
                } else {
                    console.log(this.unpreparedFrameCount + " asset(s) are still not ready yet. Retry in 0.5s.");
                    setTimeout(waitForUnpreparedFrames, 500);
                }
            }.bind(this);
            waitForUnpreparedFrames();
        }
    }

    // Method to require some specific frame on all layers.
    requireFrame(frameN) {
        // Failsafe for handling non-integer inputs from scrolling libraries.
        frameN = Math.round(frameN);
        // Make sure there's no unprepared frames or otherwise `drawImage()` will fail.
        if (this.unpreparedFrameCount === 0) {
            // Loop through all layers.
            this.layers.forEach(function (layer, id) {
                // We use the `currentFrame` field to indicate the current frame's number, compare with required ones during refresh,
                // and store new value when complete. When calling this method for the first time, it will be 'undefined'.
                if (frameN < layer.startFrame) { // When the required frame is ahead of this layer's time range.
                    // And was in between this layer's time range before. (Or being called for the first time.)
                    if (this.currentFrame >= layer.startFrame || typeof this.currentFrame === 'undefined') {
                        // Freeze at the first frame of this layer if required, or clear this layer otherwise.
                        if (layer.freezing.start) {
                            document.getElementById(this.properties.element).children[id].getContext("2d").drawImage(
                                layer.frames[0], // Point to the first frame and stay here until going into this range.
                                layer.patch ? layer.position.left : 0,
                                layer.patch ? layer.position.top : 0);
                        } else {
                            document.getElementById(this.properties.element).children[id].getContext("2d").clearRect(
                                0, 0, this.properties.width, this.properties.height);
                        }

                    }
                } else if (frameN >= layer.startFrame && frameN <= layer.endFrame) { // When required frame is in this range.
                    document.getElementById(this.properties.element).children[id].getContext("2d").drawImage(
                        layer.frames[frameN - layer.startFrame], // Minus `startFrame` if it's not zero.
                        layer.patch ? layer.position.left : 0,
                        layer.patch ? layer.position.top : 0);
                } else { // When required frame is behind this layer's time range. (Last possible condition)
                    // And was in between this layer's time range before. (Or being called for the first time.)
                    if (this.currentFrame <= layer.endFrame || typeof this.currentFrame === 'undefined') {
                        // Freeze at the last frame of this layer if required, or clear this layer otherwise.
                        if (layer.freezing.end) {
                            document.getElementById(this.properties.element).children[id].getContext("2d").drawImage(
                                layer.frames[layer.endFrame - layer.startFrame], // Minus `startFrame` if it's not zero.
                                layer.patch ? layer.position.left : 0,
                                layer.patch ? layer.position.top : 0);
                        } else {
                            document.getElementById(this.properties.element).children[id].getContext("2d").clearRect(
                                0, 0, this.properties.width, this.properties.height);
                        }
                    }
                }
            }.bind(this));
            // Store new frame number.
            this.currentFrame = frameN;
        } else {
            console.warn("Frame " + frameN + " is required, but " + this.unpreparedFrameCount +
                " assets are still loading in progress. Check connection if this continues.");
        }
    }
}