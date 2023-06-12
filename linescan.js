"use strict";

import { ImageDataEx, ImageDataProc } from './imagedata.js';

let vm = new Vue({
    el: '#app',
    data: {
        image: new Image(),
        canvas: null,
        imageData: null,
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
        opaqueScan(imageData, dx, dy, len) { //透明でない部分を探す
            const { width, height, data } = imageData;
            let v, alpha = 10;
            let xcenter = 0, ycenter = 0;
            if (dx > 0) {
                for (let x = 0; x < width; x++) {
                    let m = false; // 前のピクセルが不透明
                    let l = 0;
                    let lmax = 0;
                    for (let y = 0; y < height; y++) {
                        const o = 4 * (x + y * width) + 3;
                        if (data[o] < alpha) {
                            m  = false;
                            l = 0;
                        } else {
                            m = true;
                            l = (m)? (l+1): 1;
                        }
                        if (lmax < l) {
                            lmax = l;
                            ycenter = y - l/2;
                        }
                    }
                    if (len <= lmax) {
                        return [x, ycenter];
                    }
                }
                v = width;
            } else if (dx < 0) {
                for (let x = width - 1; x >= 0; x--) {
                    let m = false; // 前のピクセルが不透明
                    let l = 0;
                    let lmax = 0;
                    for (let y = 0; y < height; y++) {
                        const o = 4 * (x + y * width) + 3;
                        if (data[o] < alpha) {
                            m  = false;
                            l = 0;
                        } else {
                            m = true;
                            l = (m)? (l+1): 1;
                        }
                        if (lmax < l) {
                            lmax = l;
                            ycenter = y - l/2;
                        }
                    }
                    if (len <= lmax) {
                        return [x, ycenter];
                    }
                }
                v = 0;
            } else if (dy > 0) {
                for (let y = 0; y < height; y++) {
                    let m = false; // 前のピクセルが不透明
                    let l = 0;
                    let lmax = 0;
                    for (let x = 0; x < width; x++) {
                        const o = 4 * (x + y * width) + 3;
                        if (data[o] < alpha) {
                            m  = false;
                            l = 0;
                        } else {
                            m = true;
                            l = (m)? (l+1): 1;
                        }
                        if (lmax < l) {
                            lmax = l;
                            xcenter = x - l/2;
                        }
                    }
                    if (len <= lmax) {
                        return [xcenter, y];
                    }
                }
                v = height;
            } else if (dy < 0) {
                for (let y = height - 1; y >= 0; y--) {
                    let m = false; // 前のピクセルが不透明
                    let l = 0;
                    let lmax = 0;
                    for (let x = 0; x < width; x++) {
                        const o = 4 * (x + y * width) + 3;
                        if (data[o] < alpha) {
                            m  = false;
                            l = 0;
                        } else {
                            m = true;
                            l = (m)? (l+1): 1;
                        }
                        if (lmax < l) {
                            lmax = l;
                            xcenter = x - l/2;
                        }
                    }
                    if (len <= lmax) {
                        return [xcenter, y];
                    }
                }
                v = 0;
            } else {
                console.error("opaqueScan:", {dx, dy});
            }
            return [v, 0, 0];
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
            // opaqueScan imageData, dx, dy, len
            const [oX] = this.opaqueScan(imageData, 1, 0, 1);
            const [dummyX, oY] = this.opaqueScan(imageData, 0, 1, 1);
            const [oX2] = this.opaqueScan(imageData, -1, 0, 1);
            const [dummyX2, oY2] = this.opaqueScan(imageData, 0, -1, 1);
            const oW = oX2 - oX;
            const oH = oY2 - oY;
            const oImageData = this.cropImageData(imageData, oX, oY, oW, oH);
            return oImageData;
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
            const { canvas, image, imageData } = this;
            const lineLength = Number(this.lineLength);
            const { opaqueW, opaqueH } = this;
            const { dstX, dstY } = this;
            const { width, height } = canvas;
            canvas.width = width;  // all clear
            // 画像貼り付け
            const ctx = canvas.getContext("2d");
            ctx.putImageData(imageData, dstX, dstY, 0, 0,
                             opaqueW, opaqueH);
            // レインボー色設定
            ctx.fillStyle = this.rainbowGradient(0, 0, width, height, 10);
            ctx.strokeStyle = ctx.fillStyle;
            // 台座のりしろ
            const footX = (width - lineLength) / 2;
            ctx.rect(footX, height - 4, lineLength, 4);
            ctx.fill();
            // 画像側ののりしろ
            const [matteX, matteY] = this.opaqueScan(imageData, 0, -1, lineLength);
            const [mX, mY] = [dstX + matteX, dstY + matteY];
            ctx.rect(mX - lineLength / 2, mY - 1, lineLength, 3);
            ctx.fill();
            //
            ctx.beginPath();
            ctx.lineWidth = 10;
            // 左の支え
            ctx.moveTo(mX - lineLength / 2, mY);
            ctx.lineTo(footX, height);
            ctx.closePath();
            ctx.stroke();
            // 右の支え
            ctx.moveTo(mX + lineLength / 2, mY);
            console.log({footX, lineLength, height});
            ctx.lineTo(footX + lineLength, height);
            ctx.closePath();
            ctx.stroke();
            console.log({matteX, matteY});
        },
    },
    mounted : function() {
        const image = this.image;
        this.canvas = document.getElementById("canvas");
        image.onload = this.onLoadImage;
        image.src = "img/CMYK.png";
    },
})
    
