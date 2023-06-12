const IMAGE_COMP_TYPE_GRAYSCALE = 1;
const IMAGE_COMP_TYPE_RGBA = 4;

const IMAGE_COMP_IDX_RED = 0;
const IMAGE_COMP_IDX_GREEN = 1;
const IMAGE_COMP_IDX_BLUE = 2;
const IMAGE_COMP_IDX_ALPHA = 3;

export class ImageDataProc {
    constructor() { ; }
    getPlanceData(compIdx) {
        if (this.compType !== IMAGE_COMP_TYPE_GRAYSCALE) {
            throw new exception("wrong image comp type:", this.compType);
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
            this.scan = function(posi, opaque) {
                const { m, lmax } = this;
                let { l } =  this;
                if (opaque) {
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
        return this.getPlanceData(IMAGE_COMP_ALPHA);
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
                throw new exception("IMAGE_COMP_TYPE_GRAYSCALE data:", data);
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
            throw new exception("wrong compType:" + compType);
        } break;
        }
    }
    toImageData() {
        const { width, height, data } = this;
        const imageData = new ImageData(width, height);
        imageData.data.set(data);
        return imageData;
    }
}
