class OpenFilm {
    constructor(targetElementName, layers, options) {
        // Receive `targetElementName` (the name of `div` element that holds canvas) during construct for future use.
        this.targetElementName = targetElementName;
        layers.forEach(function (layer, id) {
            // Copy everything from the `layers` parameter, except frames[] is made up of img element(s) instead of their URL.
            let layerSlice = {
                patch: layer.patch,
                position: layer.patch ? layer.position : undefined,
                startFrame: layer.startFrame,
                endFrame: layer.startFrame + layer.frames.length - 1,
                frames: []
            };
            layer.frames.forEach(function (url) {
                let imgElement = document.createElement("img");
                imgElement.src = url;
                layerSlice.frames = layerSlice.frames.concat([imgElement]);
            });
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

    requireFrame(frameN) {
        this.currentFrame = frameN;
    }
}