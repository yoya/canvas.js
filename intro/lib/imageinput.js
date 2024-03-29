"use strict";

function imageinput(canvas, callback) {
    const image = new Image();
    image.onload = () => {
        const ctx = canvas.getContext('2d');
        const { width, height } = image;
        Object.assign(canvas, { width, height });
        ctx.drawImage(image, 0, 0, width, height);
        callback();
    }
    image.src = "img/fujisan.jpg";
    document.addEventListener("dragover", (e) => {
        e.preventDefault();
    }, false);
    document.addEventListener("drop", async function(e) {
        e.preventDefault();
        //e.stopPropagation();
        const file = e.dataTransfer.files[0];
        const reader = new FileReader();
        reader.readAsDataURL(file);
        await new Promise(resolve => reader.onload = () => resolve());
        image.src = reader.result;
        await image.decode();
    }, false);
    document.addEventListener("paste", async function(e) {
        e.preventDefault();
        const contents = await navigator.clipboard.read();
        const item = contents[0];
        if (! item.types.includes("image/png")) {
            console.warn("Clipboard contains non-image data.");
            return ;
        }
        const blob = await item.getType("image/png");
        image.src = URL.createObjectURL(blob);
        await image.decode();
    }, false);
}
