export const IMAGE_COMP_TYPE_GRAYSCALE = 1;
const IMAGE_COMP_TYPE_RGBA = 4;

const IMAGE_COMP_IDX_RED = 0;
const IMAGE_COMP_IDX_GREEN = 1;
const IMAGE_COMP_IDX_BLUE = 2;
const IMAGE_COMP_IDX_ALPHA = 3;

export class ImageDataProc {
    constructor() { ; }
    getPlaneData(compIdx) {
        if (this.compType !== IMAGE_COMP_TYPE_GRAYSCALE) {
            throw new Error("wrong image comp type:", this.compType);
        }
        const { width, height, data } = this;
        const alphaImageData = new ImageDataEx(width, height, IMAGE_COMP_TYPE_GRAYSCALE);
        const d = alphaImageData.data;
        const len = data.length;
        for (let i = 0, j = compIdx; i < len; i++, j+=4) {
            d[i] = data[j];
        }
        return alphaImageData;
    }
    cropImageData(x, y, w, h) {
        const { width, height, data } = this;
        const line = width * 4;
        const cImageData = new ImageDataEx(w, h);
        const cData = cImageData.data;
        const cLine = w * 4;
        for (let y2  = 0; y2 < h; y2++) {
            const yOff = 4 * x + (y + y2) * line;
            cData.set(data.subarray(yOff, yOff + cLine), y2  * cLine);
        }
        return cImageData;
    }
    opaqueScan(dx, dy, len) { //透明でない部分を探す
        const { width, height, data } = this;
        let v, alpha = 10;
        let xcenter = 0, ycenter = 0;
        function pixelContinuous() {
            this.m = false; // 前のピクセルが不透明
            this.l = 0;
            this.lmax = 0;
            this.center = 0;
            this.scan = function(posi, cond) {
                const { m, lmax } = this;
                let { l } =  this;
                if (cond) {
                    l = (m)? (l+1): 1;
                    this.m = true;
                } else {
                    l = 0;
                    this.m  = false;
                }
                this.l = l;
                if (lmax < l) {
                    this.lmax = l;
                    this.center = posi - l / 2;
                }
            }
            this.result = function() {
                return [this.lmax, this.center];
            }
        }
        if (dx > 0) {
            for (let x = 0; x < width; x++) {
                const pcont = new pixelContinuous();
                for (let y = 0; y < height; y++) {
                    const o = 4 * (x + y * width) + 3;
                    pcont.scan(y, data[o] >= alpha);
                }
                const [lmax, ycenter] = pcont.result();
                if (len <= lmax) {
                    return [x, ycenter];
                }
            }
            v = width;
        } else if (dx < 0) {
            for (let x = width - 1; x >= 0; x--) {
                const pcont = new pixelContinuous();
                for (let y = 0; y < height; y++) {
                    const o = 4 * (x + y * width) + 3;
                    pcont.scan(y, data[o] >= alpha);
                }
                const [lmax, ycenter] = pcont.result();
                if (len <= lmax) {
                    return [x, ycenter];
                }
            }
            v = 0;
        } else if (dy > 0) {
            for (let y = 0; y < height; y++) {
                const pcont = new pixelContinuous();
                for (let x = 0; x < width; x++) {
                    const o = 4 * (x + y * width) + 3;
                    pcont.scan(x, data[o] >= alpha);
                }
                const [lmax, xcenter] = pcont.result();
                if (len <= lmax) {
                    return [xcenter, y];
                }
            }
            v = height;
        } else if (dy < 0) {
            for (let y = height - 1; y >= 0; y--) {
                const pcont = new pixelContinuous();
                for (let x = 0; x < width; x++) {
                    const o = 4 * (x + y * width) + 3;
                    pcont.scan(x, data[o] >= alpha);
                }
                const [lmax, xcenter] = pcont.result();
                if (len <= lmax) {
                    return [xcenter, y];
                }
            }
            v = 0;
        } else {
            console.error("opaqueScan:", {dx, dy});
        }
        return [v, 0, 0];
    }
    opaqueImageData() { //透明でない部分の画像
        const { width, height, data } = this;
        // opaqueScan imageData, dx, dy, len
        const [oX] = this.opaqueScan(1, 0, 1);
        const [dummyX, oY] = this.opaqueScan(0, 1, 1);
        const [oX2] = this.opaqueScan(-1, 0, 1);
        const [dummyX2, oY2] = this.opaqueScan(0, -1, 1);
        const oW = oX2 - oX;
        const oH = oY2 - oY;
        const oImageData = this.cropImageData(oX, oY, oW, oH);
        return oImageData;
    }
    getAlphaData() {
        return this.getPlaneData(IMAGE_COMP_ALPHA);
    }
    openImageData(kernel, kernelWidth, count) {
        // console.debug("openImageData", {kernel, kernelWidth, count})
        let imageData = this;
        for (let i = 0; i < count; i++) {
            imageData = imageData.erodeImageData(kernel, kernelWidth);
        }
        for (let i = 0; i < count; i++) {
            imageData = imageData.dilateImageData(kernel, kernelWidth);
        }
        return imageData;
    }
    erodeImageData(kernel, kernelWidth) {
        if (this.compType !== IMAGE_COMP_TYPE_GRAYSCALE) {
            throw new Error("wrong image comp type:", this.compType);
        }
        const { width, height, data } = this;
        const opts = { compType: IMAGE_COMP_TYPE_GRAYSCALE}
        const imageData = new ImageDataEx(width, height, opts);
        const data2 = 0;
        const kw1 = Math.floor(kernelWidth / 2);
        const kw2 = kernelWidth - kw1;
        let off = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let pixel = 0
                // カーネル処理
                let ko = kernel.length;
                const h1 = Math.max(0, y - kw1);
                const h2 = Math.min(height, y + kw2);
                for (let yy = h1; yy < h2; yy++) {
                    const w1 = Math.max(0, x - kw1);
                    const w2 = Math.min(width, x + kw2);
                    for (let xx = w1; xx < w2; xx++) {
                        const k = kernel[--ko];
                        if (k > 0.5) {
                            if (pixel < data[off]) {
                                pixel = data[xx + yy * width];
                            }
                        }
                    }
                }
                imageData.data[off++] = pixel;
            }
        }
        return imageData;
    }
    dilateImageData(kernel, kernelWidth) {
        return this;
        const { width, height, data } = this;
        const opts = { compType: IMAGE_COMP_TYPE_GRAYSCALE}
        const imageData = new ImageDataEx(width, height, opts);
        return imageData;
    }
    trimImage() {
        ;
    }
    extentImage(x, y, w, h) {
        ;
    }
}

export class  ImageDataEx extends ImageDataProc {
    constructor(...args) {
        super();
        let data = null, width, height, opts = undefined;
        const arg0 = args[0];
        if (arg0 instanceof ImageData) {
            let imageData;
            [ imageData, opts] = args;
            width = imageData.width;
            height = imageData.height;
            data  = imageData.data;
        } else if (arg0 instanceof Array) {
            [data, width, height, opts] = args;
        } else if (Number.isInteger(arg0)) {
            [width, height, opts] = args;
        }
        this.width = width;
        this.height = height;
        opts = (opts === undefined)? {}: opts;
        this.opts = opts;
        const compType = ("compType" in opts)? opts.compType: IMAGE_COMP_TYPE_RGBA;
        this.compType = compType;
        // colorDepth;
        switch (compType) {
        case IMAGE_COMP_TYPE_GRAYSCALE: {  // single channe image data
            if (data) {
                throw new Error("IMAGE_COMP_TYPE_GRAYSCALE data:", data);
            }
            this.data = new Uint8ClampedArray(width * height);
        } break;
        case IMAGE_COMP_TYPE_RGBA: {  // 4-channels image data
            if (data) {
                this.data = data;
            } else {
                this.data = new Uint8ClampedArray(4 * width * height);
            }
        } break;
        default: {
            throw new Error("wrong compType:" + compType);
        } break;
        }
    }
    grayscale() {
        const { compType, data, width, height } = this;
        if (compType === IMAGE_COMP_TYPE_GRAYSCALE) {
            console.warn("already grayscale image");
            return ;
        }
        if (compType !== IMAGE_COMP_TYPE_RGBA) {
            throw new Error("wrong image comp type:", {compType});
        }
        const n = width * height;
        this.data = new Uint8ClampedArray(n);
        for (let i=0, j=0; i < n; i++, j+=4) {
            const v = (2*data[j] + 5*data[j+1] + data[j+2]) / 8;
            this.data[i] = v;
        }
        this.compType = IMAGE_COMP_TYPE_GRAYSCALE;
        return this;
    }
    toImageData() {
        const { width, height, data ,compType } = this;
        // console.debug("toImageData", { width, height, data ,compType });
        const imageData = new ImageData(width, height);
        switch (compType) {
        case IMAGE_COMP_TYPE_GRAYSCALE: {  // single channe image data
            const samples = width * height;
            let o = 0
            for (let i = 0; i < samples; i++) {
                imageData.data[o++] = data[i];
                imageData.data[o++] = data[i];
                imageData.data[o++] = data[i];
                imageData.data[o++] = 255;
            }
        } break;
        case IMAGE_COMP_TYPE_RGBA: {  // 4-channels image data
            imageData.data.set(data);
        } break;
        default: {
            throw new Error("wrong compType:" + compType);
        } break;
        }
        return imageData;
    }
}
