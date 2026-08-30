const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Function to generate a simple PNG buffer with custom dimensions and color
function createPng(width, height, r, g, b, a = 255) {
  // Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // Bit depth
  ihdr.writeUInt8(6, 9); // Color type: 6 = RGBA
  ihdr.writeUInt8(0, 10); // Compression method
  ihdr.writeUInt8(0, 11); // Filter method
  ihdr.writeUInt8(0, 12); // Interlace method

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw Image Data (Scanlines)
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // Filter byte per scanline
    for (let x = 0; x < width; x++) {
      const cx = width / 2;
      const cy = height / 2;
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);
      const isIconShape = (dx / (width * 0.45) + dy / (height * 0.45)) <= 1.0;

      if (isIconShape) {
        // LeetCode Gold/Orange: #FFA116 -> (255, 161, 22)
        rawData.push(255, 161, 22, 255);
      } else {
        // Deep Obsidian Dark Background: #1E1E2E -> (30, 30, 46)
        rawData.push(30, 30, 46, 255);
      }
    }
  }

  const compressedData = zlib.deflateSync(Buffer.from(rawData));
  const idatChunk = makeChunk('IDAT', compressedData);

  // IEND Chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

// Standard CRC32 table & calculation for PNG chunks
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Generate icons
const iconsDir = path.join(__dirname, '../icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 48, 128].forEach(size => {
  const iconBuffer = createPng(size, size, 255, 161, 22);
  const iconPath = path.join(__dirname, `icon-${size}.png`);
  fs.writeFileSync(iconPath, iconBuffer);
  console.log(`Generated ${iconPath}`);
});
