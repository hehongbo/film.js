class OpenFilm {
    frameImgArr = [];
    targetElementName;

    constructor(targetElementName, layers, options) {
        this.targetElementName = targetElementName;
        layers.forEach(function (layer, id) {
            let imgArr = [];
            layer.frames.forEach(function (url) {
                let imgElement = document.createElement("img");
                imgElement.src = url;
                imgArr = imgArr.concat([imgElement]);
            });
            this.frameImgArr = this.frameImgArr.concat([imgArr]);
            let canvasElement = document.createElement("canvas");
            canvasElement.height = options.height;
            canvasElement.width = options.width;
            canvasElement.style.width = "100%";
            canvasElement.style.height = "100%";
            canvasElement.style.objectFit = "cover";
            if (id !== 0) {
                canvasElement.style.position = "absolute";
                canvasElement.style.top = "0";
                canvasElement.style.left = "0";
                canvasElement.zIndex = id;
            }
            document.getElementById(targetElementName).appendChild(canvasElement);
        }.bind(this));

        document.getElementById(targetElementName).style.position = "relative";
        document.getElementById(targetElementName).style.objectFit = "cover";

        this.requireFrame(0);
    }

    requireFrame(frameN) {
    }
}