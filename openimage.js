"use strict";
/*
 * (c) 2024/09/08- yoya@awm.jp . All Rights Reserved.
 */

import { ImageDataEx, ImageDataProc } from './imagedata.js';

import { IMAGE_COMP_TYPE_GRAYSCALE } from './imagedata.js';
import {  IMAGE_KERNEL_TYPE_DISK } from './imagedata.js';
import { IMAGE_COMP_IDX_RED, IMAGE_COMP_IDX_GREEN, IMAGE_COMP_IDX_BLUE, IMAGE_COMP_IDX_ALPHA } from './imagedata.js';

// ImageDataProc 要らないかも？

new Vue({
    el: '#app',
    data: {
        openCanvas: null,
        kernelCanvas: null,
        previewImage: null,
        image: new Image(),  // 元画像
        imageData: null,
        openImageDataEx: null,
        //
        openAlpha: true,
        openImage: true,
        openCount: "2",
        kernelWidth: "5",
        guideLine: true,
        guideGap: "8",
        guideColor: "#FF0000",
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
            this.imageData = ctx.getImageData(0, 0, width, height);
            this.update();
        },
        onInput(e) {
            this.update();
        },
        onInputImage(e) {
            this.onLoadImage();
            this.onInput(e);
        },
        drawOpenImage() {
            const { openCanvas, image, imageData } = this;
            const { kernelCanvas } = this;
            const { openAlpha } = this;
            const openCount = Number(this.openCount);
            const kernelWidth = Number(this.kernelWidth);
            const { width, height } = imageData;
            const imageDataEx = new ImageDataEx(imageData);
            const kernel = imageDataEx.makeKernel(IMAGE_KERNEL_TYPE_DISK, kernelWidth);
            if (openAlpha) {
                const alpha = imageDataEx.getPlaneData(IMAGE_COMP_IDX_ALPHA);
                const openedAlpha = alpha.openImageData(kernel, kernelWidth, openCount);
                // imageDataEx.putPlaneData(IMAGE_COMP_IDX_ALPHA, openedAlpha);
                // this.openImageDataEx = imageDataEx;
                this.openImageDataEx = openedAlpha;
            } else {
                const opts = { applyAlpha: true };
                imageDataEx.grayscale(opts);
                const ex = imageDataEx.openImageData(kernel, kernelWidth, openCount);
                this.openImageDataEx = ex;
            }
            const ctx = openCanvas.getContext("2d", { willReadFrequently: true });
            ctx.putImageData(this.openImageDataEx.toImageData(), 0, 0);
            // kernel描画
            const kernelImageDataEx = imageDataEx.getKernelImageData(kernel, kernelWidth);
            console.log({kernelImageDataEx});
            kernelImageDataEx.resize(kernelCanvas.width, kernelCanvas.height);
            const kernelImageData = kernelImageDataEx.toImageData();
            const kernelCtx = kernelCanvas.getContext("2d", { willReadFrequently: true });
            kernelCtx.putImageData(kernelImageData, 0, 0);
        },
        drawGuideLine() {
            const { openCanvas, openImageDataEx } = this;
            const { width, height } = openCanvas;
            const ctx = openCanvas.getContext("2d", { willReadFrequently: true });
            if (openImageDataEx) {
                const imageData = openImageDataEx.toImageData();
                ctx.putImageData(imageData, 0, 0);
            }
            const guideGap = Number(this.guideGap);
            const { guideColor } = this;
            ctx.strokeStyle = guideColor;
            for (let x = 0; x < width ; x+= guideGap) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
            }
            for (let y = 0; y < height ; y+= guideGap) {
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
            }
            ctx.lineWidth = 0.5;
            ctx.stroke();
        },
        update: function() {
            const { openImage, guideLine } = this;
            if (openImage) {
                this.drawOpenImage();
            } else {
                this.openImageDataEx = null;
            }
            if (guideLine) {
                this.drawGuideLine();
            }
        },
    },
    mounted : function() {
        this.openCanvas = document.getElementById("openCanvas");
        this.kernelCanvas = document.getElementById("kernelCanvas");
        this.previewImage = document.getElementById("previewImage");
        const src = "img/rings_lg_orig-alpha-500x500.png";
        this.previewImage.src = src;
        this.image.src = src;
        this.image.onload = this.onLoadImage;
    },
})
