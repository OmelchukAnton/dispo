import { toPng } from 'html-to-image'

export function checklistImageFileName(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `checklist-${y}-${m}-${d}.png`
}

export function downloadDataUrl(dataUrl: string, fileName: string): void {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = fileName
  a.click()
}

/** Capture only the table element as a PNG (full scroll size). */
export async function captureTablePng(table: HTMLElement): Promise<string> {
  const width = Math.ceil(table.scrollWidth)
  const height = Math.ceil(table.scrollHeight)
  return toPng(table, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
    width,
    height,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      margin: '0',
      transform: 'none',
    },
    filter: (node) => {
      if (!(node instanceof HTMLElement)) return true
      return !node.classList.contains('export-hide')
    },
  })
}
