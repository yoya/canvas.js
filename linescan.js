"use strict";

import { ImageDataEx, ImageDataProc } from './imagedata.js';

let vm = new Vue({
    el: '#app',
    data: {
        image: new Image(),
        canvas: null,
        imageDataEx: null, // 後でこっちに移す
        cutpathLength: 128, // px
        cutpathMargin: 30, // px
        //
        lineLength: 290,  // 台座の繋ぎの長さ
        imageScale: 1.0,  // 入力画像のスケール調整
        //
        opaqueW: 0,  opaqueH: 0,  // 入力画像の不透明部のサイズ
        dstX: 0,  dstY: 0,  // 画像を canvas の何処に貼るか
        grabX: 0,  grabY: 0,  // ボタンを押したマウスの最終位置
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
        onLoadImage() {
            const { image } = this;
            const imageScale = Number(this.imageScale);
            const width  = Math.min(Math.round(image.width  * imageScale),
                                    this.canvas.width - (this.cutpathMargin * 2));
            const height = Math.min(Math.round(image.height * imageScale),
                                    this.canvas.height - (this.cutpathMargin * 2));
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(image, 0, 0, width, height);
            const imageData = ctx.getImageData(0, 0, width, height);
            const imageDataEx = new ImageDataEx(imageData);
            const opaqueImageData = imageDataEx.opaqueImageData();
            this.imageDataEx = opaqueImageData;
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
        onInputImage(e) {
            this.onLoadImage();
            this.onInput(e);
        },
        rainbowGradient(x1, y1, x2, y2, loop) {
            const { canvas } = this;
            const ctx = canvas.getContext("2d");            
            const grad = ctx.createLinearGradient(x1, y1, x2, y2);
            const rainbowColors = ["red", "orange", "yellow", "green", "cyan", "bl\
ue", "violet"];
            const n = rainbowColors.length;
            for (let i = 0 ; i < n*loop; i += 1) {
                const c = rainbowColors[i%n]
                grad.addColorStop(i/(n*loop), c);
            }
            return grad;
        },
        update: function() {
            const { canvas, image, imageDataEx } = this;
            const lineLength = Number(this.lineLength);
            const { opaqueW, opaqueH } = this;
            const { dstX, dstY } = this;
            const { width, height } = canvas;
            canvas.width = width;  // all clear
            // 画像貼り付け
            const ctx = canvas.getContext("2d");
            ctx.putImageData(imageDataEx.toImageData(), dstX, dstY, 0, 0,
                             opaqueW, opaqueH);
            // レインボー色設定
            ctx.fillStyle = this.rainbowGradient(0, 0, width, height, 10);
            ctx.strokeStyle = ctx.fillStyle;
            // 台座のりしろ
            const footX = (width - lineLength) / 2;
            ctx.rect(footX, height - 4, lineLength, 4);
            ctx.fill();
            // 画像側ののりしろ
            const [matteX, matteY] = imageDataEx.opaqueScan(0, -1, lineLength);
            const [mX, mY] = [dstX + matteX, dstY + matteY];
            ctx.rect(mX - lineLength / 2, mY - 1, lineLength, 3);
            ctx.fill();
            //
            ctx.beginPath();
            ctx.lineWidth = 10;
            const left = {
                x1: mX - lineLength / 2, y1: mY,
                y2: (mY + height) / 2,
                x3: footX, y3: height,
            };
            ctx.moveTo(left.x1, left.y1);
            ctx.bezierCurveTo(left.x1, left.y2, left.x3, left.y2, left.x3, left.y3)
            ctx.stroke();
            // 右の支え
            const right = {
                x1: mX + lineLength / 2,  y1: mY,
                y2: (mY + height) / 2,
                x3:footX + lineLength, y3: height,
            };
            ctx.moveTo(right.x1, right.y1);
            ctx.bezierCurveTo(right.x1, right.y2, right.x3, right.y2, right.x3, right.y3)
            ctx.stroke();
        },
    },
    mounted : function() {
        const image = this.image;
        this.canvas = document.getElementById("canvas");
        image.onload = this.onLoadImage;
        image.src = "img/CMYK.png";
    },
})
    
