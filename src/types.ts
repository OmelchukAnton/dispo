export type TruckId = string

/** Company tags shown in Trucks column */
export type TruckCompanyTag = 'prt' | 'h1' | 'ha'

export interface DriverCard {
  driverName: string
  birthDate: string
  employeeId: string
  truckCompany: string
  trailer: string
  mechanic: string
  missing: string
  cmrDate: string
  /** Free-form notes — highlight info icon when filled */
  notes: string
  /** Company tag: PRT (Periti), H1, HA */
  companyTag: TruckCompanyTag | null
}

export interface TruckRowState {
  loaded: boolean
  updateClient: boolean
  unloadBy11: boolean
  unloaded: boolean
  informClient: boolean
  /** Short CMR date on checklist, e.g. 20.09 */
  cmr: string
  todayUnloadingEta: string
  /** Marked as having work / relevant today */
  today: boolean
  safeParking: boolean
  /** Order number for Safe parking request */
  safeParkingOrder: string
  moRefusal: boolean
  fixHour: number | ''
  newOrder: boolean
  newOrderLoaded: boolean
  newOrderEta: string
  /** Remaining km for Arrive ETA */
  kmLeft: number | ''
  /** Drive hours left today for this truck */
  driveLeftHours: number | ''
  /** Last calculated Arrive ETA label (empty until Calc) */
  arriveEta: string
  updatedAt: number | null
}

export type RestHours = 9 | 11
export type OpType = 'unloading' | 'loading'
export type WeekendRest = 24 | 47 | null

export interface InstructionTruckState {
  sent: boolean
}

export interface WeeklyTruckState {
  sent: boolean
  weekendRest: WeekendRest
}

export type TabId =
  | 'trucks'
  | 'instructions'
  | 'weekly'
  | 'eta'
  | 'orders'
  | 'distance'
  | 'refs'
  | 'bans'

export type WeeklyLang = 'en' | 'ru'
export type WeeklyPauseKind = 'short' | 'long'
export type WeeklyTodayKind =
  | 'parking_from_task'
  | 'after_loading'
  | 'drive_full_time'
  | 'after_ferry'
  | 'near_company'
export type WeeklyTonightPause = '9' | '11' | 'pull_chip' | 'none'
export type WeeklyTomorrowGoal =
  | 'next_parking'
  | 'close_to_delivery'
  | 'custom'
export type WeeklyMondayAction =
  | 'unloading'
  | 'loading'
  | 'trailer_swap'
  | 'wait_order'
  | 'custom'

export interface WeeklyInstructionForm {
  lang: WeeklyLang
  pauseKind: WeeklyPauseKind
  todayKind: WeeklyTodayKind
  tonightPause: WeeklyTonightPause
  tomorrowStart: string
  tomorrowGoal: WeeklyTomorrowGoal
  tomorrowCustom: string
  trafficBan: boolean
  trafficBanCountry: string
  trafficBanFrom: string
  trafficBanUntil: string
  mondayStart: string
  mondayAction: WeeklyMondayAction
  mondayCustom: string
  mondayArriveBy: string
  trailerSwapTime: string
  envelopes: boolean
  driverChange: boolean
  everythingClear: boolean
  extraNotes: string
}
