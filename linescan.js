"use strict";

import { ImageDataEx, ImageDataProc } from './imagedata.js';

let vm = new Vue({
    el: '#app',
    data: {
        image: new Image(),
        canvas: null,
        imageDataEx: null,
        cutpathLength: 100,
        lineLength:290,
        opaqueW:0, opaqueH:0,
        dstX:0, dstY:0,
        grabX: 0,
        grabY: 0,
    },
    methods: {
        clamp(x, a, b) {
            if (x < a) { return a;
            } else if (b < x) { return b; }
            return x;
        },
        dropFile(e) {
            let file = e.dataTransfer.files[0];
            let reader = new FileReader();
            reader.onload = (ee) => {
                this.image.src = ee.target.result;
            }
            reader.readAsDataURL(file);
        },
        opaqueScan(imageData, dx, dy) { //透明でない部分を探す
            const { width, height, data } = imageData;
            let v;
            if (dx > 0) {
                v = width;
                for (let x = 0; x < width; x++) {
                    for (let y = 0; y < height; y++) {
                        const o = 4 * (x + y * width) + 3;
                        if (data[o] > 127) {
                            return x;
                        }
                    }
                }
            } else if (dx < 0) {
                v = 0;
                for (let x = width - 1; x >= 0; x--) {
                    for (let y = 0; y < height; y++) {
                        const o = 4 * (x + y * width) + 3;
                        if (data[o] > 127) {
                            return x;
                        }
                    }
                }
            } else if (dy > 0) {
                v = height;
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const o = 4 * (x + y * width) + 3;
                        if (data[o] > 127) {
                            return y;
                        }
                    }
                }
            } else if (dy < 0) {
                v = 0;
                for (let y = height - 1; y >= 0; y--) {
                    for (let x = 0; x < width; x++) {
                        const o = 4 * (x + y * width) + 3;
                        if (data[o] > 1) {
                            return y;
                        }
                    }
                }
            } else {
                console.error("opaqueScan:", {dx, dy});
            }
            return v;
        },
        cropImageData(imageData, x, y, w, h) {
            const { width, height, data } = imageData;
            const line = width * 4;
            const cImageData = new ImageData(w, h);
            const cData = cImageData.data;
            const cLine = w * 4;
            for (let y2  = 0; y2 < h; y2++) {
                const yOff = 4 * x + (y + y2) * line;
                cData.set(data.subarray(yOff, yOff + cLine), y2  * cLine);
            }
            return cImageData;
        },
        opaqueImageData(imageData) { //透明でない部分の画像
            const { width, height, data } = imageData;
            const oX = this.opaqueScan(imageData, 1, 0);
            const oY = this.opaqueScan(imageData, 0, 1);
            const oX2 = this.opaqueScan(imageData, -1, 0);
            const oY2 = this.opaqueScan(imageData, 0, -1);
            const oW = oX2 - oX;
            const oH = oY2 - oY;
            const oImageData = this.cropImageData(imageData, oX, oY, oW, oH);
            return oImageData;
        },
        onLoadImage(e) {
            const { canvas, image } = this;
            const { width, height } = image;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(image, 0, 0, width, height);
            const imageData = ctx.getImageData(0, 0, width, height);
            const opaqueImageData = this.opaqueImageData(imageData);
            this.imageData = opaqueImageData;
            this.opaqueW = opaqueImageData.width;
            this.opaqueH =  opaqueImageData.height;
            this.dstX = (width - this.opaqueW) / 2;
            this.dstY = (height - this.opaqueH) / 2;
            //
            this.update();
        },
        onMousedown(e) {
            const {offsetX, offsetY} = e;
            this.grabX = offsetX;
            this.grabY = offsetY;
        },
        onMousemove(e) {
            if (e.buttons) {
                const {offsetX, offsetY} = e;
                const { width, height } = this.canvas;
                let { dstX, dstY, opaqueW, opaqueH } = this;
                const dx = offsetX - this.grabX;
                const dy = offsetY - this.grabY;
                dstX += dx;
                dstY += dy;
                this.dstX = this.clamp(dstX, 0, width - opaqueW - 1);
                this.dstY = this.clamp(dstY, 0, height - opaqueH - 1);
                this.grabX = offsetX;
                this.grabY = offsetY;
                this.update();
            }
        },
        onMouseleave(e) {
            this.onMousemove(e);
        },
        onInput(e) {
            this.update();
        },
        update: function() {
            const { canvas, image, lineLength } = this;
            const { opaqueW, opaqueH } = this;
            const { dstX, dstY } = this;
            const { width, height } = canvas;
            canvas.width = width;  // clear
            const ctx = canvas.getContext("2d");
            ctx.putImageData(this.imageData, dstX, dstY, 0, 0,
                             opaqueW, opaqueH);
            ctx.fillStyle = "black";
            ctx.rect((width - lineLength) / 2, height - 4, lineLength, 4);
            ctx.fill();
        },
    },
    mounted : function() {
        const image = this.image;
        this.canvas = document.getElementById("canvas");
        image.onload = this.onLoadImage;
        image.src = "img/CMYK.png";
    },
})
    
