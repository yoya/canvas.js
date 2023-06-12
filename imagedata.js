const IMAGE_COMP_TYPE_GRAYSCALE = 1;
const IMAGE_COMP_TYPE_RGBA = 4;

const IMAGE_COMP_IDX_RED = 0;
const IMAGE_COMP_IDX_GREEN = 1;
const IMAGE_COMP_IDX_BLUE = 2;
const IMAGE_COMP_IDX_ALPHA = 3;

export class  ImageDataEx {
    constructor(width, height, opts = {}) {
        this.width = width;
        this.height = height;
        const compType = ("compType" in opts)? opts.compType: IMAGE_COMP_TYPE_RGBA;
        this.compType = compType;
        // colorDepth;
        switch (compType) {
        case IMAGE_TYPE_GRAYSCALE: {  // single channe image data
            this.data = new Uint8ClampedArray(width * height);
        } break;
        case IMAGE_TYPE_RGBA: {  // 4-channels image data
            this.data = new Uint8ClampedArray(4 * width * height);
        } break;
        default: {
            throw new exception("wrong compType:" + compType);
        } break;
        }
    }
}

export class ImageDataProc {
    imageData;
    constructor(imageData) {
        if (imageData instanceof ImageDataEx) {
            this.imageData = imageData;
        } else {
            throw new exception("not instanceof ImageDataEx:", imageData);
        }
    }
    getPlanceData(compIdx) {
        if (this.compType !== IMAGE_TYPE_GRAYSCALE) {
            throw new exception("wrong image comp type:", this.compType);
        }
        const { width, height, data } = this.imageData;
        const alphaData = new ImageDataEx(width, height, IMAGE_COMP_TYPE_GRAYSCALE);
        const d = alphaData.data;
        const len = data.length;
        for (let i = 0, j = compIdx; i < len; i++, j+=4) {
            d[i] = data[j];
        }
        return alphaData;
    }
    opaqueImageSize() {
        ;
    }
    getAlphaData() {
        return getPlanceData(IMAGE_COMP_ALPHA);
    }
    trimImage() {
        ;
    }
    extentImage(x, y, w, h) {
        ;
    }
    static foo() {
        console.log("foobaa");
    }
}
