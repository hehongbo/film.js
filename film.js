class Film {
    constructor(
        selectorTarget = "",
        layers = [],
        options = {
            width: 0,
            height: 0,
            skipLoading: false,
            loadFirstFrame: false
        }
    ) {
        // Receive properties from parameters for future use.
        this.properties = {
            filmElement: document.querySelector(selectorTarget),
            width: options.width,
            height: options.height,
            layers: layers
        };

        // Set the Film element's position to relative since we might have multiple overlapped canvas with absolute
        // positions.
        this.properties.filmElement.style.position = "relative";
        this.properties.filmElement.style.objectFit = "cover";
        // Set the Film element's overflow to hidden since it's ratio may not necessarily be the same as the canvas
        // inside. In some situations, this can avoid confusion for some libraries' size detection.
        this.properties.filmElement.style.overflow = "hidden";

        // Kick off the loading procedure by default, unless pass skipLoading=true in the options.
        if (!options.skipLoading) {
            this.load(options.loadFirstFrame).then();
        }
    }

    load(loadFirstFrame = false) {
        // Template function to assemble each layer, return a Promise that resolves to an Object represents this layer.
        let loadLayer = (layerProperty, layerId) => {
            return new Promise(resolve => {
                // Set down a counter and decrease it with the "load" event listener after each img element is load.
                let pendingFrameCount = layerProperty.frames.length;
                let layerObject = {
                    patch: layerProperty.patch,
                    position: layerProperty.patch ? layerProperty.position : undefined,
                    startFrame: layerProperty.startFrame,
                    endFrame: layerProperty.startFrame + layerProperty.frames.length - 1,
                    freezing: (typeof layerProperty.freezing !== 'undefined') ?
                        layerProperty.freezing : {"start": false, "end": false},
                    frames: []
                };
                layerProperty.frames.forEach(url => {
                    // Create an img element.
                    let imgElement = document.createElement("img");
                    // Add an event listener callback to decrease the counter by one, and resolve the Promise when the
                    // counter hits zero.
                    imgElement.addEventListener("load", () => {
                        pendingFrameCount--;
                        if (pendingFrameCount === 0) {
                            resolve(layerObject);
                        }
                    }, {once: true});
                    // Put in the URL. That will result in the image being load, followed by the event listener defined
                    // above being triggered.
                    imgElement.src = url;
                    // Push the image element into the `frames` array in the layer's Object. It will finish the loading
                    // process and become usable eventually.
                    layerObject.frames.push(imgElement);
                });
                // Create a canvas element of this layer. All canvas elements should have the exact same size in its
                // attribute (Make sense for drawing) and "100%" in CSS styles (cover the entire div#targetElementName).
                let canvasElement = document.createElement("canvas");
                canvasElement.height = this.properties.height;
                canvasElement.width = this.properties.width;
                canvasElement.style.width = "100%";
                canvasElement.style.height = "100%";
                canvasElement.style.objectFit = "cover";
                // Except the first layer's canvas, every canvas should aligned in top-left corner and have absolute
                // position.
                if (layerId !== 0) {
                    canvasElement.style.position = "absolute";
                    canvasElement.style.top = "0";
                    canvasElement.style.left = "0";
                    canvasElement.zIndex = layerId;
                }
                this.properties.filmElement.appendChild(canvasElement);
            });
        };

        // Traverse each layer defined in the argument, trigger the `loadLayer()` function one by one and collect these
        // Promise Object together in an array.
        let pendingLayers = [];
        this.properties.layers.forEach((layer, id) => {
            pendingLayers.push(loadLayer(layer, id));
        });

        // Combine these Promises above, resolve and return the resulting Promise.
        return Promise.all(pendingLayers).then(resolvedAllLayers => {
            this.layers = resolvedAllLayers;
            if (loadFirstFrame) {
                this.requireFrame(0);
            }
        });
    }

    // Method to require some specific frame on all layers.
    requireFrame(frameN) {
        // Failsafe for handling non-integer inputs from scrolling libraries.
        frameN = Math.round(frameN);
        // Make sure there's no unprepared frames or otherwise `drawImage()` will fail.
        if (this.layers) {
            // Loop through all layers.
            this.layers.forEach((layer, id) => {
                // We use the `currentFrame` field to indicate the current frame's number, compare with required ones
                // during refresh, and store new value when complete. When calling this method for the first time,
                // it will be 'undefined'.
                if (frameN < layer.startFrame) { // When the required frame is ahead of this layer's time range.
                    // And was in between this layer's time range before. (Or being called for the first time.)
                    if (this.currentFrame >= layer.startFrame || typeof this.currentFrame === 'undefined') {
                        // Freeze at the first frame of this layer if required, or clear this layer otherwise.
                        if (layer.freezing.start) {
                            this.properties.filmElement.children[id].getContext("2d").drawImage(
                                layer.frames[0], // Point to the first frame and stay here until going into this range.
                                layer.patch ? layer.position.left : 0,
                                layer.patch ? layer.position.top : 0);
                        } else {
                            this.properties.filmElement.children[id].getContext("2d").clearRect(
                                0, 0, this.properties.width, this.properties.height);
                        }

                    }
                } else if (frameN >= layer.startFrame && frameN <= layer.endFrame) {
                    // When required frame is in this range.
                    this.properties.filmElement.children[id].getContext("2d").drawImage(
                        layer.frames[frameN - layer.startFrame], // Minus `startFrame` if it's not zero.
                        layer.patch ? layer.position.left : 0,
                        layer.patch ? layer.position.top : 0);
                } else { // When required frame is behind this layer's time range. (Last possible condition)
                    // And was in between this layer's time range before. (Or being called for the first time.)
                    if (this.currentFrame <= layer.endFrame || typeof this.currentFrame === 'undefined') {
                        // Freeze at the last frame of this layer if required, or clear this layer otherwise.
                        if (layer.freezing.end) {
                            this.properties.filmElement.children[id].getContext("2d").drawImage(
                                layer.frames[layer.endFrame - layer.startFrame], // Minus `startFrame` if it's not zero.
                                layer.patch ? layer.position.left : 0,
                                layer.patch ? layer.position.top : 0);
                        } else {
                            this.properties.filmElement.children[id].getContext("2d").clearRect(
                                0, 0, this.properties.width, this.properties.height);
                        }
                    }
                }
            });
            // Store new frame number.
            this.currentFrame = frameN;
        }
    }
}

module.exports = Film;
