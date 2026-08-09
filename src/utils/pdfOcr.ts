import * as pdfjs from 'pdfjs-dist'
import { createWorker, type Worker } from 'tesseract.js'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export interface PdfPageText {
  page: number
  text: string
}

export interface PdfDoc {
  id: string
  name: string
  pages: PdfPageText[]
  kind: 'order' | 'cmr'
  ocrUsed: boolean
}

let ocrWorker: Worker | null = null
let ocrWorkerPromise: Promise<Worker> | null = null

async function getOcrWorker(): Promise<Worker> {
  if (ocrWorker) return ocrWorker
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = (async () => {
      const worker = await createWorker('eng')
      ocrWorker = worker
      return worker
    })()
  }
  return ocrWorkerPromise
}

export async function terminateOcrWorker(): Promise<void> {
  if (ocrWorker) {
    await ocrWorker.terminate()
    ocrWorker = null
    ocrWorkerPromise = null
  }
}

async function renderPageToCanvas(
  page: pdfjs.PDFPageProxy,
  scale = 2,
): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not available for OCR')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  await page.render({
    canvasContext: ctx,
    viewport,
    canvas,
  }).promise
  return canvas
}

async function ocrPage(page: pdfjs.PDFPageProxy): Promise<string> {
  const canvas = await renderPageToCanvas(page, 2)
  const worker = await getOcrWorker()
  const result = await worker.recognize(canvas)
  canvas.width = 0
  canvas.height = 0
  return result.data.text || ''
}

function pageTextLength(text: string): number {
  return text.replace(/\s+/g, '').length
}

export async function readPdfFile(
  file: File,
  kind: 'order' | 'cmr',
  onProgress?: (message: string) => void,
): Promise<PdfDoc> {
  const data = new Uint8Array(await file.arrayBuffer())
  const pdf = await pdfjs.getDocument({ data }).promise
  const pages: PdfPageText[] = []
  let ocrUsed = false

  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    let text = content.items
      .map((item) => ('str' in item ? String(item.str) : ''))
      .join(' ')

    // Scanned CMR / image PDF: fall back to OCR
    if (pageTextLength(text) < 40) {
      onProgress?.(
        `OCR ${kind.toUpperCase()} “${file.name}” page ${i}/${pdf.numPages}…`,
      )
      text = await ocrPage(page)
      ocrUsed = true
    }

    pages.push({ page: i, text })
  }

  return {
    id: `${kind}-${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    pages,
    kind,
    ocrUsed,
  }
}

export function isLikelyCmrFile(fileName: string): boolean {
  return /\bcmr\b/i.test(fileName)
}
