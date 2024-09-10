export const IMAGE_COMP_TYPE_GRAYSCALE = 1;
const IMAGE_COMP_TYPE_RGBA = 4;

const IMAGE_COMP_IDX_RED = 0;
const IMAGE_COMP_IDX_GREEN = 1;
const IMAGE_COMP_IDX_BLUE = 2;
const IMAGE_COMP_IDX_ALPHA = 3;

export const IMAGE_KERNEL_TYPE_DISK = 1

export class ImageDataProc {
    constructor() { ; }
    getPlaneData(compIdx) {
        if (this.compType !== IMAGE_COMP_TYPE_GRAYSCALE) {
            throw new Error("wrong image comp type:" + this.compType);
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
    resize(resizeWidth, resizeHeight) {
        const { compType, width, height, data } = this;
        if ((compType !== IMAGE_COMP_TYPE_GRAYSCALE) &&
             (compType !== IMAGE_COMP_TYPE_RGBA)) {
            throw new Error("wrong image comp type:" + compType);
        }
        const opts = { compType }
        const imageDataEx = new ImageDataEx(resizeWidth, resizeHeight, opts);
        switch (compType) {
        case IMAGE_COMP_TYPE_GRAYSCALE: {
            for (let ry = 0; ry < resizeHeight; ry++) {
                const y = Math.floor(ry * height / resizeHeight);
                for (let rx = 0; rx < resizeWidth; rx++) {
                    const x = Math.floor(rx * width / resizeWidth);
                    const offset = x + width * y;
                    const roffset = rx + resizeWidth * ry;
                    imageDataEx.data[roffset] = data[offset];
                }
            }
        } break;
        case IMAGE_COMP_TYPE_RGBA: {
            for (let ry = 0; ry < resizeHeight; ry++) {
                const y = Math.floor(ry * height / resizeHeight);
                for (let rx = 0; rx < resizeWidth; rx++) {
                    const x = Math.floor(rx * width / resizeWidth);
                    let offset = (x + width * y) * 4;
                    let roffset = (rx + resizeWidth * ry) * 4;
                    imageDataEx.data[roffset++] = data[offset++];
                    imageDataEx.data[roffset++] = data[offset++];
                    imageDataEx.data[roffset++] = data[offset++];
                    imageDataEx.data[roffset++] = data[offset++];
                }
            }
        } break;
        default:
            throw new Error("wrong image comp type:" + compType);
        }
        Object.assign(this, imageDataEx);
    }
    openImageData(kernel, kernelWidth, count) {
        let imageData = this;
        for (let i = 0; i < count; i++) {
            imageData = imageData.erodeImageData(kernel, kernelWidth);
        }
        for (let i = 0; i < count; i++) {
            imageData = imageData.dilateImageData(kernel, kernelWidth);
        }
        return imageData;
    }
    makeKernel(kernelType, kernelWidth) {
        if (kernelWidth % 2 != 1) {
            throw new Error("kernelWidth need be odd number:" + kernelWidth);
        }
        const kernel = new Float32Array(kernelWidth * kernelWidth);
        switch (kernelType) {
        case IMAGE_KERNEL_TYPE_DISK: {
            const radius = (kernelWidth - 1) /  2;
            const limit_2 = radius * radius;
            let offset = 0;
            for (let y = 0; y < kernelWidth; y++) {
                for (let x = 0; x < kernelWidth; x++) {
                    const d_2 = (x-radius)**2 + (y-radius)**2;
                    if (d_2 <= limit_2*1.2) {
                        kernel[offset] = 1;
                    }
                    offset++;
                }
            }
        } break;
        default: {
            throw new Error("unknown kernelType:" + kernelType);
        } break;
        }
        return kernel;
    }
    getKernelImageData(kernel, kernelWidth) {
        const opts = { compType: IMAGE_COMP_TYPE_GRAYSCALE}
        const imageDataEx = new ImageDataEx(kernelWidth, kernelWidth, opts);
        const n = kernel.length;
        for (let i = 0; i < n; i++) {
            const v = 255
            if (kernel[i] > 0.5) {
                imageDataEx.data[i] = 255;
            } else {
                imageDataEx.data[i] = 0;
            }
        }
        return imageDataEx;
    }
    applyKernelImageData(kernelFunction, kernel, kernelWidth) {
        const { width, height } = this;
        const opts = { compType: IMAGE_COMP_TYPE_GRAYSCALE}
        const imageData = new ImageDataEx(width, height, opts);
        const data2 = 0;
        const kw1 = Math.floor(kernelWidth / 2);
        const kw2 = kernelWidth - kw1;
        let off = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const x1 = Math.max(0, x - kw1);
                const x2 = Math.min(width, x + kw2);
                const y1 = Math.max(0, y - kw1);
                const y2 = Math.min(height, y + kw2);
                const pixel = kernelFunction(x1, x2, y1, y2,
                                             kernel, kernelWidth)
                imageData.data[off++] = pixel;
            }
        }
        return imageData;
    }
    erodeKernelFunction(x1, x2, y1, y2, kernel, kernelWidth) {
        const { width, data } = this;
        let ko = kernel.length;
        let pixel = 255;
        for (let y = y1; y < y2; y++) {
            for (let x = x1; x < x2; x++) {
                const k = kernel[--ko];
                if (k > 0.5) {
                    const pixel_k = data[x + y * width];
                    if (pixel > pixel_k) {
                        pixel = pixel_k;
                    }
                }
            }
        }
        return pixel;
    }
    erodeImageData(kernel, kernelWidth) {
        if (this.compType !== IMAGE_COMP_TYPE_GRAYSCALE) {
            throw new Error("wrong image comp type:" + this.compType);
        }
        const imageData = this.applyKernelImageData(this.erodeKernelFunction.bind(this),
                                                    kernel, kernelWidth);
        return imageData;
    }
    dilateKernelFunction(x1, x2, y1, y2, kernel, kernelWidth) {
        const { width, data } = this;
        let ko = kernel.length;
        let pixel = 0;
        for (let y = y1; y < y2; y++) {
            for (let x = x1; x < x2; x++) {
                const k = kernel[--ko];
                if (k > 0.5) {
                    const pixel_k = data[x + y * width];
                    if (pixel < pixel_k) {
                        pixel = pixel_k;
                    }
                }
            }
        }
        return pixel;
    }
    dilateImageData(kernel, kernelWidth) {
        if (this.compType !== IMAGE_COMP_TYPE_GRAYSCALE) {
            throw new Error("wrong image comp type:", this.compType);
        }
        const imageData = this.applyKernelImageData(this.dilateKernelFunction.bind(this),
                                                    kernel, kernelWidth);
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
            throw new Error("wrong image comp type:" + compType);
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
