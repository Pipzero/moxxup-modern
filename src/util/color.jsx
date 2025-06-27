import chroma from "chroma-js";
import CONSTANTS from '../constants'

export const setImageVariant = (product, color) => {
    // 1. search for option1 in variants available
    const variant = product.variants.find(p => p.option1 === color);
    if (variant) {
        // 2. get image_id from variant with matched color option
        const img = product.images.find(i => i.id === variant.image_id);
        if (img) {
            // 3. return new image by id
            return img.src;
        }
    }
    // else return product.imgSrc
    return product.imgSrc;
};

export const nameToRGB = color => {
    if (CONSTANTS.COLOR_MAP[color]) {
        color = CONSTANTS.COLOR_MAP[color]
    }
    return `rgb(${chroma(color).rgb().join(",")}`;
};

const invertColor = rgb => {
    rgb = rgb.replace(/[^\d,]/g, '').split(',');
    return (rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114) > 186 ? 'black' : 'white';
};

export const colorToComplementary = color => invertColor(nameToRGB(color));