"use strict";
/*
 * (c) 2024/09/08- yoya@awm.jp . All Rights Reserved.
 */

import { ImageDataEx, ImageDataProc, IMAGE_COMP_TYPE_GRAYSCALE, IMAGE_KERNEL_TYPE_DISK } from './imagedata.js';

// ImageDataProc 要らないかも？

new Vue({
    el: '#app',
    data: {
        openCanvas: null,
        kernelCanvas: null,
        previewImage: null,
        image: new Image(),
        imageDataEx: null, // 後でこっちに移す
        openCount: "4",
        kernelWidth: "5",
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
                const src = ee.target.result;
                this.image.src = src;
                this.previewImage.src = src;
            }
            reader.readAsDataURL(file);
        },
        onLoadImage() {
            const { image, openCanvas } = this;
            const { width, height } = image;
            openCanvas.width = width;
            openCanvas.height = height;
            const ctx = openCanvas.getContext("2d", { willReadFrequently: true });
            ctx.drawImage(image, 0, 0, width, height);
            const imageData = ctx.getImageData(0, 0, width, height);
            const imageDataEx = new ImageDataEx(imageData).grayscale();
            this.imageDataEx = imageDataEx;
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
            const { openCanvas, image, imageDataEx } = this;
            const { kernelCanvas } = this;
            const openCount = Number(this.openCount);
            const kernelWidth = Number(this.kernelWidth);
            const { width, height } = imageDataEx;
            const kernel = imageDataEx.makeKernel(IMAGE_KERNEL_TYPE_DISK, kernelWidth);
            console.log({kernel});
            const ex = imageDataEx.openImageData(kernel, kernelWidth, openCount);
            const imageData = ex.toImageData();
            const ctx = openCanvas.getContext("2d", { willReadFrequently: true });
            ctx.putImageData(imageData, 0, 0);
            // kernel描画
            const kernelImageDataEx = imageDataEx.getKernelImageData(kernel, kernelWidth);
            console.log({kernelImageDataEx});
            kernelImageDataEx.resize(kernelCanvas.width, kernelCanvas.height);
            const kernelImageData = kernelImageDataEx.toImageData();
            const kernelCtx = kernelCanvas.getContext("2d", { willReadFrequently: true });
            kernelCtx.putImageData(kernelImageData, 0, 0);
        },
    },
    mounted : function() {
        this.openCanvas = document.getElementById("openCanvas");
        this.kernelCanvas = document.getElementById("kernelCanvas");
        this.previewImage = document.getElementById("previewImage");
        const src = "img/rings_lg_orig.png";
        this.previewImage.src = src;
        this.image.src = src;
        this.image.onload = this.onLoadImage;
    },
})
