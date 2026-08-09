import { useMemo, useState } from 'react'
import {
  isLikelyCmrFile,
  readPdfFile,
  type PdfDoc,
} from '../utils/pdfOcr'
import {
  COUNTRY_RE,
  DESTINATION_RE,
  extractCmrPlaces,
  extractDestinationPlace,
  extractLoadingPlace,
  extractUnloadingPlace,
  formatAddress,
  LOADING_RE,
  mapsUrlFor,
  placeSearchBlob,
  STREET_RE,
  UNLOADING_RE,
  type PlaceAddress,
} from '../utils/placeExtract'

interface RefHit {
  id: string
  fileName: string
  page: number
  ref: string
  context: string
  loadingPlace: PlaceAddress | null
  unloadingPlace: PlaceAddress | null
  destinationPlace: PlaceAddress | null
  mapsUrl: string | null
  unloadingMapsUrl: string | null
  destinationMapsUrl: string | null
  score: number
  matchKind: 'ref' | 'address'
  deliveryBox?: 2 | 3 | null
}

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
  /\b(U\d{8}-[A-Z0-9]+)\b/gi,
]

function normalizeSpaces(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function extractContext(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 60)
  const end = Math.min(text.length, index + length + 80)
  return normalizeSpaces(text.slice(start, end))
}

function scoreHit(hit: Omit<RefHit, 'id' | 'score'>, query: string): number {
  let score = 0
  const q = query.trim().toLowerCase()
  if (q && hit.ref.toLowerCase() === q) score += 50
  else if (q && hit.ref.toLowerCase().includes(q)) score += 30

  if (hit.matchKind === 'address') score += 20

  if (/ref|order|auftrag|commande|riferimento|referenc/i.test(hit.context)) {
    score += 12
  }
  if (LOADING_RE.test(hit.context)) score += 10
  if (UNLOADING_RE.test(hit.context) || DESTINATION_RE.test(hit.context)) {
    score += 8
  }
  if (hit.loadingPlace?.company) score += 10
  if (hit.loadingPlace?.street) score += 8
  if (hit.loadingPlace?.postalCode) score += 10
  if (hit.unloadingPlace?.company) score += 8
  if (hit.unloadingPlace?.street) score += 6
  if (hit.unloadingPlace?.postalCode) score += 8
  if (hit.destinationPlace?.postalCode) score += 12
  if (hit.destinationPlace?.city) score += 8
  if (hit.mapsUrl) score += 6
  if (hit.unloadingMapsUrl) score += 4
  if (hit.destinationMapsUrl) score += 8

  if (q) {
    if (placeSearchBlob(hit.loadingPlace).includes(q)) score += 25
    if (placeSearchBlob(hit.unloadingPlace).includes(q)) score += 25
    if (placeSearchBlob(hit.destinationPlace).includes(q)) score += 30
  }
  return score
}

function findRefsInPage(
  fileName: string,
  page: number,
  text: string,
  query: string,
  cmrLoading: PlaceAddress | null,
  cmrDelivery: PlaceAddress | null,
): RefHit[] {
  const hits: RefHit[] = []
  const seen = new Set<string>()
  const loadingPlace = extractLoadingPlace(text) ?? cmrLoading
  const unloadingPlace = extractUnloadingPlace(text)
  const destinationPlace =
    extractDestinationPlace(text) ?? cmrDelivery

  const pushHit = (
    ref: string,
    index: number,
    matchKind: 'ref' | 'address' = 'ref',
  ) => {
    const clean = ref.trim()
    if (clean.length < 3) return
    const key = `${page}|${matchKind}|${clean.toUpperCase()}`
    if (seen.has(key)) return
    seen.add(key)

    const context = extractContext(text, index, clean.length)
    const base = {
      fileName,
      page,
      ref: clean,
      context,
      loadingPlace,
      unloadingPlace,
      destinationPlace,
      mapsUrl: mapsUrlFor(loadingPlace),
      unloadingMapsUrl: mapsUrlFor(unloadingPlace),
      destinationMapsUrl: mapsUrlFor(destinationPlace),
      matchKind,
    }
    hits.push({
      ...base,
      id: `${fileName}-${page}-${matchKind}-${clean}-${index}`,
      score: scoreHit(base, query),
    })
  }

  if (query.trim()) {
    const q = query.trim()
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      const around = extractContext(text, m.index, m[0].length)
      const isAddress =
        STREET_RE.test(around) ||
        COUNTRY_RE.test(around) ||
        LOADING_RE.test(around) ||
        UNLOADING_RE.test(around) ||
        DESTINATION_RE.test(around) ||
        placeSearchBlob(loadingPlace).includes(q.toLowerCase()) ||
        placeSearchBlob(unloadingPlace).includes(q.toLowerCase()) ||
        placeSearchBlob(destinationPlace).includes(q.toLowerCase())
      pushHit(m[0], m.index, isAddress ? 'address' : 'ref')
    }

    const qLower = q.toLowerCase()
    if (
      placeSearchBlob(loadingPlace).includes(qLower) ||
      placeSearchBlob(unloadingPlace).includes(qLower) ||
      placeSearchBlob(destinationPlace).includes(qLower)
    ) {
      const label =
        destinationPlace?.mapsQuery ||
        loadingPlace?.mapsQuery ||
        unloadingPlace?.mapsQuery ||
        q
      pushHit(label, 0, 'address')
    }
    return hits
  }

  for (const pattern of REF_PATTERNS) {
    pattern.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = pattern.exec(text)) !== null) {
      const ref = m[1] || m[0]
      const index = m.index + (m[0].length - ref.length)
      pushHit(ref, index, 'ref')
    }
  }

  return hits
}

function PlaceBlock({
  title,
  place,
  mapsUrl,
}: {
  title: string
  place: PlaceAddress | null
  mapsUrl: string | null
}) {
  return (
    <div className="ref-card__block">
      <span className="muted">{title}</span>
      <strong className="ref-card__company">
        {place?.company || 'Not found'}
      </strong>
      <p className="ref-card__address">{formatAddress(place)}</p>
      {mapsUrl ? (
        <a href={mapsUrl} target="_blank" rel="noreferrer">
          Open in Google Maps
        </a>
      ) : null}
    </div>
  )
}

export function RefSearchTab() {
  const [docs, setDocs] = useState<PdfDoc[]>([])
  const [cmrDocs, setCmrDocs] = useState<PdfDoc[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [searched, setSearched] = useState(false)

  async function ingestFiles(
    fileList: FileList | null,
    preferredKind: 'order' | 'cmr' | 'auto',
  ) {
    if (!fileList?.length) return
    setError('')
    setLoading(true)
    setSearched(false)
    setProgress('Reading PDF…')
    try {
      const pdfFiles = Array.from(fileList).filter((f) =>
        f.name.toLowerCase().endsWith('.pdf'),
      )
      if (!pdfFiles.length) {
        setError('Please attach PDF file(s)')
        setLoading(false)
        setProgress('')
        return
      }

      const nextOrders: PdfDoc[] = []
      const nextCmrs: PdfDoc[] = []

      for (const file of pdfFiles) {
        const kind: 'order' | 'cmr' =
          preferredKind === 'auto'
            ? isLikelyCmrFile(file.name)
              ? 'cmr'
              : 'order'
            : preferredKind

        const parsed = await readPdfFile(file, kind, setProgress)
        if (kind === 'cmr') nextCmrs.push(parsed)
        else nextOrders.push(parsed)
      }

      if (nextOrders.length) {
        setDocs((prev) => {
          const map = new Map(prev.map((d) => [d.id, d]))
          for (const d of nextOrders) map.set(d.id, d)
          return [...map.values()]
        })
      }
      if (nextCmrs.length) {
        setCmrDocs((prev) => {
          const map = new Map(prev.map((d) => [d.id, d]))
          for (const d of nextCmrs) map.set(d.id, d)
          return [...map.values()]
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to read PDF')
    } finally {
      setLoading(false)
      setProgress('')
    }
  }

  const cmrPlaces = useMemo(() => {
    for (const doc of cmrDocs) {
      for (const page of doc.pages) {
        const extracted = extractCmrPlaces(page.text)
        if (extracted.loading || extracted.delivery) {
          return {
            ...extracted,
            fileName: doc.name,
            page: page.page,
            ocrUsed: doc.ocrUsed,
          }
        }
      }
    }
    return null
  }, [cmrDocs])

  const { hits, best } = useMemo(() => {
    if (!searched || (!docs.length && !cmrDocs.length)) {
      return { hits: [] as RefHit[], best: null as RefHit | null }
    }

    const cmrLoading = cmrPlaces?.loading ?? null
    const cmrDelivery = cmrPlaces?.delivery ?? null
    const all: RefHit[] = []

    for (const doc of docs) {
      for (const page of doc.pages) {
        all.push(
          ...findRefsInPage(
            doc.name,
            page.page,
            page.text,
            query,
            cmrLoading,
            cmrDelivery,
          ),
        )
      }
    }

    // CMR-only: show loading (box 1) + delivery (box 3/2) without order PDF
    for (const doc of cmrDocs) {
      for (const page of doc.pages) {
        const extracted = extractCmrPlaces(page.text)
        const loading = extracted.loading
        const delivery = extracted.delivery

        if (!query.trim()) {
          if (loading || delivery) {
            all.push({
              id: `cmr-places-${doc.id}-${page.page}`,
              fileName: doc.name,
              page: page.page,
              ref:
                delivery?.mapsQuery ||
                loading?.mapsQuery ||
                doc.name,
              context: [loading?.raw, delivery?.raw].filter(Boolean).join(' · '),
              loadingPlace: loading,
              unloadingPlace: null,
              destinationPlace: delivery,
              mapsUrl: mapsUrlFor(loading),
              unloadingMapsUrl: null,
              destinationMapsUrl: mapsUrlFor(delivery),
              matchKind: 'address',
              score: 45,
              deliveryBox:
                extracted.deliveryBox === 2 || extracted.deliveryBox === 3
                  ? extracted.deliveryBox
                  : null,
            })
          }
          continue
        }

        all.push(
          ...findRefsInPage(
            doc.name,
            page.page,
            page.text,
            query,
            loading,
            delivery,
          ),
        )
      }
    }

    const sorted = [...all].sort((a, b) => b.score - a.score)
    const top = sorted[0] ?? null
    const bestHit =
      top &&
      ((cmrLoading && !top.loadingPlace) ||
        (cmrDelivery && !top.destinationPlace))
        ? {
            ...top,
            loadingPlace: top.loadingPlace ?? cmrLoading,
            destinationPlace: top.destinationPlace ?? cmrDelivery,
            mapsUrl: mapsUrlFor(top.loadingPlace ?? cmrLoading),
            destinationMapsUrl: mapsUrlFor(
              top.destinationPlace ?? cmrDelivery,
            ),
            deliveryBox: top.deliveryBox ?? cmrPlaces?.deliveryBox ?? null,
          }
        : top

    return {
      hits: sorted,
      best: bestHit,
    }
  }, [docs, cmrDocs, query, searched, cmrPlaces])

  function clearAll() {
    setDocs([])
    setCmrDocs([])
    setQuery('')
    setSearched(false)
    setError('')
    setProgress('')
  }

  const hasFiles = docs.length > 0 || cmrDocs.length > 0
  const deliveryBoxLabel =
    cmrPlaces?.deliveryBox === 2
      ? 'box 2'
      : cmrPlaces?.deliveryBox === 3
        ? 'box 3'
        : 'box 3 / box 2'

  return (
    <section className="panel">
      <div className="panel__toolbar">
        <div>
          <h2 className="panel__title">Ref Search</h2>
          <p className="panel__hint">
            Order PDF optional. CMR alone: loading from box 1, delivery from
            box 3 (or box 2 if address is there). Scans use OCR.
          </p>
        </div>
        {hasFiles && (
          <button type="button" className="btn btn--danger" onClick={clearAll}>
            Clear PDFs
          </button>
        )}
      </div>

      <div className="instructions-form">
        <fieldset className="fieldset">
          <legend>Order PDF (optional)</legend>
          <label className="upload upload--inline">
            <span className="btn btn--primary">Attach order PDF</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              multiple
              onChange={(e) => {
                void ingestFiles(e.target.files, 'order')
                e.target.value = ''
              }}
            />
          </label>
        </fieldset>

        <fieldset className="fieldset">
          <legend>CMR PDF</legend>
          <label className="upload upload--inline">
            <span className="btn btn--primary">Attach CMR</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              multiple
              onChange={(e) => {
                void ingestFiles(e.target.files, 'cmr')
                e.target.value = ''
              }}
            />
          </label>
        </fieldset>

        <fieldset className="fieldset">
          <legend>Search ref or address</legend>
          <input
            className="input input--plain"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. U260008194 or CULEMBORG / ZAPFENDORF"
          />
        </fieldset>
      </div>

      <div className="ref-actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={!hasFiles || loading}
          onClick={() => setSearched(true)}
        >
          Search
        </button>
        {loading && (
          <span className="muted">{progress || 'Reading PDF…'}</span>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      {docs.length > 0 && (
        <div className="stat wide" style={{ marginTop: '1rem' }}>
          <span className="muted">Order PDFs</span>
          <strong>
            {docs.map((d) => `${d.name} (${d.pages.length} p.)`).join(' · ')}
          </strong>
        </div>
      )}

      {cmrDocs.length > 0 && (
        <div className="stat wide" style={{ marginTop: '0.75rem' }}>
          <span className="muted">CMR PDFs</span>
          <strong>
            {cmrDocs
              .map(
                (d) =>
                  `${d.name} (${d.pages.length} p.${d.ocrUsed ? ', OCR' : ''})`,
              )
              .join(' · ')}
          </strong>
        </div>
      )}

      {cmrPlaces && (cmrPlaces.loading || cmrPlaces.delivery) && (
        <div className="eta-result">
          <h3 className="panel__subtitle">
            CMR places{cmrPlaces.ocrUsed ? ' · OCR' : ''}
          </h3>
          <div className="ref-cards">
            <article className="ref-card">
              <PlaceBlock
                title="Loading (CMR box 1)"
                place={cmrPlaces.loading}
                mapsUrl={mapsUrlFor(cmrPlaces.loading)}
              />
              <PlaceBlock
                title={`Delivery (CMR ${deliveryBoxLabel})`}
                place={cmrPlaces.delivery}
                mapsUrl={mapsUrlFor(cmrPlaces.delivery)}
              />
              <div className="ref-card__meta">
                <span>
                  {cmrPlaces.fileName} · page {cmrPlaces.page}
                </span>
              </div>
            </article>
          </div>
        </div>
      )}

      {searched && hits.length === 0 && !cmrPlaces && (
        <p className="panel__hint" style={{ marginTop: '1rem' }}>
          No refs or addresses found.
        </p>
      )}

      {searched && hits.length > 0 && (
        <div className="eta-result">
          <h3 className="panel__subtitle">
            Results ({hits.length}
            {query.trim() ? ` for “${query.trim()}”` : ''})
          </h3>
          <div className="ref-cards">
            {hits.map((h) => (
              <article key={h.id} className="ref-card ref-card--compact">
                <div className="ref-card__block">
                  <span className="muted">
                    {h.matchKind === 'address' ? 'Address match' : 'Ref number'}
                  </span>
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
          <h3 className="panel__subtitle">Places — Best result</h3>
          <div className="ref-cards">
            <article className="ref-card">
              <div className="ref-card__block">
                <span className="muted">
                  {best.matchKind === 'address'
                    ? 'Best match'
                    : 'Best Loading ref'}
                </span>
                <strong className="ref-card__value">{best.ref}</strong>
              </div>

              <PlaceBlock
                title="Loading place (CMR box 1 / order)"
                place={best.loadingPlace}
                mapsUrl={best.mapsUrl}
              />

              {best.unloadingPlace ? (
                <PlaceBlock
                  title="Delivery / Unloading (order)"
                  place={best.unloadingPlace}
                  mapsUrl={best.unloadingMapsUrl}
                />
              ) : null}

              <PlaceBlock
                title={`CMR Delivery (${
                  best.deliveryBox === 2
                    ? 'box 2'
                    : best.deliveryBox === 3
                      ? 'box 3'
                      : 'box 3 / box 2'
                })`}
                place={best.destinationPlace}
                mapsUrl={best.destinationMapsUrl}
              />

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
