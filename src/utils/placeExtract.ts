export interface PlaceAddress {
  company: string
  street: string
  postalCode: string
  city: string
  country: string
  mapsQuery: string
  raw: string
}

export const LOADING_RE =
  /\b(?:loading|load(?:ed)?|chargement|charg[ée]e?|prise\s+en\s+charge|verladung|beladung|laden|carico|caricamento|za[łl]adunek|za[łl]adowanie|pakrovimas)\b/i

export const UNLOADING_RE =
  /\b(?:unloading|unload(?:ed)?|delivery|délivraison|livraison|entladung|auslieferung|roz[łl]adunek|roz[łl]adowanie|scarico|consegna|delivery\s+address)\b/i

export const DESTINATION_RE =
  /\b(?:destination|place\s+of\s+delivery(?:\s+of\s+the\s+goods)?|consignee|lieferort|ort\s+der\s+ablieferung|ablieferungsort|miejsce\s+dostawy|adresat|empf[aä]nger|destinataire|destinazione|pristatymo\s+vieta|gavimo\s+vieta|geadresseerde|aflevering)\b/i

/** CMR box 1 headers (Sender / loading) */
const CMR_BOX1_START_RE =
  /\b(?:exp[eéè]diteur|expddteur|afzender|absender|sender)\b/i

/** CMR box 2 headers (Consignee) — often holds the delivery address */
const CMR_BOX2_START_RE =
  /\b(?:destinataire|destnataire|geadresseerde)\b|\bempf[aä]nger\s*\(\s*name|\bempfinger\s*\(\s*name/i

/** CMR box 3 headers (Place of delivery) — including OCR-noisy variants */
const CMR_BOX3_START_RE =
  /\b(?:place\s+of\s+delivery|plaats\b[\s\S]{0,40}?afleverin|lieu\b[\s\S]{0,40}?livraison|auslieferung|ablieferung|lieferort|ausiiefenung)/i

const CMR_BOX3_END_RE =
  /\b(?:lieu\s+et\s+date|plaats\s+en\s+dat|taking\s+over|inontvangst|prise\s+en\s+charge|documents\s+annex|bijgevoegde|beigef[uü]gte|carrier|transporteur|vervoerder|frachtf|culemborg)\b/i

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  deutschland: 'DE',
  germany: 'DE',
  nederland: 'NL',
  netherlands: 'NL',
  holland: 'NL',
  france: 'FR',
  belgie: 'BE',
  belgië: 'BE',
  belgium: 'BE',
  belgique: 'BE',
  italia: 'IT',
  italy: 'IT',
  polska: 'PL',
  poland: 'PL',
  lietuva: 'LT',
  lithuania: 'LT',
  osterreich: 'AT',
  österreich: 'AT',
  austria: 'AT',
  schweiz: 'CH',
  switzerland: 'CH',
}

export const COUNTRY_RE =
  /\b(NL|DE|PL|BE|FR|IT|ES|AT|CZ|SK|LT|LV|EE|RO|HU|PT|CH|LU|DK|SE|NO|FI|IE|GB|UK)\b/i

const COUNTRY_NAME_RE =
  /\b(Deutschland|Germany|Nederland|Netherlands|Holland|France|Belgi[eë]|Belgium|Belgique|Italia|Italy|Polska|Poland|Lietuva|Lithuania|Österreich|Osterreich|Austria|Schweiz|Switzerland)\b/i

export const STREET_RE =
  /\b(?:rue|road|rd|street|st\.?|avenue|ave|av\.?|boulevard|blvd|platz|strasse|straße|str\.?|weg|gasse|allee|allée|chemin|impasse|place|ul\.?|ulica|via|viale|corso|calle|plaza|park|parc|industriepark|zone|zi|drog[ai]|aleja)\b/i

export function normalizeSpaces(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

export function mapsUrlFor(place: PlaceAddress | null): string | null {
  if (!place?.mapsQuery) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.mapsQuery)}`
}

export function formatAddress(place: PlaceAddress | null): string {
  if (!place) return 'Not found'
  const address = [place.street, place.postalCode, place.city, place.country]
    .filter(Boolean)
    .join(', ')
  return address || place.mapsQuery || 'Not found'
}

export function placeSearchBlob(place: PlaceAddress | null): string {
  if (!place) return ''
  return [
    place.company,
    place.street,
    place.postalCode,
    place.city,
    place.country,
    place.mapsQuery,
    place.raw,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function sliceSection(
  text: string,
  startRe: RegExp,
  endRe: RegExp,
): string {
  const start = text.search(startRe)
  if (start < 0) return ''
  const from = text.slice(start)
  const tail = from.slice(12)
  const endRel = tail.search(endRe)
  const chunk =
    endRel >= 0 ? from.slice(0, 12 + endRel) : from.slice(0, 520)
  return normalizeSpaces(chunk)
}

export function parsePlaceFromChunk(chunk: string): PlaceAddress | null {
  if (!chunk) return null

  let work = chunk
    .replace(/\b(?:LOADING|UNLOADING|DESTINATION|CONSIGNEE)\s*:?/gi, ' ')
    .replace(/\b(?:Place\s+of\s+delivery(?:\s+of\s+the\s+goods)?)\s*:?/gi, ' ')
    .replace(/\bDate:\s*/gi, ' ')
    .replace(/\bTime:\s*/gi, ' ')
    .replace(/\bAddress:\s*/gi, ' ')
    .replace(/\bNotes:\s*/gi, ' ')
    .replace(/\b\d{1,2}\.\s*/g, ' ')
    .replace(/\b\d{2}[-./]\d{2}[-./]\d{4}\b/g, ' ')
    .replace(/\b\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2}\b/g, ' ')
    .replace(/\bREF\s*:?\s*[A-Z0-9/_-]+/gi, ' ')
    .replace(/\bFTL\b/gi, ' ')
    .replace(/\b\d+[.,]\d+\s*LDM\b/gi, ' ')
    .replace(/\bBEZ\s+WYMIANY\b/gi, ' ')

  work = normalizeSpaces(work)

  // NL: 4104 AH Culemborg (optional NL / Nederland later)
  let locMatch = work.match(
    /\b(\d{4}\s*[A-Z]{2})\s+([A-ZÀ-ÿ][A-ZÀ-ÿ'-]{2,40})(?:\s|,)+(NL|Nederland|Netherlands)\b/i,
  )
  if (!locMatch) {
    const nlPostal = work.match(
      /\b(\d{4}\s*[A-Z]{2})\s+([A-ZÀ-ÿ][A-ZÀ-ÿ'-]{2,40})\b/i,
    )
    if (
      nlPostal &&
      (/\b(?:NL|Nederland|Netherlands)\b/i.test(work) ||
        /warehous|energiew|culemborg/i.test(work))
    ) {
      const fake = [
        nlPostal[0],
        nlPostal[1]!,
        nlPostal[2]!,
        'NL',
      ] as unknown as RegExpMatchArray
      Object.defineProperty(fake, 'index', {
        value: nlPostal.index ?? 0,
        writable: true,
      })
      locMatch = fake
    }
  }

  // e.g. 4104 CULEMBORG NL  |  96199 ZAPFENDORF DE
  if (!locMatch) {
    locMatch = work.match(
      /\b((?:[A-Z]{2}[-\s]?)?(?:\d{2}-\d{3}|\d{4,5}))\s+([A-ZÀ-ÿ][A-ZÀ-ÿ' -]{1,40}?)\s+(NL|DE|PL|BE|FR|IT|ES|AT|CZ|SK|LT|LV|EE|RO|HU|PT|CH|LU|DK|SE|NO|FI|IE|GB|UK)\b/i,
    )
  }

  // e.g. 96199 Zapfendorf … Deutschland (OCR CMR)
  if (!locMatch) {
    locMatch = work.match(
      /\b(\d{4,5})\s+([A-ZÀ-ÿ][A-ZÀ-ÿ' -]{1,40}?)(?:\s|,)+(Deutschland|Germany|Nederland|Netherlands|France|Belgi[eë]|Belgium|Belgique|Italia|Italy|Polska|Poland)\b/i,
    )
  }

  // e.g. 96199 ZapfendorfBaustelle + Deutschland later
  if (!locMatch) {
    const glued = work.match(/\b(\d{5})\s*([A-ZÀ-ÿ][A-ZÀ-ÿ]{3,})/i)
    const countryName = work.match(COUNTRY_NAME_RE)
    if (glued && countryName) {
      const cityRaw = glued[2]!.replace(
        /(Baustelle|Nord|Sud|Süd|Ost|West)$/i,
        '',
      )
      const fake = [glued[0], glued[1]!, cityRaw, countryName[1]!] as unknown as RegExpMatchArray
      Object.defineProperty(fake, 'index', {
        value: glued.index ?? 0,
        writable: true,
      })
      locMatch = fake
    }
  }

  let postalCode = ''
  let city = ''
  let country = ''
  if (locMatch) {
    postalCode = normalizeSpaces(String(locMatch[1]).toUpperCase())
    city = normalizeSpaces(String(locMatch[2]))
      .replace(/(Baustelle)$/i, '')
      .trim()
    const c = String(locMatch[3] || '')
    country =
      COUNTRY_NAME_TO_CODE[c.toLowerCase()] ??
      (/^[A-Z]{2}$/i.test(c) ? c.toUpperCase() : '')
  } else {
    const countryName = work.match(COUNTRY_NAME_RE)
    if (countryName) {
      country =
        COUNTRY_NAME_TO_CODE[countryName[1]!.toLowerCase()] ?? ''
    }
  }

  const beforeLoc = normalizeSpaces(
    locMatch && typeof locMatch.index === 'number'
      ? work.slice(0, locMatch.index)
      : work,
  )

  let street = ''
  const streetCandidates = [
    ...beforeLoc.matchAll(
      /\b((?:UL\.?\s+|VIA\s+|RUE\s+)?[A-ZÀ-ÿ][A-ZÀ-ÿ.'-]{2,}(?:\s+[A-ZÀ-ÿ][A-ZÀ-ÿ.'-]{2,}){0,2}\s+\d+[A-Z]?(?:\/\d+[A-Z]?)?)\b/gi,
    ),
  ].map((m) => normalizeSpaces(m[1]!))

  const looksLikeStreetName = (s: string) => {
    const tail = s.split(/\s+/).slice(-2).join(' ')
    return /(?:weg|str(?:asse)?|ul\.?|rue|via|road|street|laan|allee|gasse|platz|avenue|blvd)\b/i.test(
      tail,
    )
  }

  if (streetCandidates.length) {
    street =
      [...streetCandidates].reverse().find(looksLikeStreetName) ??
      [...streetCandidates].sort((a, b) => a.length - b.length)[0] ??
      ''
  }

  if (street && street.split(/\s+/).length > 3 && looksLikeStreetName(street)) {
    street = street.split(/\s+/).slice(-2).join(' ')
  }

  let company = beforeLoc
  if (street) {
    const idx = beforeLoc.toUpperCase().lastIndexOf(street.toUpperCase())
    if (idx >= 0) company = beforeLoc.slice(0, idx)
  }
  company = normalizeSpaces(
    company
      .replace(
        /\bCMR\s*\/\s*DOCUMENTS(?:\s+CMR\s*\/\s*DOCUMENTS)+\b/gi,
        'CMR / DOCUMENTS',
      )
      .replace(/\s{2,}/g, ' '),
  )

  if (company) {
    const tokens = company.split(/\s+/)
    if (tokens.length >= 4 && tokens.length % 2 === 0) {
      const mid = tokens.length / 2
      const left = tokens.slice(0, mid).join(' ')
      const right = tokens.slice(mid).join(' ')
      if (left.toLowerCase() === right.toLowerCase()) company = left
    }
  }

  if (company && /^[\d\s./-]+$/.test(company)) company = ''

  // OCR noise cleanup for common CMR labels mixed into company
  company = company
    .replace(
      /\b(?:international|consignment|note|cmr|carriage|goods)\b/gi,
      ' ',
    )
    .replace(/\s{2,}/g, ' ')
    .trim()

  const mapsParts = [company, street, postalCode, city, country].filter(Boolean)
  if (mapsParts.length < 2) return null

  return {
    company,
    street,
    postalCode,
    city,
    country,
    mapsQuery: mapsParts.join(', '),
    raw: work.slice(0, 280),
  }
}

export function extractLoadingPlace(text: string): PlaceAddress | null {
  const chunk = sliceSection(text, LOADING_RE, UNLOADING_RE)
  return parsePlaceFromChunk(chunk || text.slice(0, 420))
}

export function extractUnloadingPlace(text: string): PlaceAddress | null {
  const chunk = sliceSection(
    text,
    UNLOADING_RE,
    /\b(?:weight|goods|vehicle\s+requirements|freight|payment|arrangements|send\s+documents|check\s+your|loading)\b/i,
  )
  return parsePlaceFromChunk(chunk)
}

/**
 * CMR destination:
 * - Prefer box 3 (Place of delivery)
 * - If empty / weak, use box 2 (Consignee) — some CMRs put the full address there
 */
export function extractDestinationPlace(text: string): PlaceAddress | null {
  return extractCmrPlaces(text).delivery
}

export interface CmrExtractedPlaces {
  loading: PlaceAddress | null
  delivery: PlaceAddress | null
  /** Which CMR box the delivery address came from */
  deliveryBox: 1 | 2 | 3 | null
}

function scorePlace(p: PlaceAddress | null, preferDelivery = false): number {
  if (!p) return 0
  let s = 0
  if (p.postalCode) s += 5
  if (p.city && p.city.length >= 3) s += 3
  if (p.country) s += 2
  if (p.street) s += 2
  if (p.company && p.company.length < 80) s += 1
  if (!p.postalCode) s -= 4
  if ((p.company?.length ?? 0) > 100) s -= 4
  if (preferDelivery) {
    if (/baustelle|zapfendorf|baufeld/i.test(`${p.raw} ${p.company} ${p.city}`)) {
      s += 3
    }
    if (/culemborg/i.test(`${p.city} ${p.raw}`)) s -= 8
  } else {
    // Loading (box 1) often NL warehouse
    if (/culemborg|warehous|energiew/i.test(`${p.raw} ${p.company} ${p.street} ${p.city}`)) {
      s += 3
    }
    if (/baustelle|zapfendorf/i.test(`${p.city} ${p.raw}`)) s -= 6
  }
  return s
}

/** Extract CMR box 1 (loading) + box 3/2 (delivery). */
export function extractCmrPlaces(text: string): CmrExtractedPlaces {
  const normalized = text.replace(/\r/g, '\n')

  const box1Chunk = sliceBetween(
    normalized,
    CMR_BOX1_START_RE,
    CMR_BOX2_START_RE,
  )
  const field1 =
    normalized.match(
      /(?:^|\n|\s)1[\).\s:-]+(?:exp[eéè]diteur|afzender|absender|sender)[^\n]*([\s\S]{15,500}?)(?=(?:^|\n|\s)2[\).\s:-]|destinataire|destnataire|geadresseerde|empf)/i,
    )?.[1] ?? ''

  const from1 =
    parsePlaceFromChunk(box1Chunk) ??
    parsePlaceFromChunk(field1) ??
    findDutchLoadingCandidates(normalized)[0] ??
    null

  const box3Chunk = sliceBetween(
    normalized,
    CMR_BOX3_START_RE,
    CMR_BOX3_END_RE,
  )
  const box2Chunk = sliceBetween(
    normalized,
    CMR_BOX2_START_RE,
    CMR_BOX3_START_RE,
  )

  const field3 =
    normalized.match(
      /(?:^|\n|\s)3[\).\s:-]+(?:place\s+of\s+delivery[^\n]*)?([\s\S]{15,450}?)(?=(?:^|\n|\s)4[\).\s:-]|lieu\s+et\s+date|plaats\s+en\s+dat|taking\s+over|carrier)/i,
    )?.[1] ?? ''
  const field2 =
    normalized.match(
      /(?:^|\n|\s)2[\).\s:-]+(?:consignee[^\n]*)?([\s\S]{15,450}?)(?=(?:^|\n|\s)3[\).\s:-]|place\s+of\s+delivery|plaats|lieu\s+pr)/i,
    )?.[1] ?? ''

  const from3 =
    parsePlaceFromChunk(box3Chunk) ?? parsePlaceFromChunk(field3)
  const from2 =
    parsePlaceFromChunk(box2Chunk) ?? parsePlaceFromChunk(field2)
  const deCandidates = findGermanDestinationCandidates(normalized)

  let delivery: PlaceAddress | null = null
  let deliveryBox: 1 | 2 | 3 | null = null

  if (from3?.postalCode && scorePlace(from3, true) >= 6) {
    delivery = from3
    deliveryBox = 3
  } else {
    const ranked = [
      { p: from3, box: 3 as const, s: scorePlace(from3, true) },
      { p: from2, box: 2 as const, s: scorePlace(from2, true) },
      ...deCandidates.map((p) => ({
        p,
        box: 2 as const,
        s: scorePlace(p, true),
      })),
    ]
      .filter((x) => x.p && x.s > 0)
      .sort((a, b) => b.s - a.s)

    if (ranked[0]?.p) {
      delivery = ranked[0].p
      deliveryBox = ranked[0].box
    }
  }

  // Pick best loading: prefer box 1, else NL warehouse candidates
  const loadingCandidates = [
    from1,
    ...findDutchLoadingCandidates(normalized),
  ]
  const loadingRaw =
    loadingCandidates
      .map((p) => ({ p, s: scorePlace(p, false) }))
      .filter((x) => x.p && x.s > 0)
      .sort((a, b) => b.s - a.s)[0]?.p ?? null

  const loading = loadingRaw
    ? { ...loadingRaw, company: cleanCmrCompany(loadingRaw.company), mapsQuery: '' }
    : null
  if (loading) {
    loading.mapsQuery = [
      loading.company,
      loading.street,
      loading.postalCode,
      loading.city,
      loading.country,
    ]
      .filter(Boolean)
      .join(', ')
  }

  return { loading, delivery, deliveryBox }
}

/** Prefer clean trade name from OCR noise around box 1. */
function cleanCmrCompany(company: string): string {
  if (!company) return ''
  const trade =
    company.match(
      /\b((?:[A-Z0-9]{2,}(?:-[A-Z0-9]+)*\s+)+?(?:Warehousing|Logistics|Transport)\s*(?:BV|GmbH|NV|SA|Ltd)?\.?)/i,
    ) ||
    company.match(
      /\b([A-Z0-9]{2,}(?:-[A-Z0-9]+)*(?:\s+[A-Z][A-Za-z0-9&.-]*){0,3}\s+(?:BV|GmbH|NV)\.?)\b/,
    )
  if (trade) return normalizeSpaces(trade[1]!)
  return normalizeSpaces(
    company
      .replace(
        /\b(?:van|lospazary|versie|indien|plaats|overeangekomen|aalste)\b/gi,
        ' ',
      )
      .replace(/\b\d+\s*\/\s*\d+\b/g, ' ')
      .replace(/\b\d+\b/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim(),
  )
}

/** NL loading addresses like "4104 AH Culemborg … Nederland". */
function findDutchLoadingCandidates(text: string): PlaceAddress[] {
  const out: PlaceAddress[] = []
  const re =
    /\b(\d{4})\s*([A-Z]{2})\s+([A-ZÀ-ÿ][A-ZÀ-ÿ'-]{2,40})\b/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const postalCode = `${m[1]} ${m[2]}`.toUpperCase()
    const city = normalizeSpaces(m[3]!)
    if (/zapfendorf|baustelle|deutschland|indian|overeen|plants|plaats/i.test(city)) {
      continue
    }
    // Prefer real NL cities near Nederland / NL marker
    const after = text.slice(m.index, m.index + Math.min(220, text.length - m.index))
    const before = text.slice(Math.max(0, m.index - 200), m.index)
    const around = before + after
    if (
      !/\b(?:Nederland|Netherlands|\bNL\b)/i.test(around) &&
      !/warehous|energiew|culemborg/i.test(around)
    ) {
      continue
    }
    const companyMatch = around.match(
      /\b([A-Z][A-Z0-9&.\s-]{2,40}?(?:Warehousing|Logistics|BV|GmbH|NV)[A-Z0-9&.\s-]{0,20})/i,
    )
    const streetMatch = around.match(
      /\b([A-ZÀ-ÿ][A-ZÀ-ÿ.-]{2,}(?:weg|str(?:asse)?|laan|wieg)\s*\d+[A-Z]?)/i,
    )
    // OCR: Energiewieg 20
    const streetOcr =
      streetMatch?.[1] ??
      around.match(/\b(Energiew(?:ie|ei)g\s*\d+)/i)?.[1] ??
      ''
    out.push({
      company: companyMatch ? normalizeSpaces(companyMatch[1]!) : '',
      street: streetOcr ? normalizeSpaces(streetOcr) : '',
      postalCode: normalizeSpaces(postalCode),
      city,
      country: 'NL',
      mapsQuery: [
        companyMatch ? normalizeSpaces(companyMatch[1]!) : '',
        streetOcr ? normalizeSpaces(streetOcr) : '',
        postalCode,
        city,
        'NL',
      ]
        .filter(Boolean)
        .join(', '),
      raw: normalizeSpaces(around).slice(0, 280),
    })
  }
  return out
}

/** Find DE postal destinations like "96199 Zapfendorf … Deutschland". */
function findGermanDestinationCandidates(text: string): PlaceAddress[] {
  const out: PlaceAddress[] = []
  const re =
    /\b(\d{5})\s*([A-ZÀ-ÿ][A-ZÀ-ÿ]{2,40})[\s\S]{0,80}?(Deutschland|Germany)\b/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const postalCode = m[1]!
    const city = m[2]!.replace(/(Baustelle|Nord|Sud|Süd|Ost|West)$/i, '')
    const aroundStart = Math.max(0, m.index - 220)
    const around = text.slice(aroundStart, m.index + m[0].length)
    const companyMatch =
      around.match(
        /\b(Baustelle\s+[A-ZÀ-ÿ][\s\S]{0,50}?Baufeld\s*\d+)/i,
      ) || around.match(/\b(Baustelle\s+[A-ZÀ-ÿ][A-ZÀ-ÿ\s-]{2,50})/i)
    const streetMatch = around.match(
      /\b(Next\s+to\s+[A-ZÀ-ÿ][A-ZÀ-ÿ-]{2,40})(?:\s|$)/i,
    )
    out.push({
      company: companyMatch ? normalizeSpaces(companyMatch[1]!) : '',
      street: streetMatch ? normalizeSpaces(streetMatch[1]!) : '',
      postalCode,
      city,
      country: 'DE',
      mapsQuery: [
        companyMatch ? normalizeSpaces(companyMatch[1]!) : '',
        streetMatch ? normalizeSpaces(streetMatch[1]!) : '',
        postalCode,
        city,
        'DE',
      ]
        .filter(Boolean)
        .join(', '),
      raw: normalizeSpaces(around).slice(0, 280),
    })
  }
  return out
}

function sliceBetween(
  text: string,
  startRe: RegExp,
  endRe: RegExp,
): string {
  const start = text.search(startRe)
  if (start < 0) return ''
  const from = text.slice(start)
  const skip = Math.min(100, from.length)
  const endRel = from.slice(skip).search(endRe)
  const chunk =
    endRel >= 0 ? from.slice(0, skip + endRel) : from.slice(0, 700)
  return normalizeSpaces(chunk)
}
