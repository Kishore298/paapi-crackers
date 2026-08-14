const bwipjs = require('bwip-js');

/**
 * Barcode Service - CODE128 barcode generation
 * Uses bwip-js for server-side barcode image generation
 */

const generateBarcode = async (text, options = {}) => {
  try {
    const pngBuffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: text,
      scale: options.scale || 3,
      height: options.height || 10,
      includetext: true,
      textxalign: 'center',
      textsize: 10,
    });

    return pngBuffer;
  } catch (error) {
    console.error('Barcode generation error:', error.message);
    throw new Error('Failed to generate barcode');
  }
};

/**
 * Generate barcode as base64 data URL
 */
const generateBarcodeBase64 = async (text, options = {}) => {
  const buffer = await generateBarcode(text, options);
  return `data:image/png;base64,${buffer.toString('base64')}`;
};

module.exports = {
  generateBarcode,
  generateBarcodeBase64,
};
