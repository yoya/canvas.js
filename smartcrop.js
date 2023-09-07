"use strict";

import { createApp, ref, onMounted } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

function makeCanvasCheckboard(canvas) {
    const { width, height } = canvas;
    const ctx = canvas.getContext("2d");
    const [ pw, ph ] = [24, 24];
    const patternCanvas = new OffscreenCanvas(pw, ph);
    const imageData = new ImageData(pw, ph);
    const ctxP = patternCanvas.getContext("2d");
    for (let y = 0; y < ph ; y ++) {
        for (let x = 0; x < pw ; x ++) {
            const o = 4 * (x + y * pw);
            if (((x*2/pw)|0) == ((y*2/ph)|0)) {
                imageData.data.set([0,0,0,127], o);
            } else {
                imageData.data.set([255,255,255,127], o);
            }
        }
    }
    ctxP.putImageData(imageData, 0, 0);
    const pattern = ctx.createPattern(patternCanvas, "repeat");
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
}

createApp({
    setup() {
        const canvasRef = ref();
        let canvas;
        const image = new Image();
        image.onload = (e) => {
            const img = e.target;
            const { width, height } = img;
            Object.assign(canvas, { width, height });
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            makeCanvasCheckboard(canvas);
            smartcrop.crop(img, { width: 100, height: 100 }).then(function(result) {
                const { topCrop } = result;
                const [ x, y, w, h ] = [ topCrop.x, topCrop.y,
                                         topCrop.width, topCrop.height ];
                ctx.clearRect(x, y, w, h, x, y, w, h);
                ctx.drawImage(img, x, y, w, h, x, y, w, h);
            });
        }
        onMounted(() => {
            canvas = canvasRef.value;
            image.src = "img/l_kutsu_200826inochi01.jpg";
        });
        const dropFile = async (e) => {
            const file = e.dataTransfer.files[0];
            const reader = new FileReader();
            reader.readAsDataURL(file);
            await new Promise( resolve => reader.onload = () => resolve());
            image.src = reader.result;
        }
        return {
            canvasRef,
            dropFile,
        }
    }
}).mount('#app')


