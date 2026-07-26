export type TruckId =
  | 'AIF363'
  | 'AIF220'
  | 'AIF242'
  | 'AIN471'
  | 'AIN475'
  | 'AYA796'
  | 'AYA824'
  | 'MNB814'
  | 'MNB854'
  | 'MOF455'
  | 'NEV532'
  | 'NRP081'
  | 'NSN238'
  | 'NSN312'
  | 'NUI290'

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

export type TabId = 'trucks' | 'instructions' | 'eta' | 'orders' | 'refs'
