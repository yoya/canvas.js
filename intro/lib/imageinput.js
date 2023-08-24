"use strict";

function imageinput(canvas, callback) {
    let image = new Image();
    image.onload = () => {
        const ctx = canvas.getContext('2d');
        const { width, height } = image;
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(image, 0, 0, width, height);
        callback(image);
    }
    image.src = "fujisan.jpg";
    const cancelEvent = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const dropEvent = async (e) => {
    const file = e.dataTransfer.files[0];
    const reader = new FileReader();
          reader.readAsDataURL(file);
          await new Promise(resolve => reader.onload = () => resolve());
          image.src = reader.result;
      }
      document.addEventListener("dragover" , cancelEvent, false);
      document.addEventListener("dragenter", cancelEvent, false);
      document.addEventListener("drop", async function(e) {
          cancelEvent(e);
          await dropEvent(e);
      }, false);
}
