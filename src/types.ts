export type TruckId = string

export interface DriverCard {
  driverName: string
  birthDate: string
  employeeId: string
  truckCompany: string
  trailer: string
  mechanic: string
  missing: string
  cmrDate: string
}

export interface TruckRowState {
  loaded: boolean
  updateClient: boolean
  unloaded: boolean
  informClient: boolean
  closeTrip: boolean
  safeParking: boolean
  moRefusal: boolean
  fixHour: number | ''
  newOrder: boolean
  newOrderLoaded: boolean
  newOrderEta: string
  updatedAt: number | null
}

export type RestHours = 9 | 11
export type OpType = 'unloading' | 'loading'
export type WeekendRest = 24 | 47 | null

export interface InstructionTruckState {
  sent: boolean
  weekendRest: WeekendRest
}

export type TabId =
  | 'trucks'
  | 'instructions'
  | 'eta'
  | 'orders'
  | 'distance'
  | 'refs'
