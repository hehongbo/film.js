class OpenFilm {
    constructor(targetElementName, layers, options) {
        // Receive `targetElementName` (the name of `div` element that holds canvas) during construct for future use.
        this.targetElementName = targetElementName;
        // Construct `imgArr` and canvas element for each layer.
        layers.forEach(function (layer, id) {
            // Build an array for images in each layers.
            // It's similar to `layers` array except each element is an img element instead of url string.
            //
            // frameImgArr
            // ├─ Array (frameImgArr[0])
            // │  └─ img
            // ├─ Array (frameImgArr[1])
            // │  ├─ img
            // │  ├─ img
            // │  ├─ ...
            // │  └─ img
            // └─ Array (frameImgArr[2])
            //    ├─ img
            //    ├─ img
            //    ├─ ...
            //    └─ img

            let imgArr = [];
            // Take each url string in frames[] and generate corresponding img element. Image will load on generation.
            layer.frames.forEach(function (url) {
                let imgElement = document.createElement("img");
                imgElement.src = url;
                imgArr = imgArr.concat([imgElement]);
            });
            // Append each collected array into frameImgArr[], and create one with first element if not existed.
            this.frameImgArr = (typeof this.frameImgArr !== 'undefined') ? this.frameImgArr.concat([imgArr]) : [imgArr];
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
    }
}