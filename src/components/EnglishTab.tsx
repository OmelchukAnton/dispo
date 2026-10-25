import { useMemo, useState } from 'react'
import {
  cardsForTopic,
  createEnglishCard,
  dueEnglishCards,
  ENGLISH_TIPS,
  ENGLISH_TOPICS,
  gradeEnglishCard,
  loadEnglishCards,
  saveEnglishCards,
} from '../data/englishCards'
import type {
  EnglishCard,
  EnglishCardKind,
  EnglishGrade,
  EnglishTopicId,
} from '../types'

type Mode = 'practice' | 'cards' | 'tips'
type TopicFilter = EnglishTopicId | 'all'

function topicLabel(id: EnglishTopicId): string {
  return ENGLISH_TOPICS.find((t) => t.id === id)?.label ?? id
}

export function EnglishTab() {
  const [cards, setCards] = useState<EnglishCard[]>(() => loadEnglishCards())
  const [mode, setMode] = useState<Mode>('practice')
  const [topic, setTopic] = useState<TopicFilter>('all')
  const [flipped, setFlipped] = useState(false)
  const [sessionDone, setSessionDone] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [example, setExample] = useState('')
  const [kind, setKind] = useState<EnglishCardKind>('word')
  const [addTopic, setAddTopic] = useState<EnglishTopicId>('daily')

  const scoped = useMemo(() => cardsForTopic(cards, topic), [cards, topic])
  const due = useMemo(() => dueEnglishCards(scoped), [scoped])
  const current = due[0] ?? null

  const topicCounts = useMemo(() => {
    const map = new Map<EnglishTopicId, number>()
    for (const c of cards) {
      map.set(c.topic, (map.get(c.topic) ?? 0) + 1)
    }
    return map
  }, [cards])

  function persist(next: EnglishCard[]) {
    setCards(next)
    saveEnglishCards(next)
  }

  function grade(g: EnglishGrade) {
    if (!current) return
    const updated = gradeEnglishCard(current, g)
    persist(cards.map((c) => (c.id === current.id ? updated : c)))
    setFlipped(false)
    setSessionDone((n) => n + 1)
  }

  function addCard() {
    const f = front.trim()
    const b = back.trim()
    if (!f || !b) {
      window.alert('Fill English and translation')
      return
    }
    persist([
      createEnglishCard({
        front: f,
        back: b,
        example,
        kind,
        topic: addTopic,
      }),
      ...cards,
    ])
    setFront('')
    setBack('')
    setExample('')
    setKind('word')
  }

  function removeCard(id: string) {
    if (!window.confirm('Delete this card?')) return
    persist(cards.filter((c) => c.id !== id))
  }

  function resetProgress() {
    if (
      !window.confirm(
        'Reset review progress for all cards? (texts stay, schedule starts over)',
      )
    ) {
      return
    }
    const now = Date.now()
    persist(
      cards.map((c) => ({
        ...c,
        nextReview: now,
        intervalDays: 0,
        ease: 2.5,
        reps: 0,
      })),
    )
    setSessionDone(0)
    setFlipped(false)
  }

  const tip = ENGLISH_TIPS[tipIndex % ENGLISH_TIPS.length]!
  const listCards = mode === 'cards' ? scoped : cards

  return (
    <section className="panel panel--english">
      <div className="panel__toolbar panel__toolbar--tight">
        <div>
          <h2 className="panel__title">English</h2>
          <p className="panel__hint panel__hint--tight">
            Pick a topic · short breaks · spaced repetition
          </p>
        </div>
        <div className="panel__toolbar-actions">
          <span className="badge">
            {due.length} due · {scoped.length}
            {topic !== 'all' ? ` in topic` : ` cards`}
          </span>
          <div className="english-modes" role="tablist" aria-label="English modes">
            {(
              [
                ['practice', 'Practice'],
                ['cards', 'Cards'],
                ['tips', 'Tips'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={mode === id}
                className={`btn btn--tiny ${mode === id ? 'btn--primary' : 'btn--ghost'}`}
                onClick={() => {
                  setMode(id)
                  setFlipped(false)
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mode !== 'tips' && (
        <div className="english-topics" role="group" aria-label="Topics">
          <button
            type="button"
            className={`english-topic-chip${topic === 'all' ? ' is-active' : ''}`}
            onClick={() => {
              setTopic('all')
              setFlipped(false)
            }}
          >
            All
            <span className="english-topic-chip__count">{cards.length}</span>
          </button>
          {ENGLISH_TOPICS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`english-topic-chip${topic === t.id ? ' is-active' : ''}`}
              title={t.hint}
              onClick={() => {
                setTopic(t.id)
                setFlipped(false)
              }}
            >
              {t.label}
              <span className="english-topic-chip__count">
                {topicCounts.get(t.id) ?? 0}
              </span>
            </button>
          ))}
        </div>
      )}

      {mode === 'practice' && (
        <div className="english-practice">
          {sessionDone > 0 && (
            <p className="english-session muted">
              Reviewed this session: {sessionDone}
            </p>
          )}

          {!current ? (
            <div className="english-empty calc-card">
              <h3 className="panel__subtitle">All caught up</h3>
              <p className="panel__hint">
                {topic === 'all'
                  ? 'No cards due right now. Pick a topic or check Tips.'
                  : `No due cards in “${topicLabel(topic)}”. Try another topic or All.`}
              </p>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setMode('cards')}
              >
                Manage cards
              </button>
            </div>
          ) : (
            <div className="english-card-wrap">
              <button
                type="button"
                className={`english-flashcard${flipped ? ' is-flipped' : ''}`}
                onClick={() => setFlipped((v) => !v)}
                aria-label={flipped ? 'Show front' : 'Show answer'}
              >
                <span className="english-flashcard__meta">
                  <span className="english-flashcard__kind">{current.kind}</span>
                  <span className="english-flashcard__topic">
                    {topicLabel(current.topic)}
                  </span>
                </span>
                {!flipped ? (
                  <>
                    <strong className="english-flashcard__front">
                      {current.front}
                    </strong>
                    <span className="english-flashcard__hint">Tap to reveal</span>
                  </>
                ) : (
                  <>
                    <strong className="english-flashcard__back">
                      {current.back}
                    </strong>
                    {current.example && (
                      <span className="english-flashcard__example">
                        {current.example}
                      </span>
                    )}
                  </>
                )}
              </button>

              {flipped && (
                <div className="english-grades">
                  <button
                    type="button"
                    className="btn btn--danger"
                    onClick={() => grade('again')}
                  >
                    Again
                  </button>
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => grade('good')}
                  >
                    Good
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => grade('easy')}
                  >
                    Easy
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {mode === 'cards' && (
        <div className="english-manage">
          <div className="calc-card english-add">
            <h3 className="panel__subtitle">Add card</h3>
            <div className="english-add__grid">
              <label className="field">
                <span>English</span>
                <input
                  className="input"
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="word or phrase"
                />
              </label>
              <label className="field">
                <span>Translation / meaning</span>
                <input
                  className="input"
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="русский перевод"
                />
              </label>
              <label className="field">
                <span>Example (optional)</span>
                <input
                  className="input"
                  value={example}
                  onChange={(e) => setExample(e.target.value)}
                  placeholder="Example sentence"
                />
              </label>
              <label className="field">
                <span>Type</span>
                <select
                  className="select"
                  value={kind}
                  onChange={(e) =>
                    setKind(e.target.value as EnglishCardKind)
                  }
                >
                  <option value="word">Word</option>
                  <option value="phrase">Phrase</option>
                  <option value="rule">Rule</option>
                </select>
              </label>
              <label className="field">
                <span>Topic</span>
                <select
                  className="select"
                  value={addTopic}
                  onChange={(e) =>
                    setAddTopic(e.target.value as EnglishTopicId)
                  }
                >
                  {ENGLISH_TOPICS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="ref-actions">
              <button type="button" className="btn btn--primary" onClick={addCard}>
                Add
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--tiny"
                onClick={resetProgress}
              >
                Reset progress
              </button>
            </div>
          </div>

          <div className="truck-list-card english-list-card">
            <h3 className="panel__subtitle">
              Your cards ({listCards.length}
              {topic !== 'all' ? ` · ${topicLabel(topic)}` : ''})
            </h3>
            <ul className="english-list">
              {listCards.map((c) => {
                const isDue = c.nextReview <= Date.now()
                return (
                  <li key={c.id} className="english-list__item">
                    <div className="english-list__main">
                      <span className={`english-kind english-kind--${c.kind}`}>
                        {c.kind}
                      </span>
                      <span className="english-topic-tag">
                        {topicLabel(c.topic)}
                      </span>
                      <strong>{c.front}</strong>
                      <span className="muted">{c.back}</span>
                      {isDue && <span className="english-due">due</span>}
                    </div>
                    <button
                      type="button"
                      className="btn btn--danger btn--tiny"
                      onClick={() => removeCard(c.id)}
                    >
                      Delete
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}

      {mode === 'tips' && (
        <div className="english-tips calc-card">
          <h3 className="panel__subtitle">{tip.title}</h3>
          <p className="english-tips__body">{tip.body}</p>
          <p className="english-tips__example">{tip.example}</p>
          <div className="ref-actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() =>
                setTipIndex((i) => (i - 1 + ENGLISH_TIPS.length) % ENGLISH_TIPS.length)
              }
            >
              Prev
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setTipIndex((i) => (i + 1) % ENGLISH_TIPS.length)}
            >
              Next tip
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
