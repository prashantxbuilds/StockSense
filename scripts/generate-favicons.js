/**
 * generate-favicons.js
 * 
 * Generates all required favicon sizes from a source 512x512 PNG.
 * Uses only Node.js built-ins + the 'sharp' package for resizing.
 * 
 * Run: node generate-favicons.js
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const SOURCE = process.argv[2] || path.join(__dirname, 'source_icon.png')
const OUT_PUBLIC = path.join(__dirname, '..', 'public')
const OUT_APP = path.join(__dirname, '..', 'app')

// Ensure output dirs exist
if (!fs.existsSync(OUT_PUBLIC)) fs.mkdirSync(OUT_PUBLIC, { recursive: true })

const sizes = [
  { size: 16,  name: 'favicon-16x16.png' },
  { size: 32,  name: 'favicon-32x32.png' },
  { size: 48,  name: 'favicon-48x48.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
]

async function run() {
  console.log(`\nReading source: ${SOURCE}`)

  if (!fs.existsSync(SOURCE)) {
    console.error('ERROR: Source file not found:', SOURCE)
    process.exit(1)
  }

  // Generate each PNG size
  for (const { size, name } of sizes) {
    const dest = path.join(OUT_PUBLIC, name)
    await sharp(SOURCE)
      .resize(size, size, { fit: 'cover', kernel: 'lanczos3' })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(dest)
    console.log(`✓ Generated ${size}x${size} → public/${name}`)
  }

  // Copy 512x512 as app/icon.png (Next.js App Router auto-serves this as /icon.png)
  const appIcon = path.join(OUT_APP, 'icon.png')
  await sharp(SOURCE)
    .resize(512, 512, { fit: 'cover', kernel: 'lanczos3' })
    .png({ compressionLevel: 9 })
    .toFile(appIcon)
  console.log(`✓ Copied 512x512 → app/icon.png (Next.js auto-favicon)`)

  // Copy apple-touch-icon to app/ for Next.js metadata
  const appApple = path.join(OUT_APP, 'apple-icon.png')
  await sharp(SOURCE)
    .resize(180, 180, { fit: 'cover', kernel: 'lanczos3' })
    .png({ compressionLevel: 9 })
    .toFile(appApple)
  console.log(`✓ Generated 180x180 → app/apple-icon.png (Next.js auto-apple-touch)`)

  // Build favicon.ico (multi-size: 16, 32, 48)
  // ICO format: https://en.wikipedia.org/wiki/ICO_(file_format)
  // We'll embed 3 PNG images in the ICO container (modern browsers support PNG in ICO)
  const icoSizes = [16, 32, 48]
  const pngBuffers = await Promise.all(
    icoSizes.map(size =>
      sharp(SOURCE)
        .resize(size, size, { fit: 'cover', kernel: 'lanczos3' })
        .png({ compressionLevel: 9 })
        .toBuffer()
    )
  )

  const icoBuffer = buildIco(pngBuffers, icoSizes)
  const icoPath = path.join(OUT_PUBLIC, 'favicon.ico')
  fs.writeFileSync(icoPath, icoBuffer)
  console.log(`✓ Built favicon.ico (16+32+48 px multi-size) → public/favicon.ico`)

  // Also copy to root for legacy support
  const rootIco = path.join(__dirname, '..', 'favicon.ico')
  fs.writeFileSync(rootIco, icoBuffer)
  console.log(`✓ Copied favicon.ico → project root`)

  console.log('\n✅ All favicons generated successfully!\n')
}

/**
 * Build a multi-size ICO file from PNG buffers.
 * ICO with PNG payloads (modern browsers handle this fine).
 */
function buildIco(pngBuffers, sizes) {
  const numImages = pngBuffers.length

  // ICO header: 6 bytes
  // Each directory entry: 16 bytes
  // Then PNG data
  const headerSize = 6 + numImages * 16
  let dataOffset = headerSize

  const offsets = []
  for (const buf of pngBuffers) {
    offsets.push(dataOffset)
    dataOffset += buf.length
  }

  const totalSize = dataOffset
  const ico = Buffer.alloc(totalSize)

  // ICO Header
  ico.writeUInt16LE(0, 0)          // Reserved, must be 0
  ico.writeUInt16LE(1, 2)          // Type: 1 = ICO
  ico.writeUInt16LE(numImages, 4)  // Number of images

  // Directory entries
  for (let i = 0; i < numImages; i++) {
    const entryOffset = 6 + i * 16
    const size = sizes[i]
    const buf = pngBuffers[i]

    ico.writeUInt8(size >= 256 ? 0 : size, entryOffset + 0)  // Width (0 = 256)
    ico.writeUInt8(size >= 256 ? 0 : size, entryOffset + 1)  // Height (0 = 256)
    ico.writeUInt8(0, entryOffset + 2)   // Color count (0 = no palette)
    ico.writeUInt8(0, entryOffset + 3)   // Reserved
    ico.writeUInt16LE(1, entryOffset + 4)  // Color planes
    ico.writeUInt16LE(32, entryOffset + 6) // Bits per pixel
    ico.writeUInt32LE(buf.length, entryOffset + 8)  // Size of image data
    ico.writeUInt32LE(offsets[i], entryOffset + 12) // Offset of image data
  }

  // Copy PNG data
  let offset = headerSize
  for (const buf of pngBuffers) {
    buf.copy(ico, offset)
    offset += buf.length
  }

  return ico
}

run().catch(err => {
  console.error('FATAL:', err)
  process.exit(1)
})
