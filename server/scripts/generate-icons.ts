import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const PUBLIC_ROOT = path.resolve(process.cwd(), '..', 'web', 'public')
const SOURCE = path.join(PUBLIC_ROOT, 'favicon.svg')

const PNG_TARGETS = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 }
]

const ICO_SIZES = [16, 32, 48]

const renderPng = async (image: Awaited<ReturnType<typeof loadImage>>, size: number) => {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, 0, 0, size, size)
  return canvas.encode('png')
}

const buildIco = (entries: { size: number; png: Buffer }[]) => {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(entries.length, 4)

  const directory = Buffer.alloc(16 * entries.length)
  let offset = header.length + directory.length

  entries.forEach((entry, index) => {
    const base = index * 16
    directory.writeUInt8(entry.size >= 256 ? 0 : entry.size, base)
    directory.writeUInt8(entry.size >= 256 ? 0 : entry.size, base + 1)
    directory.writeUInt8(0, base + 2)
    directory.writeUInt8(0, base + 3)
    directory.writeUInt16LE(1, base + 4)
    directory.writeUInt16LE(32, base + 6)
    directory.writeUInt32LE(entry.png.length, base + 8)
    directory.writeUInt32LE(offset, base + 12)
    offset += entry.png.length
  })

  return Buffer.concat([header, directory, ...entries.map((entry) => entry.png)])
}

const main = async () => {
  const image = await loadImage(await readFile(SOURCE))

  for (const target of PNG_TARGETS) {
    const png = await renderPng(image, target.size)
    await writeFile(path.join(PUBLIC_ROOT, target.name), png)
    console.log(`${target.name}  ${target.size}x${target.size}  ${png.length} 字节`)
  }

  const entries = []
  for (const size of ICO_SIZES) {
    entries.push({ size, png: await renderPng(image, size) })
  }
  const ico = buildIco(entries)
  await writeFile(path.join(PUBLIC_ROOT, 'favicon.ico'), ico)
  console.log(`favicon.ico  ${ICO_SIZES.join('/')}  ${ico.length} 字节`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
