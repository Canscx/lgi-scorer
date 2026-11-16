export type MarkKind = 'pass' | 'missing' | 'gap'

export interface MarkOptions {
  x: number
  y: number
  size: number
  color: string
}

const stroke = (doc: PDFKit.PDFDocument, color: string, width: number) => {
  doc.save()
  doc.lineCap('round').lineJoin('round').lineWidth(width).strokeColor(color)
}

export const markSizeFor = (fontSize: number) => fontSize * 0.82

export const drawMark = (doc: PDFKit.PDFDocument, kind: MarkKind, options: MarkOptions) => {
  const { x, y, size, color } = options
  const at = (rx: number, ry: number) => ({ x: x + size * rx, y: y + size * ry })

  if (kind === 'pass') {
    const a = at(0.08, 0.52)
    const b = at(0.38, 0.84)
    const c = at(0.94, 0.16)
    stroke(doc, color, Math.max(0.7, size * 0.14))
    doc.moveTo(a.x, a.y).lineTo(b.x, b.y).lineTo(c.x, c.y).stroke()
    doc.restore()
    return
  }

  if (kind === 'missing') {
    const radius = size * 0.36
    stroke(doc, color, Math.max(0.6, size * 0.12))
    doc.circle(x + size / 2, y + size / 2, radius).stroke()
    doc.restore()
    return
  }

  const a = at(0.18, 0.18)
  const b = at(0.82, 0.82)
  const c = at(0.82, 0.18)
  const d = at(0.18, 0.82)
  stroke(doc, color, Math.max(0.7, size * 0.13))
  doc.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke()
  doc.moveTo(c.x, c.y).lineTo(d.x, d.y).stroke()
  doc.restore()
}
