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

/**
 * Copy a PNG to the clipboard.
 * Must be called synchronously from a user gesture: pass a Promise that
 * resolves to the PNG blob (browser keeps the write "armed" while it runs).
 */
export async function copyPngBlobToClipboard(
  png: Blob | Promise<Blob>,
): Promise<void> {
  if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
    throw new Error('Clipboard image copy is not supported in this browser')
  }
  window.focus()
  await navigator.clipboard.write([
    new ClipboardItem({ 'image/png': png }),
  ])
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
