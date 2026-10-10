import type { EnglishCard, EnglishCardKind, EnglishGrade } from '../types'

export const ENGLISH_STORAGE_KEY = 'dispatch-english-v1'

type StarterSeed = {
  front: string
  back: string
  example: string
  kind: EnglishCardKind
}

const STARTER: StarterSeed[] = [
  // —— Everyday ——
  { kind: 'word', front: 'however', back: 'однако / тем не менее', example: 'It is late; however, we can still finish.' },
  { kind: 'word', front: 'although', back: 'хотя', example: 'Although it rains, we continue.' },
  { kind: 'word', front: 'instead', back: 'вместо этого', example: 'Take the train instead of the bus.' },
  { kind: 'word', front: 'already', back: 'уже', example: 'I have already called him.' },
  { kind: 'word', front: 'yet', back: 'ещё (в вопросах/отрицаниях)', example: 'Has he arrived yet?' },
  { kind: 'word', front: 'enough', back: 'достаточно', example: 'We have enough time.' },
  { kind: 'word', front: 'almost', back: 'почти', example: 'We are almost there.' },
  { kind: 'word', front: 'probably', back: 'вероятно', example: 'He will probably be late.' },
  { kind: 'word', front: 'suddenly', back: 'внезапно', example: 'Suddenly the phone rang.' },
  { kind: 'word', front: 'carefully', back: 'осторожно / внимательно', example: 'Drive carefully in the rain.' },
  { kind: 'word', front: 'quickly', back: 'быстро', example: 'Please reply quickly.' },
  { kind: 'word', front: 'usually', back: 'обычно', example: 'I usually start at 7.' },
  { kind: 'word', front: 'rarely', back: 'редко', example: 'He rarely takes a break.' },
  { kind: 'word', front: 'often', back: 'часто', example: 'We often work on weekends.' },
  { kind: 'word', front: 'remind', back: 'напомнить', example: 'Please remind me tomorrow.' },
  { kind: 'word', front: 'prefer', back: 'предпочитать', example: 'I prefer morning meetings.' },
  { kind: 'word', front: 'suggest', back: 'предлагать', example: 'I suggest we call the client.' },
  { kind: 'word', front: 'expect', back: 'ожидать', example: 'I expect him at 10.' },
  { kind: 'word', front: 'avoid', back: 'избегать', example: 'Avoid the city centre today.' },
  { kind: 'word', front: 'improve', back: 'улучшать', example: 'I want to improve my English.' },
  { kind: 'word', front: 'decide', back: 'решить', example: 'We need to decide now.' },
  { kind: 'word', front: 'explain', back: 'объяснить', example: 'Can you explain the problem?' },
  { kind: 'word', front: 'agree', back: 'соглашаться', example: 'I agree with you.' },
  { kind: 'word', front: 'disagree', back: 'не соглашаться', example: 'I disagree with this plan.' },
  { kind: 'word', front: 'borrow', back: 'взять взаймы', example: 'Can I borrow your pen?' },
  { kind: 'word', front: 'lend', back: 'дать взаймы', example: 'Can you lend me 10 euros?' },
  { kind: 'word', front: 'appoint', back: 'назначить (встречу/время)', example: 'Let us appoint a time.' },
  { kind: 'word', front: 'urgent', back: 'срочный', example: 'This is an urgent message.' },
  { kind: 'word', front: 'reliable', back: 'надёжный', example: 'He is a reliable driver.' },
  { kind: 'word', front: 'useful', back: 'полезный', example: 'This tip is very useful.' },

  // —— Daily phrases ——
  { kind: 'phrase', front: 'How are you?', back: 'Как дела?', example: 'Hi! How are you today?' },
  { kind: 'phrase', front: 'Nice to meet you', back: 'Приятно познакомиться', example: 'Nice to meet you, Anna.' },
  { kind: 'phrase', front: 'See you later', back: 'Увидимся позже', example: 'Okay, see you later.' },
  { kind: 'phrase', front: 'Take care', back: 'Береги себя', example: 'Drive safe. Take care!' },
  { kind: 'phrase', front: 'No problem', back: 'Без проблем', example: 'Thanks! — No problem.' },
  { kind: 'phrase', front: 'I am not sure', back: 'Я не уверен', example: 'I am not sure about the time.' },
  { kind: 'phrase', front: 'It depends', back: 'Зависит от ситуации', example: 'It depends on the traffic.' },
  { kind: 'phrase', front: 'In my opinion', back: 'По моему мнению', example: 'In my opinion, we should wait.' },
  { kind: 'phrase', front: 'As far as I know', back: 'Насколько мне известно', example: 'As far as I know, he left at 6.' },
  { kind: 'phrase', front: 'To be honest', back: 'Честно говоря', example: 'To be honest, I forgot.' },
  { kind: 'phrase', front: 'Let me check', back: 'Дай мне проверить', example: 'Let me check and call you back.' },
  { kind: 'phrase', front: 'I will call you back', back: 'Я перезвоню', example: 'I am busy now. I will call you back.' },
  { kind: 'phrase', front: 'Could you speak slower?', back: 'Можете говорить медленнее?', example: 'Sorry, could you speak slower, please?' },
  { kind: 'phrase', front: 'What does it mean?', back: 'Что это значит?', example: 'What does this word mean?' },
  { kind: 'phrase', front: 'I did not catch that', back: 'Я не расслышал', example: 'Sorry, I did not catch that.' },
  { kind: 'phrase', front: 'Can you repeat, please?', back: 'Можете повторить, пожалуйста?', example: 'Can you repeat the address, please?' },
  { kind: 'phrase', front: 'That makes sense', back: 'Это логично / понятно', example: 'Okay, that makes sense.' },
  { kind: 'phrase', front: 'I am looking forward to…', back: 'Я с нетерпением жду…', example: 'I am looking forward to the weekend.' },
  { kind: 'phrase', front: 'Never mind', back: 'Неважно / забудь', example: 'Never mind, I found it.' },
  { kind: 'phrase', front: 'Hang on a second', back: 'Подожди секунду', example: 'Hang on a second, please.' },

  // —— Work / office ——
  { kind: 'word', front: 'deadline', back: 'срок сдачи', example: 'The deadline is Friday.' },
  { kind: 'word', front: 'meeting', back: 'встреча / совещание', example: 'We have a meeting at 9.' },
  { kind: 'word', front: 'schedule', back: 'расписание / график', example: 'Check the schedule, please.' },
  { kind: 'word', front: 'shift', back: 'смена', example: 'He works the night shift.' },
  { kind: 'word', front: 'overtime', back: 'сверхурочная работа', example: 'We did two hours of overtime.' },
  { kind: 'word', front: 'colleague', back: 'коллега', example: 'Ask your colleague for help.' },
  { kind: 'word', front: 'manager', back: 'менеджер / руководитель', example: 'Talk to the manager.' },
  { kind: 'word', front: 'task', back: 'задача', example: 'This is your next task.' },
  { kind: 'word', front: 'issue', back: 'проблема / вопрос', example: 'There is an issue with the papers.' },
  { kind: 'word', front: 'solution', back: 'решение', example: 'We need a quick solution.' },
  { kind: 'phrase', front: 'I am on it', back: 'Я уже занимаюсь этим', example: 'Got it — I am on it.' },
  { kind: 'phrase', front: 'Let us follow up', back: 'Давай продолжим / уточним позже', example: 'Let us follow up tomorrow morning.' },
  { kind: 'phrase', front: 'Please keep me in the loop', back: 'Держи меня в курсе', example: 'Please keep me in the loop.' },
  { kind: 'phrase', front: 'I will take care of it', back: 'Я этим займусь', example: 'Do not worry, I will take care of it.' },
  { kind: 'phrase', front: 'Any updates?', back: 'Есть новости / обновления?', example: 'Any updates on the order?' },

  // —— Travel ——
  { kind: 'word', front: 'airport', back: 'аэропорт', example: 'Meet me at the airport.' },
  { kind: 'word', front: 'passport', back: 'паспорт', example: 'Do not forget your passport.' },
  { kind: 'word', front: 'luggage', back: 'багаж', example: 'Where is my luggage?' },
  { kind: 'word', front: 'ticket', back: 'билет', example: 'I bought a train ticket.' },
  { kind: 'word', front: 'reservation', back: 'бронь', example: 'I have a hotel reservation.' },
  { kind: 'word', front: 'direction', back: 'направление / указание пути', example: 'Can you give me directions?' },
  { kind: 'phrase', front: 'How do I get to…?', back: 'Как мне добраться до…?', example: 'How do I get to the station?' },
  { kind: 'phrase', front: 'Is it far from here?', back: 'Это далеко отсюда?', example: 'Is the hotel far from here?' },
  { kind: 'phrase', front: 'I am lost', back: 'Я заблудился', example: 'Excuse me, I am lost.' },
  { kind: 'phrase', front: 'One way or return?', back: 'В одну сторону или туда-обратно?', example: 'A return ticket, please.' },

  // —— Food / cafe ——
  { kind: 'word', front: 'bill / check', back: 'счёт', example: 'Can I have the bill, please?' },
  { kind: 'word', front: 'menu', back: 'меню', example: 'Could I see the menu?' },
  { kind: 'word', front: 'spicy', back: 'острый', example: 'Is this dish spicy?' },
  { kind: 'word', front: 'delicious', back: 'вкусно / восхитительно', example: 'This soup is delicious.' },
  { kind: 'phrase', front: 'I would like…', back: 'Я бы хотел…', example: 'I would like a coffee, please.' },
  { kind: 'phrase', front: 'The same for me', back: 'Мне то же самое', example: 'The same for me, please.' },
  { kind: 'phrase', front: 'I am allergic to…', back: 'У меня аллергия на…', example: 'I am allergic to nuts.' },
  { kind: 'phrase', front: 'Is service included?', back: 'Чаевые / сервис включены?', example: 'Is service included in the bill?' },

  // —— Health / feelings ——
  { kind: 'word', front: 'tired', back: 'усталый', example: 'I am tired after the shift.' },
  { kind: 'word', front: 'hungry', back: 'голодный', example: 'I am hungry.' },
  { kind: 'word', front: 'thirsty', back: 'хочу пить', example: 'I am thirsty.' },
  { kind: 'word', front: 'stressed', back: 'в стрессе', example: 'I feel stressed today.' },
  { kind: 'word', front: 'pain', back: 'боль', example: 'I have a pain in my back.' },
  { kind: 'phrase', front: 'I do not feel well', back: 'Мне нехорошо', example: 'I do not feel well today.' },
  { kind: 'phrase', front: 'Get well soon', back: 'Выздоравливай скорее', example: 'Get well soon!' },

  // —— Time / numbers language ——
  { kind: 'phrase', front: 'the day after tomorrow', back: 'послезавтра', example: 'See you the day after tomorrow.' },
  { kind: 'phrase', front: 'the day before yesterday', back: 'позавчера', example: 'He called the day before yesterday.' },
  { kind: 'phrase', front: 'in advance', back: 'заранее', example: 'Please tell me in advance.' },
  { kind: 'phrase', front: 'on time', back: 'вовремя', example: 'Please arrive on time.' },
  { kind: 'phrase', front: 'ahead of schedule', back: 'раньше графика', example: 'We are ahead of schedule.' },
  { kind: 'phrase', front: 'behind schedule', back: 'с отставанием от графика', example: 'We are behind schedule.' },

  // —— Logistics (keep some useful ones) ——
  { kind: 'phrase', front: 'ETA', back: 'Estimated Time of Arrival — расчётное время прибытия', example: 'What is your ETA?' },
  { kind: 'phrase', front: 'Please confirm', back: 'Пожалуйста, подтвердите', example: 'Everything clear? Please confirm.' },
  { kind: 'phrase', front: 'Safe parking', back: 'Безопасная парковка', example: 'We need safe parking tonight.' },
  { kind: 'phrase', front: 'Traffic ban', back: 'Запрет движения', example: 'There is a traffic ban until 16:00.' },
  { kind: 'phrase', front: 'As soon as possible (ASAP)', back: 'Как можно скорее', example: 'Please call me ASAP.' },
  { kind: 'phrase', front: 'I will keep you updated', back: 'Буду держать в курсе', example: 'I will keep you updated.' },
  { kind: 'phrase', front: 'Could you please…?', back: 'Не могли бы вы…?', example: 'Could you please send the documents?' },
  { kind: 'phrase', front: 'I am running late', back: 'Я опаздываю', example: 'I am running late because of traffic.' },
  { kind: 'word', front: 'delay', back: 'задержка', example: 'Sorry for the delay.' },
  { kind: 'word', front: 'available', back: 'доступен / свободен', example: 'Are you available now?' },
  { kind: 'word', front: 'warehouse', back: 'склад', example: 'Go to the warehouse.' },
  { kind: 'word', front: 'breakdown', back: 'поломка', example: 'We had a breakdown.' },

  // —— Grammar rules ——
  { kind: 'rule', front: 'a / an', back: 'a — согласный звук; an — гласный звук', example: 'a car · an hour · an email' },
  { kind: 'rule', front: 'Present Simple vs Continuous', back: 'Simple — факты/расписание; Continuous — сейчас', example: 'I work here. / I am working now.' },
  { kind: 'rule', front: 'Prepositions of time', back: 'at + time, on + day, in + month/year', example: 'at 8 · on Monday · in July' },
  { kind: 'rule', front: 'much / many', back: 'much — неисчисляемые; many — исчисляемые', example: 'much time · many trucks' },
  { kind: 'rule', front: 'some / any', back: 'some — утверждение; any — вопрос/отрицание', example: 'I have some ideas. / Do you have any questions?' },
  { kind: 'rule', front: 'for / since', back: 'for — период; since — точка начала', example: 'for 2 hours · since 9:00' },
  { kind: 'rule', front: 'still / yet / already', back: 'still — всё ещё; yet — ещё? уже?; already — уже', example: 'still waiting · not yet · already done' },
  { kind: 'rule', front: 'will vs going to', back: 'will — решение сейчас; going to — план', example: 'I will help. / I am going to rest.' },
  { kind: 'rule', front: 'Comparative adjectives', back: 'короткие: -er; длинные: more + adj', example: 'faster · more important' },
  { kind: 'rule', front: 'Countable vs uncountable', back: 'a/an/many — count; much/a little — uncount', example: 'a message · much information' },
  { kind: 'rule', front: 'Polite softeners', back: 'Could / Would / Please делают просьбу мягче', example: 'Could you help me, please?' },
  { kind: 'rule', front: 'Present Perfect idea', back: 'опыт/результат к настоящему: have/has + V3', example: 'I have already sent the email.' },
]


function seedId(front: string, kind: EnglishCardKind): string {
  return `seed:${kind}:${front.toLowerCase().replace(/\s+/g, '-').slice(0, 48)}`
}

function cardFromSeed(seed: StarterSeed, now: number): EnglishCard {
  return {
    id: seedId(seed.front, seed.kind),
    front: seed.front,
    back: seed.back,
    example: seed.example,
    kind: seed.kind,
    nextReview: now,
    intervalDays: 0,
    ease: 2.5,
    reps: 0,
  }
}

function newId(): string {
  return `card:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`
}

export function createEnglishCard(input: {
  front: string
  back: string
  example?: string
  kind?: EnglishCardKind
}): EnglishCard {
  const now = Date.now()
  return {
    id: newId(),
    front: input.front.trim(),
    back: input.back.trim(),
    example: (input.example ?? '').trim(),
    kind: input.kind ?? 'word',
    nextReview: now,
    intervalDays: 0,
    ease: 2.5,
    reps: 0,
  }
}

function normalizeCard(raw: Partial<EnglishCard>): EnglishCard | null {
  if (!raw || typeof raw.front !== 'string' || typeof raw.back !== 'string') {
    return null
  }
  const front = raw.front.trim()
  const back = raw.back.trim()
  if (!front || !back) return null
  const kind: EnglishCardKind =
    raw.kind === 'phrase' || raw.kind === 'rule' || raw.kind === 'word'
      ? raw.kind
      : 'word'
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newId(),
    front,
    back,
    example: typeof raw.example === 'string' ? raw.example : '',
    kind,
    nextReview: Number.isFinite(raw.nextReview) ? Number(raw.nextReview) : Date.now(),
    intervalDays: Number.isFinite(raw.intervalDays) ? Math.max(0, Number(raw.intervalDays)) : 0,
    ease: Number.isFinite(raw.ease) ? Math.max(1.3, Number(raw.ease)) : 2.5,
    reps: Number.isFinite(raw.reps) ? Math.max(0, Number(raw.reps)) : 0,
  }
}

export function loadEnglishCards(): EnglishCard[] {
  const now = Date.now()
  const seeded = STARTER.map((s) => cardFromSeed(s, now))
  const raw = localStorage.getItem(ENGLISH_STORAGE_KEY)

  if (!raw) {
    saveEnglishCards(seeded)
    return seeded
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) throw new Error('bad')
    const cards = parsed
      .map((c) => normalizeCard(c as Partial<EnglishCard>))
      .filter((c): c is EnglishCard => c != null)

    if (cards.length === 0) {
      saveEnglishCards(seeded)
      return seeded
    }

    // Merge any new starter cards the user does not have yet
    const byId = new Set(cards.map((c) => c.id))
    const missing = seeded.filter((s) => !byId.has(s.id))
    if (missing.length === 0) return cards

    const merged = [...cards, ...missing]
    saveEnglishCards(merged)
    return merged
  } catch {
    saveEnglishCards(seeded)
    return seeded
  }
}

export function saveEnglishCards(cards: EnglishCard[]): void {
  localStorage.setItem(ENGLISH_STORAGE_KEY, JSON.stringify(cards))
}

export function dueEnglishCards(
  cards: EnglishCard[],
  now = Date.now(),
): EnglishCard[] {
  return cards
    .filter((c) => c.nextReview <= now)
    .sort((a, b) => a.nextReview - b.nextReview || a.front.localeCompare(b.front))
}

/** Simple spaced-repetition step after a grade. */
export function gradeEnglishCard(
  card: EnglishCard,
  grade: EnglishGrade,
  now = Date.now(),
): EnglishCard {
  let { intervalDays, ease, reps } = card

  if (grade === 'again') {
    reps = 0
    intervalDays = 0
    ease = Math.max(1.3, ease - 0.2)
    return {
      ...card,
      reps,
      intervalDays,
      ease,
      nextReview: now + 10 * 60 * 1000, // 10 minutes
    }
  }

  if (grade === 'good') {
    if (reps === 0) intervalDays = 1
    else if (reps === 1) intervalDays = 3
    else intervalDays = Math.max(1, Math.round(intervalDays * ease))
    reps += 1
  } else {
    // easy
    if (reps === 0) intervalDays = 2
    else if (reps === 1) intervalDays = 5
    else intervalDays = Math.max(2, Math.round(intervalDays * ease * 1.3))
    ease = Math.min(3.0, ease + 0.15)
    reps += 1
  }

  return {
    ...card,
    reps,
    intervalDays,
    ease,
    nextReview: now + intervalDays * 24 * 60 * 60 * 1000,
  }
}

export const ENGLISH_TIPS: { title: string; body: string; example: string }[] = [
  {
    title: 'Polite requests',
    body: 'Вместо “Send CMR” лучше: “Could you please send the CMR?”',
    example: 'Could you please confirm the unloading time?',
  },
  {
    title: 'at / on / in',
    body: 'at — точное время; on — день/дата; in — месяц, год, период.',
    example: 'at 6:00 · on Monday · in the morning',
  },
  {
    title: 'will vs going to',
    body: 'will — решение сейчас / обещание; going to — уже запланировано.',
    example: 'I will call the driver. / We are going to unload at 8.',
  },
  {
    title: 'Articles a / an',
    body: 'Смотри на звук, не на букву: an hour, a European truck.',
    example: 'an ETA · a warehouse · an order',
  },
  {
    title: 'Sorry + reason',
    body: 'Извинение + because / due to звучит профессионально.',
    example: 'Sorry for the delay due to traffic.',
  },
  {
    title: 'Confirm clearly',
    body: 'В диспетчерских сообщениях заканчивай вопросом на подтверждение.',
    example: 'Everything clear? Please confirm.',
  },
]
