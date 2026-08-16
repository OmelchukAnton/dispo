import { useMemo, useState } from 'react'

type PluginLang = 'en' | 'ru' | 'de' | 'pl'

const PLUGIN_LANGS: { id: PluginLang; label: string }[] = [
  { id: 'en', label: 'EN' },
  { id: 'ru', label: 'RU' },
  { id: 'de', label: 'DE' },
  { id: 'pl', label: 'PL' },
]

const COUNTRY_PAGES: { code: string; name: string; path: string }[] = [
  { code: 'DE', name: 'Germany', path: 'country.germany.home.135.en.html' },
  { code: 'IT', name: 'Italy', path: 'country.italy.home.213.en.html' },
  { code: 'FR', name: 'France', path: 'country.france.home.56.en.html' },
  { code: 'AT', name: 'Austria', path: 'country.austria.home.14.en.html' },
  { code: 'PL', name: 'Poland', path: 'country.poland.home.151.en.html' },
  { code: 'BE', name: 'Belgium', path: 'country.belgium.home.20.en.html' },
  { code: 'NL', name: 'Netherlands', path: 'country.netherlands.home.76.en.html' },
  { code: 'CH', name: 'Switzerland', path: 'country.switzerland.home.181.en.html' },
  { code: 'HU', name: 'Hungary', path: 'country.hungary.home.212.en.html' },
  { code: 'CZ', name: 'Czech Republic', path: 'country.czech_republic.home.41.en.html' },
]

const DE_SUNDAY =
  'Traffic ban in Germany on Sunday 00:00–22:00 (trucks >7.5t).'
const DE_SUMMER_SAT =
  'Summer holiday ban in Germany: Saturdays 01 Jul–31 Aug, 07:00–20:00 on listed Autobahn / federal road sections (trucks >7.5t).'
const DE_COPY_EN =
  'Traffic ban in Germany from 7:00 (Sunday ban until 22:00 / summer Saturday 07:00–20:00 on restricted sections).'
const DE_COPY_RU =
  'Трафик бан в Германии с 7:00 (воскресенье до 22:00 / летняя суббота 07:00–20:00 на запретных участках).'

function pluginSrc(lang: PluginLang): string {
  return `https://trafficban.com/plugins/box.html?href=trafficban.com&language=${lang}`
}

function countryUrl(path: string): string {
  return `https://trafficban.com/${path}`
}

export function TrafficBansTab() {
  const [lang, setLang] = useState<PluginLang>('en')
  const [copied, setCopied] = useState<'en' | 'ru' | null>(null)

  const src = useMemo(() => pluginSrc(lang), [lang])

  async function copyText(kind: 'en' | 'ru') {
    const text = kind === 'en' ? DE_COPY_EN : DE_COPY_RU
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      window.setTimeout(() => setCopied(null), 1500)
    } catch {
      // ignore
    }
  }

  return (
    <section className="panel">
      <div className="panel__toolbar">
        <div>
          <h2 className="panel__title">Traffic bans</h2>
          <p className="panel__hint">
            Live feed from{' '}
            <a href="https://trafficban.com/" target="_blank" rel="noreferrer">
              trafficban.com
            </a>
            . Auxiliary info only — always confirm before planning.
          </p>
        </div>
      </div>

      <div className="trafficban-layout">
        <div className="trafficban-main">
          <div className="panel__toolbar panel__toolbar--tight">
            <h3 className="panel__subtitle">Europe bans (widget)</h3>
            <div className="panel__toolbar-actions">
              {PLUGIN_LANGS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className={`btn btn--tiny ${lang === l.id ? 'btn--primary' : 'btn--ghost'}`}
                  onClick={() => setLang(l.id)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="trafficban-frame-wrap">
            <iframe
              key={src}
              title="trafficban.com truck bans"
              src={src}
              className="trafficban-frame"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <aside className="trafficban-side">
          <article className="upload-card">
            <h3 className="panel__subtitle">Germany quick ref</h3>
            <ul className="trafficban-bullets">
              <li>
                <strong>Sunday:</strong> 00:00–22:00, trucks &gt;7.5t
                (nationwide, with exemptions).
              </li>
              <li>
                <strong>Summer Sat:</strong> 1 Jul–31 Aug, 07:00–20:00 on
                listed Autobahn / B-road sections only.
              </li>
            </ul>
            <p className="panel__hint">{DE_SUNDAY}</p>
            <p className="panel__hint">{DE_SUMMER_SAT}</p>
            <div className="ref-actions">
              <button
                type="button"
                className="btn btn--primary btn--tiny"
                onClick={() => void copyText('en')}
              >
                {copied === 'en' ? 'Copied' : 'Copy EN line'}
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--tiny"
                onClick={() => void copyText('ru')}
              >
                {copied === 'ru' ? 'Copied' : 'Copy RU line'}
              </button>
              <a
                className="btn btn--ghost btn--tiny"
                href={countryUrl('country.germany.home.135.en.html')}
                target="_blank"
                rel="noreferrer"
              >
                Open DE page
              </a>
            </div>
          </article>

          <article className="upload-card">
            <h3 className="panel__subtitle">Country pages</h3>
            <div className="trafficban-countries">
              {COUNTRY_PAGES.map((c) => (
                <a
                  key={c.code}
                  href={countryUrl(c.path)}
                  target="_blank"
                  rel="noreferrer"
                  className="trafficban-country"
                >
                  <span className="truck-id">{c.code}</span>
                  <span>{c.name}</span>
                </a>
              ))}
            </div>
          </article>
        </aside>
      </div>
    </section>
  )
}
