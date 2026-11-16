import { describe, expect, it } from 'vitest'
import PDFDocument from 'pdfkit'
import { drawMark, markSizeFor } from '../src/report/marks'
import type { MarkKind } from '../src/report/marks'

const buildPdf = async (kinds: MarkKind[]): Promise<Buffer> => {
  const doc = new PDFDocument({ size: 'A4', margin: 44, bufferPages: true })
  const chunks: Buffer[] = []
  doc.on('data', (chunk: Buffer) => chunks.push(chunk))
  const done = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  let y = 60
  for (const kind of kinds) {
    drawMark(doc, kind, { x: 50, y, size: markSizeFor(10), color: '#15803d' })
    y += 40
  }

  doc.end()
  return done
}

const operatorsOf = async (buffer: Buffer) => {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const parsed = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise
  const page = await parsed.getPage(1)
  return { page, pdfjs, opList: await page.getOperatorList() }
}

describe('矢量标记', () => {
  it('三种标记都画成矢量路径,不写任何文字', async () => {
    const buffer = await buildPdf(['pass', 'missing', 'gap'])
    const { opList, pdfjs } = await operatorsOf(buffer)

    expect(opList.fnArray).toContain(pdfjs.OPS.constructPath)
    expect(opList.fnArray).not.toContain(pdfjs.OPS.showText)
  })

  it('不依赖字体字形:标记内容不会出现在文本层', async () => {
    const buffer = await buildPdf(['pass', 'missing', 'gap'])
    const { page } = await operatorsOf(buffer)
    const text = (await page.getTextContent()).items
      .map((item) => ('str' in item ? item.str : ''))
      .join('')

    expect(text).not.toContain('\u221a')
    expect(text).not.toContain('\u2713')
    expect(text).not.toContain('\u25cb')
  })

  it('尺寸随字号缩放,极小字号也不会画出负宽度', async () => {
    expect(markSizeFor(8)).toBeCloseTo(6.56)
    expect(markSizeFor(11)).toBeCloseTo(9.02)
    expect(markSizeFor(0)).toBe(0)
  })

  it('绘制后恢复文档状态,不污染调用方的线宽与端点样式', async () => {
    const build = async (withMark: boolean) => {
      const doc = new PDFDocument({ size: 'A4', margin: 44, bufferPages: true })
      const chunks: Buffer[] = []
      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      const done = new Promise<Buffer>((resolve) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)))
      })

      doc.lineWidth(2.5).lineCap('butt').lineJoin('miter')
      if (withMark) {
        drawMark(doc, 'pass', { x: 50, y: 60, size: 9, color: '#15803d' })
      }
      doc.moveTo(50, 140).lineTo(200, 140).stroke()
      doc.end()

      const buffer = await done
      const { opList, pdfjs } = await operatorsOf(buffer)

      const stack: { width: number; cap: number; join: number }[] = []
      let state = { width: 1, cap: 0, join: 0 }
      const strokeStates: { width: number; cap: number; join: number }[] = []
      opList.fnArray.forEach((fn, index) => {
        const args = opList.argsArray[index]
        if (fn === pdfjs.OPS.save) stack.push({ ...state })
        else if (fn === pdfjs.OPS.restore) state = stack.length > 0 ? stack.pop()! : state
        else if (fn === pdfjs.OPS.setLineWidth) state.width = args[0] as number
        else if (fn === pdfjs.OPS.setLineCap) state.cap = args[0] as number
        else if (fn === pdfjs.OPS.setLineJoin) state.join = args[0] as number
        else if (fn === pdfjs.OPS.constructPath) strokeStates.push({ ...state })
      })
      return strokeStates
    }

    const plain = await build(false)
    const marked = await build(true)

    expect(plain.length).toBeGreaterThan(0)
    expect(marked.length).toBeGreaterThan(0)
    expect(plain[plain.length - 1].width).toBe(2.5)
    expect(marked[marked.length - 1].width).toBe(2.5)
    expect(marked[marked.length - 1].cap).toBe(plain[plain.length - 1].cap)
    expect(marked[marked.length - 1].join).toBe(plain[plain.length - 1].join)
  })
})
