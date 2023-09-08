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

function makeCanvasAutoCrop(canvas, image, aspects) {
    const { width, height } = image;
    Object.assign(canvas, { width, height });
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, width, height);
    makeCanvasCheckboard(canvas);
    let aspectW = 100, aspectH = 100;
    switch (aspects[0]) {
    case "1:1":
        [aspectW, aspectH ] = [100, 100];
        break;
    case "4:3":
        [aspectW, aspectH ] = [400, 300];
        break;
    case "16:9":
        [aspectW, aspectH ] = [160, 90];
        break;
    case "3:4":
        [aspectW, aspectH ] = [300, 400];
        break;
    case "9:16":
        [aspectW, aspectH ] = [90, 160];
        break;
    }
    smartcrop.crop(image, { width: aspectW, height: aspectH }).then(function(result) {
        const { topCrop } = result;
        const [ x, y, w, h ] = [ topCrop.x, topCrop.y,
                                 topCrop.width, topCrop.height ];
        ctx.clearRect(x, y, w, h, x, y, w, h);
        ctx.drawImage(image, x, y, w, h, x, y, w, h);
        const tc = JSON.stringify(topCrop, null , "    ");
        resultText.innerHTML = "<pre><code>" + tc + "</code></pre>";
    });
}

createApp({
    setup() {
        const canvasRef = ref();
        const filename = ref("img/ExEObmoVEAUVuxM.jpg");
        const aspects = ref("1:1");
        const width = ref();
        const height = ref();
        let canvas;
        const image = new Image();
        image.onload = () => {
            width.value = image.width;
            height.value = image.height;
            makeCanvasAutoCrop(canvas, image, {0:"1:1"});
        }
        onMounted(() => {
            canvas = canvasRef.value;
            image.src = "img/ExEObmoVEAUVuxM.jpg";
        });
        const onAspect = (e) => {
            const opts = Array.from(e.target.selectedOptions).map((e) => e.value);
            makeCanvasAutoCrop(canvas, image, aspects.value);
        }
        const onFile = async (e) => {
            const url = e.target.value;
            image.src = url;
        }
        const onDrop = async (e) => {
            const file = e.dataTransfer.files[0];
            const reader = new FileReader();
            reader.readAsDataURL(file);
            await new Promise( resolve => reader.onload = () => resolve());
            image.src = reader.result;
            filename.value = "";
        }
        return {
            canvasRef, width, height, aspects, filename,
            onAspect, onFile, onDrop,
        }
    }
}).mount('#app')


