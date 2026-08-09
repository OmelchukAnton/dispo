import { useMemo, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

interface PdfPageText {
  page: number
  text: string
}

interface PdfDoc {
  id: string
  name: string
  pages: PdfPageText[]
}

interface LoadingPlace {
  company: string
  street: string
  postalCode: string
  city: string
  mapsQuery: string
}

interface RefHit {
  id: string
  fileName: string
  page: number
  ref: string
  context: string
  loadingPlace: LoadingPlace | null
  mapsUrl: string | null
  score: number
}

const LOADING_RE =
  /\b(?:load(?:ing|ed)?|chargement|charg[ée]e?|prise\s+en\s+charge|verladung|beladung|laden|carico|caricamento|za[łl]adunek|za[łl]adowanie|załadunek)\b/i

const REF_PATTERNS: RegExp[] = [
  /(?:ref(?:erence)?(?:\s*(?:no|number|#|nr))?)\s*[:#-]?\s*([A-Z0-9][A-Z0-9/_-]{4,})/gi,
  /(?:order(?:\s*(?:no|number|#|nr))?)\s*[:#-]?\s*([A-Z0-9][A-Z0-9/_-]{4,})/gi,
  /(?:loading\s+ref(?:erence)?)\s*[:#-]?\s*([A-Z0-9][A-Z0-9/_-]{4,})/gi,
  /(?:r[ée]f(?:[ée]rence)?(?:\s*(?:n[o°]|nr|#))?)\s*[:#-]?\s*([A-Z0-9][A-Z0-9/_-]{4,})/gi,
  /(?:commande(?:\s*(?:n[o°]|nr|#))?)\s*[:#-]?\s*([A-Z0-9][A-Z0-9/_-]{4,})/gi,
  /(?:referenz(?:nummer)?|auftrag(?:snummer)?|bestell(?:nummer|ung)?)\s*[:#-]?\s*([A-Z0-9][A-Z0-9/_-]{4,})/gi,
  /(?:riferimento|rif(?:erimento)?|ordine(?:\s*n[o°]?)?|numero\s+ordine)\s*[:#-]?\s*([A-Z0-9][A-Z0-9/_-]{4,})/gi,
  /(?:numer\s+referencyjny|nr\s+ref(?:erencji)?|numer\s+zlecenia|nr\s+zlecenia|referencja)\s*[:#-]?\s*([A-Z0-9][A-Z0-9/_-]{4,})/gi,
  /\b(26\d{7})\b/g,
]

const POSTAL_RE =
  /\b(?:(?:FR|DE|PL|IT|ES|NL|BE|AT|CZ|SK|LT|LV|EE|RO|HU|PT|CH|LU)[-\s]?)?(?:\d{2}-\d{3}|\d{4}\s?[A-Z]{2}|\d{4,5})\b/i

const STREET_RE =
  /\b(?:rue|road|rd|street|st\.?|avenue|ave|av\.?|boulevard|blvd|platz|strasse|straße|str\.?|weg|gasse|allee|allée|chemin|impasse|place|ul\.?|ulica|via|viale|corso|calle|plaza|park|parc|industriepark|zone|zi|drog[ai]|aleja)\b/i

const COMPANY_RE =
  /\b(gmbh|sas|sa|sarl|bv|nv|ltd|llc|inc|ag|kg|srl|spa|oy|ab|as|sp\.?\s*z\.?\s*o\.?o\.?|logistics|transport|trans|distri|warehous|company|societ[àa]|unternehmen|firma)\b/i

function normalizeSpaces(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function extractContext(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 60)
  const end = Math.min(text.length, index + length + 80)
  return normalizeSpaces(text.slice(start, end))
}

function extractLoadingPlace(text: string): LoadingPlace | null {
  const loadIdx = text.search(LOADING_RE)
  const chunk =
    loadIdx >= 0
      ? text.slice(Math.max(0, loadIdx - 40), Math.min(text.length, loadIdx + 360))
      : text.slice(0, 420)

  const postalMatch = chunk.match(POSTAL_RE)
  const postalCode = postalMatch
    ? normalizeSpaces(postalMatch[0].toUpperCase())
    : ''

  let company = ''
  let street = ''
  let city = ''

  const parts = chunk
    .split(/[\n,;|]/)
    .map((p) => normalizeSpaces(p))
    .filter((p) => p.length > 2)

  for (const part of parts) {
    if (!street && STREET_RE.test(part)) {
      street = part
      continue
    }
    if (!company && COMPANY_RE.test(part)) {
      company = part.replace(POSTAL_RE, '').trim()
      continue
    }
  }

  if (postalCode) {
    const after =
      chunk.split(
        new RegExp(postalCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      )[1] ?? ''
    const maybeCity = normalizeSpaces(
      after.replace(/^[,.\-\s]+/, '').split(/[,\n]/)[0] ?? '',
    )
    if (
      maybeCity &&
      /[A-Za-zÀ-ÿ]{2,}/.test(maybeCity) &&
      maybeCity.length < 50 &&
      !STREET_RE.test(maybeCity)
    ) {
      city = maybeCity
    }
  }

  if ((!company || !street) && parts[0]) {
    const head = parts[0]
    if (!company && /[A-Za-zÀ-ÿ]{3,}/.test(head)) {
      company = head.replace(POSTAL_RE, '').replace(/\s{2,}/g, ' ').trim()
    }
    const streetPart = parts.find(
      (p) => STREET_RE.test(p) || /^\d+\s+\S+/.test(p),
    )
    if (streetPart && !street) street = streetPart
  }

  const mapsParts = [company, street, postalCode, city].filter(Boolean)
  if (mapsParts.length < 2) return null

  return {
    company,
    street,
    postalCode,
    city,
    mapsQuery: mapsParts.join(', '),
  }
}

function mapsUrlFor(place: LoadingPlace | null): string | null {
  if (!place?.mapsQuery) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.mapsQuery)}`
}

function formatAddress(place: LoadingPlace | null): string {
  if (!place) return 'Not found'
  const address = [place.street, place.postalCode, place.city]
    .filter(Boolean)
    .join(', ')
  return address || place.mapsQuery || 'Not found'
}

function scoreHit(hit: Omit<RefHit, 'id' | 'score'>, query: string): number {
  let score = 0
  const q = query.trim().toLowerCase()
  if (q && hit.ref.toLowerCase() === q) score += 50
  else if (q && hit.ref.toLowerCase().includes(q)) score += 30

  if (/ref|order|auftrag|commande|riferimento|referenc/i.test(hit.context)) {
    score += 12
  }
  if (LOADING_RE.test(hit.context)) score += 10
  if (hit.loadingPlace?.company) score += 10
  if (hit.loadingPlace?.street) score += 8
  if (hit.loadingPlace?.postalCode) score += 10
  if (hit.mapsUrl) score += 6
  return score
}

function findRefsInPage(
  fileName: string,
  page: number,
  text: string,
  query: string,
): RefHit[] {
  const hits: RefHit[] = []
  const seen = new Set<string>()
  const loadingPlace = extractLoadingPlace(text)

  const pushHit = (ref: string, index: number) => {
    const clean = ref.trim()
    if (clean.length < 4) return
    const key = `${page}|${clean.toUpperCase()}`
    if (seen.has(key)) return
    seen.add(key)

    const context = extractContext(text, index, clean.length)
    const base = {
      fileName,
      page,
      ref: clean,
      context,
      loadingPlace,
      mapsUrl: mapsUrlFor(loadingPlace),
    }
    hits.push({
      ...base,
      id: `${fileName}-${page}-${clean}-${index}`,
      score: scoreHit(base, query),
    })
  }

  if (query.trim()) {
    const q = query.trim()
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      pushHit(m[0], m.index)
    }
    return hits
  }

  for (const pattern of REF_PATTERNS) {
    pattern.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = pattern.exec(text)) !== null) {
      const ref = m[1] || m[0]
      const index = m.index + (m[0].length - ref.length)
      pushHit(ref, index)
    }
  }

  return hits
}

async function readPdf(file: File): Promise<PdfDoc> {
  const data = new Uint8Array(await file.arrayBuffer())
  const loadingTask = pdfjs.getDocument({ data })
  const pdf = await loadingTask.promise
  const pages: PdfPageText[] = []

  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items
      .map((item) => ('str' in item ? String(item.str) : ''))
      .join(' ')
    pages.push({ page: i, text })
  }

  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    pages,
  }
}

export function RefSearchTab() {
  const [docs, setDocs] = useState<PdfDoc[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function onFiles(fileList: FileList | null) {
    if (!fileList?.length) return
    setError('')
    setLoading(true)
    setSearched(false)
    try {
      const pdfFiles = Array.from(fileList).filter((f) =>
        f.name.toLowerCase().endsWith('.pdf'),
      )
      if (!pdfFiles.length) {
        setError('Please attach PDF file(s)')
        setLoading(false)
        return
      }

      const parsed: PdfDoc[] = []
      for (const file of pdfFiles) {
        parsed.push(await readPdf(file))
      }
      setDocs((prev) => {
        const map = new Map(prev.map((d) => [d.id, d]))
        for (const d of parsed) map.set(d.id, d)
        return [...map.values()]
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to read PDF')
    } finally {
      setLoading(false)
    }
  }

  const { hits, best } = useMemo(() => {
    if (!searched || !docs.length) return { hits: [] as RefHit[], best: null as RefHit | null }
    const all: RefHit[] = []
    for (const doc of docs) {
      for (const page of doc.pages) {
        all.push(...findRefsInPage(doc.name, page.page, page.text, query))
      }
    }
    const sorted = [...all].sort((a, b) => b.score - a.score)
    return {
      hits: sorted,
      best: sorted[0] ?? null,
    }
  }, [docs, query, searched])

  function clearAll() {
    setDocs([])
    setQuery('')
    setSearched(false)
    setError('')
  }

  return (
    <section className="panel">
      <div className="panel__toolbar">
        <div>
          <h2 className="panel__title">Ref Search</h2>
          <p className="panel__hint">
            Shows all Loading refs. Loading place + Google Maps only for Best
            result.
          </p>
        </div>
        {docs.length > 0 && (
          <button type="button" className="btn btn--danger" onClick={clearAll}>
            Clear PDFs
          </button>
        )}
      </div>

      <div className="instructions-form">
        <fieldset className="fieldset">
          <legend>PDF file</legend>
          <label className="upload upload--inline">
            <span className="btn btn--primary">Attach PDF</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              multiple
              onChange={(e) => onFiles(e.target.files)}
            />
          </label>
        </fieldset>

        <fieldset className="fieldset">
          <legend>Search ref number</legend>
          <input
            className="input input--plain"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. 260785046"
          />
        </fieldset>
      </div>

      <div className="ref-actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={!docs.length || loading}
          onClick={() => setSearched(true)}
        >
          Search
        </button>
        {loading && <span className="muted">Reading PDF…</span>}
      </div>

      {error && <p className="error">{error}</p>}

      {docs.length > 0 && (
        <div className="stat wide" style={{ marginTop: '1rem' }}>
          <span className="muted">Attached</span>
          <strong>
            {docs.map((d) => `${d.name} (${d.pages.length} p.)`).join(' · ')}
          </strong>
        </div>
      )}

      {searched && hits.length === 0 && (
        <p className="panel__hint" style={{ marginTop: '1rem' }}>
          No ref numbers found.
        </p>
      )}

      {searched && hits.length > 0 && (
        <div className="eta-result">
          <h3 className="panel__subtitle">
            Loading refs ({hits.length}
            {query.trim() ? ` for “${query.trim()}”` : ''})
          </h3>
          <div className="ref-cards">
            {hits.map((h) => (
              <article key={h.id} className="ref-card ref-card--compact">
                <div className="ref-card__block">
                  <span className="muted">Ref number</span>
                  <strong className="ref-card__value">{h.ref}</strong>
                </div>
                <div className="ref-card__meta">
                  <span>
                    {h.fileName} · page {h.page}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {searched && best && (
        <div className="eta-result">
          <h3 className="panel__subtitle">Loading place — Best result</h3>
          <div className="ref-cards">
            <article className="ref-card">
              <div className="ref-card__block">
                <span className="muted">Best Loading ref</span>
                <strong className="ref-card__value">{best.ref}</strong>
              </div>

              <div className="ref-card__block">
                <span className="muted">Loading place</span>
                <strong className="ref-card__company">
                  {best.loadingPlace?.company || 'Not found'}
                </strong>
                <p className="ref-card__address">
                  {formatAddress(best.loadingPlace)}
                </p>
                {best.mapsUrl ? (
                  <a href={best.mapsUrl} target="_blank" rel="noreferrer">
                    Open in Google Maps
                  </a>
                ) : null}
              </div>

              <div className="ref-card__meta">
                <span>
                  {best.fileName} · page {best.page}
                </span>
              </div>
            </article>
          </div>
        </div>
      )}
    </section>
  )
}
