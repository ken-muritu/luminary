#!/usr/bin/env node
/**
 * generate-icons.cjs
 * Generates build/icon.png (512×512) and build/icon.ico (256×256)
 * from the Luminary brand colours — pure Node.js, zero external dependencies.
 *
 * Run: node scripts/generate-icons.cjs
 */

'use strict'

const fs   = require('fs')
const path = require('path')
const zlib = require('zlib')

// ─── CRC-32 ──────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

// ─── PNG helpers ─────────────────────────────────────────────────────────────
function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const lenBuf    = Buffer.allocUnsafe(4); lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf    = Buffer.allocUnsafe(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0)
  return Buffer.concat([lenBuf, typeBytes, data, crcBuf])
}

/**
 * Draws a solid PNG with an optional rounded rect + lightning-bolt overlay.
 * Returns a Buffer containing a valid PNG file.
 */
function makePNG(size) {
  // --- pixel buffer (RGBA) ---
  const px = new Uint8Array(size * size * 4)

  // Brand colours
  const BG1 = { r: 0x6C, g: 0x5C, b: 0xE7 }   // #6C5CE7  top-left
  const BG2 = { r: 0x40, g: 0x29, b: 0xBA }   // #4029BA  bottom-right

  // Rounded rect corner radius: 22 % of size
  const radius = Math.round(size * 0.22)

  function inRoundedRect(x, y) {
    const cx = Math.min(Math.max(x, radius), size - 1 - radius)
    const cy = Math.min(Math.max(y, radius), size - 1 - radius)
    const dx = x - cx, dy = y - cy
    return dx * dx + dy * dy <= radius * radius
  }

  // Lightning bolt path — 8-point polygon (relative to size)
  // Matches the SVG path: M18 4L8 18h8l-2 10 14-16h-8L18 4z (viewBox 0 0 32 32)
  const scale = size / 32
  const bolt = [
    [18 * scale, 4  * scale],
    [8  * scale, 18 * scale],
    [16 * scale, 18 * scale],
    [14 * scale, 28 * scale],
    [28 * scale, 12 * scale],
    [20 * scale, 12 * scale],
  ]

  // Point-in-polygon (ray casting)
  function inBolt(px, py) {
    let inside = false
    const n = bolt.length
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const [xi, yi] = bolt[i]
      const [xj, yj] = bolt[j]
      if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
        inside = !inside
      }
    }
    return inside
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      const t   = (x + y) / (2 * size)  // gradient parameter

      if (!inRoundedRect(x, y)) {
        // fully transparent outside the rounded rect
        px[idx + 3] = 0
        continue
      }

      // Gradient background
      px[idx]     = Math.round(BG1.r + (BG2.r - BG1.r) * t)
      px[idx + 1] = Math.round(BG1.g + (BG2.g - BG1.g) * t)
      px[idx + 2] = Math.round(BG1.b + (BG2.b - BG1.b) * t)
      px[idx + 3] = 255

      // White lightning bolt overlay
      if (inBolt(x, y)) {
        px[idx]     = 255
        px[idx + 1] = 255
        px[idx + 2] = 255
        px[idx + 3] = 255
      }
    }
  }

  // Build PNG raw data: 1 filter byte + 4 bytes per pixel per row
  const rowLen = 1 + size * 4
  const raw    = Buffer.allocUnsafe(rowLen * size)
  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0  // filter: None
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4
      const dst = y * rowLen + 1 + x * 4
      raw[dst]     = px[src]
      raw[dst + 1] = px[src + 1]
      raw[dst + 2] = px[src + 2]
      raw[dst + 3] = px[src + 3]
    }
  }

  const sig  = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6  // bit-depth 8, colour type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

  const idat = zlib.deflateSync(raw, { level: 6 })

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

/**
 * Wraps a PNG buffer in an ICO container (supports embedded PNGs, Vista+).
 */
function makeICO(pngBuf) {
  const iconDir = Buffer.from([0x00, 0x00, 0x01, 0x00, 0x01, 0x00])
  const entry   = Buffer.allocUnsafe(16)
  entry[0] = 0; entry[1] = 0  // width / height: 0 = 256
  entry[2] = 0; entry[3] = 0  // colorCount / reserved
  entry.writeUInt16LE(1,  4)  // planes
  entry.writeUInt16LE(32, 6)  // bitCount
  entry.writeUInt32LE(pngBuf.length, 8)   // data size
  entry.writeUInt32LE(6 + 16,        12)  // data offset
  return Buffer.concat([iconDir, entry, pngBuf])
}

// ─── Main ────────────────────────────────────────────────────────────────────
const rootDir  = path.join(__dirname, '..')
const buildDir = path.join(rootDir, 'build')
const publicDir = path.join(rootDir, 'public')
fs.mkdirSync(buildDir, { recursive: true })
fs.mkdirSync(publicDir, { recursive: true })

console.log('Generating icons…')

const png512 = makePNG(512)
fs.writeFileSync(path.join(buildDir, 'icon.png'), png512)
fs.writeFileSync(path.join(publicDir, 'pwa-icon-512.png'), png512)
console.log('  ✓  build/icon.png + public/pwa-icon-512.png  (512 × 512)')

const png192 = makePNG(192)
fs.writeFileSync(path.join(publicDir, 'pwa-icon-192.png'), png192)
console.log('  ✓  public/pwa-icon-192.png  (192 × 192)')

const png180 = makePNG(180)
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png180)
console.log('  ✓  public/apple-touch-icon.png  (180 × 180)')

const png32 = makePNG(32)
fs.writeFileSync(path.join(publicDir, 'favicon-32.png'), png32)
console.log('  ✓  public/favicon-32.png  (32 × 32)')

const png256 = makePNG(256)
const ico    = makeICO(png256)
fs.writeFileSync(path.join(buildDir, 'icon.ico'), ico)
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico)
console.log('  ✓  build/icon.ico + public/favicon.ico  (256 × 256)')

// Placeholder for macOS — electron-builder can convert PNG to ICNS on macOS
fs.writeFileSync(path.join(buildDir, 'icon.icns'), png512)
console.log('  ✓  build/icon.icns (placeholder — replace with real ICNS on macOS)')

console.log('\nDone. Icons written to build/ and public/')
