"use strict";
/*
 * (c) 2024/09/08- yoya@awm.jp . All Rights Reserved.
 */

import { ImageDataEx, ImageDataProc, IMAGE_COMP_TYPE_GRAYSCALE } from './imagedata.js';

// ImageDataProc 要らないかも？

new Vue({
    el: '#app',
    data: {
        canvas: document.createElement("canvas"),
        image: new Image(),
        imageDataEx: null, // 後でこっちに移す
        openCount: 1,
    },
    methods: {
        clamp(x, a, b) {
            if (x < a) { return a; }
            else if (b < x) { return b; }
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
        onLoadImage() {
            const { image, canvas } = this;
            const { width, height } = image;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(image, 0, 0, width, height);
            const imageData = ctx.getImageData(0, 0, width, height);
            const imageDataEx = new ImageDataEx(imageData).grayscale();
            this.imageDataEx = imageDataEx;
            imageDataEx.grayscale();
            this.update();
        },
        onInput(e) {
            this.update();
        },
        onInputImage(e) {
            this.onLoadImage();
            this.onInput(e);
        },
        update: function() {
            const { canvas, image, imageDataEx } = this;
            const { width, height } = imageDataEx;
            const kernel = [ 0, 1, 0,
                             1, 1, 1,
                             0, 1, 0 ];
            const kernelWidth = 3;
            const ex = imageDataEx.openImageData(kernel, kernelWidth,
                                                 Number(this.openCount));
            const imageData = ex.toImageData();
            // const imageData = imageDataEx.toImageData();
            console.log({imageData});
            const ctx = canvas.getContext("2d");
            ctx.putImageData(imageData, 0, 0);
        },
    },
    mounted : function() {
        const image = this.image;
        this.canvas = document.getElementById("canvas");
        image.onload = this.onLoadImage;
        //        image.src = "img/CMYK.png";
        image.src = "img/rings_lg_orig.png";;
    },
})
