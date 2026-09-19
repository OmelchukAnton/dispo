import type { WeeklyInstructionForm } from '../types'

export function defaultWeeklyForm(): WeeklyInstructionForm {
  return {
    lang: 'en',
    pauseKind: 'short',
    todayKind: 'parking_from_task',
    tonightPause: '9',
    tomorrowStart: '3:00',
    tomorrowGoal: 'next_parking',
    tomorrowCustom: '',
    trafficBan: false,
    trafficBanCountry: 'Italy',
    trafficBanFrom: '8:00',
    trafficBanUntil: '',
    mondayStart: '6:00',
    mondayAction: 'unloading',
    mondayCustom: '',
    mondayArriveBy: '',
    trailerSwapTime: '',
    envelopes: true,
    driverChange: false,
    everythingClear: true,
    extraNotes: '',
  }
}

function fmtTime(raw: string): string {
  const t = raw.trim()
  if (!t) return ''
  const m = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i)
  if (!m) return t
  let h = Number(m[1])
  const min = m[2] ?? '00'
  const ap = m[3]?.toLowerCase()
  if (ap === 'pm' && h < 12) h += 12
  if (ap === 'am' && h === 12) h = 0
  return `${h}:${min}`
}

function joinParagraphs(parts: Array<string | null | undefined>): string {
  return parts
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
    .join('\n\n')
}

function todayLineEn(f: WeeklyInstructionForm): string {
  switch (f.todayKind) {
    case 'after_loading':
      return 'Today after loading we drive to the parking lot that is in the task'
    case 'drive_full_time':
      return 'Today drive full time and stay on parking from the task'
    case 'after_ferry':
      return 'After ferry drive to the parking from the task'
    case 'near_company':
      return 'Today after loading stay on parking near the company'
    default:
      return 'Today drive to the parking from the task'
  }
}

function todayLineRu(f: WeeklyInstructionForm): string {
  switch (f.todayKind) {
    case 'after_loading':
      return 'Сегодня после загрузки едем на паркинг который стоит в задании'
    case 'drive_full_time':
      return 'Сегодня едем полное время и становимся на паркинг по заданию'
    case 'after_ferry':
      return 'После парома едем на паркинг по заданию'
    case 'near_company':
      return 'Сегодня после загрузки становимся на паркинг около компании'
    default:
      return 'Сегодня доезжайте до паркинга по заданию'
  }
}

function pauseLineEn(f: WeeklyInstructionForm): string | null {
  if (f.tonightPause === 'none' || f.tonightPause === 'pull_chip') return null
  return `make ${f.tonightPause}h pause`
}

function pauseLineRu(f: WeeklyInstructionForm): string | null {
  if (f.tonightPause === 'none' || f.tonightPause === 'pull_chip') return null
  return `делайте паузу ${f.tonightPause}ч`
}

/** Chip is pulled on tomorrow's parking (long pause / pull_chip). */
function pullChipTomorrow(f: WeeklyInstructionForm): boolean {
  return f.pauseKind === 'long' || f.tonightPause === 'pull_chip'
}

function tomorrowGoalEn(f: WeeklyInstructionForm): string {
  const start = fmtTime(f.tomorrowStart)
  const startBit = start ? `tomorrow start ${start}` : 'tomorrow start'
  let goal: string
  if (f.tomorrowGoal === 'close_to_delivery') {
    goal = `${startBit} go as close as possible to the delivery place and stay on next parking from the task`
  } else if (f.tomorrowGoal === 'custom' && f.tomorrowCustom.trim()) {
    goal = `${startBit} ${f.tomorrowCustom.trim()}`
  } else {
    goal = `${startBit} go to the next parking and stay on next parking from the task`
  }
  if (pullChipTomorrow(f)) {
    goal += ' and pull out the chip'
  }
  return goal
}

function tomorrowGoalRu(f: WeeklyInstructionForm): string {
  const start = fmtTime(f.tomorrowStart)
  const startBit = start ? `завтра старт ${start}` : 'завтра старт'
  let goal: string
  if (f.tomorrowGoal === 'close_to_delivery') {
    goal = `${startBit} доезжайте как можно ближе к месту выгрузки и становитесь на следующий паркинг по заданию`
  } else if (f.tomorrowGoal === 'custom' && f.tomorrowCustom.trim()) {
    goal = `${startBit} ${f.tomorrowCustom.trim()}`
  } else {
    goal = `${startBit} едем на следующий паркинг по заданию и становимся на нём`
  }
  if (pullChipTomorrow(f)) {
    goal += ' и вытаскиваем чип'
  }
  return goal
}

function trafficBanEn(f: WeeklyInstructionForm): string | null {
  if (!f.trafficBan) return null
  const country = f.trafficBanCountry.trim() || 'Italy'
  const from = fmtTime(f.trafficBanFrom)
  const until = fmtTime(f.trafficBanUntil)
  if (from && until) {
    return `From ${from} until ${until} traffic ban in ${country}`
  }
  if (from) return `Traffic ban in ${country} from ${from}`
  return `Traffic ban in ${country}`
}

function trafficBanRu(f: WeeklyInstructionForm): string | null {
  if (!f.trafficBan) return null
  const country = f.trafficBanCountry.trim() || 'Италии'
  const from = fmtTime(f.trafficBanFrom)
  const until = fmtTime(f.trafficBanUntil)
  if (from && until) {
    return `Трафик бан в ${country} с ${from} до ${until}`
  }
  if (from) return `Трафик бан в ${country} с ${from}`
  return `Трафик бан в ${country}`
}

function mondayLineEn(f: WeeklyInstructionForm): string {
  const start = fmtTime(f.mondayStart)
  const startBit = start ? `On Monday start at ${start}` : 'On Monday'

  if (f.pauseKind === 'long' && f.envelopes) {
    const action =
      f.mondayAction === 'loading'
        ? 'and drive to loading'
        : f.mondayAction === 'wait_order'
          ? 'and wait for the order'
          : f.mondayAction === 'trailer_swap'
            ? `and go to the trailer swap${f.trailerSwapTime.trim() ? ` at ${fmtTime(f.trailerSwapTime)}` : ''}`
            : f.mondayAction === 'custom' && f.mondayCustom.trim()
              ? `and drive to ${f.mondayCustom.trim()}`
              : `and drive to unload${f.mondayArriveBy.trim() ? ` to be at delivery at ${fmtTime(f.mondayArriveBy)}` : ''}`

    return [
      startBit
        ? `On Monday at ${start || 'start'} we insert the chip and do manual entry of 2 hours of envelopes (1 hour for Saturday and 1 hour for Monday)`
        : 'On Monday we insert the chip and do manual entry of 2 hours of envelopes (1 hour for Saturday and 1 hour for Monday)',
      action,
    ].join(' ')
  }

  switch (f.mondayAction) {
    case 'loading':
      return `${startBit} and go for loading${f.mondayArriveBy.trim() ? ` ${fmtTime(f.mondayArriveBy)}` : ''}`
    case 'wait_order':
      return `${startBit} wait for the order`
    case 'trailer_swap':
      return `${startBit} and go to the trailer swap${f.trailerSwapTime.trim() ? ` at ${fmtTime(f.trailerSwapTime)}` : ''}`
    case 'custom':
      return `${startBit} ${f.mondayCustom.trim() || 'and go'}`
    default:
      return `${startBit} and go to the unloading${f.mondayArriveBy.trim() ? `\nunloading ${fmtTime(f.mondayArriveBy)}` : ''}`
  }
}

function mondayLineRu(f: WeeklyInstructionForm): string {
  const start = fmtTime(f.mondayStart)
  const startBit = start ? `В понедельник старт ${start}` : 'В понедельник'

  if (f.pauseKind === 'long' && f.envelopes) {
    const action =
      f.mondayAction === 'loading'
        ? 'и едем на загрузку'
        : f.mondayAction === 'wait_order'
          ? 'и ждём заказ'
          : f.mondayAction === 'trailer_swap'
            ? `и едем на замену прицепа${f.trailerSwapTime.trim() ? ` в ${fmtTime(f.trailerSwapTime)}` : ''}`
            : f.mondayAction === 'custom' && f.mondayCustom.trim()
              ? `и едем ${f.mondayCustom.trim()}`
              : `и едем на выгрузку${f.mondayArriveBy.trim() ? ` к ${fmtTime(f.mondayArriveBy)}` : ''}`

    return [
      start
        ? `В понедельник в ${start} вставляем чип и делаем ручным вводом 2 часа конвертов (1 час за субботу и 1 час за понедельник)`
        : 'В понедельник вставляем чип и делаем ручным вводом 2 часа конвертов (1 час за субботу и 1 час за понедельник)',
      action,
    ].join(' ')
  }

  switch (f.mondayAction) {
    case 'loading':
      return `${startBit} едем на загрузку${f.mondayArriveBy.trim() ? ` ${fmtTime(f.mondayArriveBy)}` : ''}`
    case 'wait_order':
      return `${startBit} ждём заказ`
    case 'trailer_swap':
      return `${startBit} едем на замену прицепа${f.trailerSwapTime.trim() ? ` в ${fmtTime(f.trailerSwapTime)}` : ''}`
    case 'custom':
      return `${startBit} ${f.mondayCustom.trim() || 'едем'}`
    default:
      return `${startBit} едем на выгрузку${f.mondayArriveBy.trim() ? `\nвыгрузка ${fmtTime(f.mondayArriveBy)}` : ''}`
  }
}

function driverChangeEn(): string {
  return 'Driver change will be on this parking. Need to make DRIVER REPORT. Also hand over all used documents.'
}

function driverChangeRu(): string {
  return 'Замена водителя будет на этом паркинге. Нужно сделать DRIVER REPORT. Также необходимо сдать все отработанные документы.'
}

export function buildWeeklyMessage(f: WeeklyInstructionForm): string {
  if (f.lang === 'ru') return buildRu(f)
  return buildEn(f)
}

function buildEn(f: WeeklyInstructionForm): string {
  const intro =
    f.pauseKind === 'short'
      ? 'This week You have a short pause 24-44h maximum with chip in truck.'
      : 'This weekend we have a long pause of at least 47 hours without chip in truck.'

  const todayParts = [todayLineEn(f), pauseLineEn(f)].filter(Boolean)
  const today = todayParts.join(' ') + '.'

  const tomorrow = [tomorrowGoalEn(f) + '.', trafficBanEn(f)]
    .filter(Boolean)
    .join(' ')

  const monday = mondayLineEn(f)

  return joinParagraphs([
    `${intro} ${today}`,
    tomorrow,
    f.driverChange ? driverChangeEn() : null,
    monday,
    f.extraNotes.trim() || null,
    f.everythingClear ? 'Everything clear?' : null,
  ])
}

function buildRu(f: WeeklyInstructionForm): string {
  const intro =
    f.pauseKind === 'short'
      ? 'На этой неделе короткая пауза от 24ч до 44ч максимум с чипом.'
      : 'На этих выходных у нас длинная пауза минимум 47 часов без чипа.'

  const todayParts = [todayLineRu(f), pauseLineRu(f)].filter(Boolean)
  const today = todayParts.join(' ') + '.'

  const tomorrow = [tomorrowGoalRu(f) + '.', trafficBanRu(f)]
    .filter(Boolean)
    .join(' ')

  const monday = mondayLineRu(f)

  return joinParagraphs([
    `${intro} ${today}`,
    tomorrow,
    f.driverChange ? driverChangeRu() : null,
    monday,
    f.extraNotes.trim() || null,
    f.everythingClear ? 'Всё понятно?' : null,
  ])
}
