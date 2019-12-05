class OpenFilm {
    constructor(targetElementName, layers, options) {
        // Receive `targetElementName` (the name of `div` element that holds canvas) during construct for future use.
        this.targetElementName = targetElementName;
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

        // Load first frame.
        this.requireFrame(0);
    }

    // Method to require some specific frame on all layers.
    requireFrame(frameN) {
        // Failsafe for handling non-integer inputs from scrolling libraries.
        let round = !Number.isInteger(frameN);
        // Make sure there's no unprepared frames or otherwise `drawImage()` will fail.
        if (this.unpreparedFrameCount === 0) {
            // Loop through all layers.
            this.layers.forEach(function (layer, id) {
                // We use the `currentFrame` field to indicate the current frame's number, compare with required ones during refresh,
                // and store new value when complete. When calling this method for the first time, it will be 'undefined'.
                if (typeof this.currentFrame === 'undefined') {
                    document.getElementById(this.targetElementName).children[id].getContext("2d").drawImage(
                        !round ? layer.frames[frameN] : layer.frames[Math.round(frameN)],
                        layer.patch ? layer.position.left : 0,
                        layer.patch ? layer.position.top : 0);
                } else if (frameN <= layer.startFrame) { // When the required frame is ahead of this layer's time range.
                    if (this.currentFrame > layer.startFrame) { // And was in between this layer's time range before.
                        document.getElementById(this.targetElementName).children[id].getContext("2d").drawImage(
                            layer.frames[layer.startFrame], // Point to the first frame and stay here until going into this range.
                            layer.patch ? layer.position.left : 0,
                            layer.patch ? layer.position.top : 0);
                    }
                } else if (frameN > layer.startFrame && frameN < layer.endFrame) { // When required frame is in this range.
                    document.getElementById(this.targetElementName).children[id].getContext("2d").drawImage(
                        !round ? layer.frames[frameN] : layer.frames[Math.round(frameN)],
                        layer.patch ? layer.position.left : 0,
                        layer.patch ? layer.position.top : 0);
                } else { // When required frame is behind this layer's time range. (Last possible condition)
                    if (this.currentFrame < layer.endFrame) { // And was in between this layer's time range before.
                        document.getElementById(this.targetElementName).children[id].getContext("2d").drawImage(
                            layer.frames[layer.endFrame], // Point to the last frame and stay here until going into this range.
                            layer.patch ? layer.position.left : 0,
                            layer.patch ? layer.position.top : 0);
                    }
                }
            }.bind(this));
            // Store new frame number.
            this.currentFrame = !round ? frameN : Math.round(frameN);
        }
    }
}