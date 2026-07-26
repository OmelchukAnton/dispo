import type { DriverCard, TruckId } from '../types'

export const TRUCK_IDS: TruckId[] = [
  'AIF363',
  'AIF220',
  'AIF242',
  'AIN471',
  'AIN475',
  'AYA796',
  'AYA824',
  'MNB814',
  'MNB854',
  'MOF455',
  'NEV532',
  'NRP081',
  'NSN238',
  'NSN312',
  'NUI290',
]

function emptyCard(truck: TruckId): DriverCard {
  return {
    driverName: '—',
    birthDate: '—',
    employeeId: '—',
    truckCompany: truck,
    trailer: '—',
    mechanic: '—',
    missing: '—',
    cmrDate: '—',
  }
}

export const DRIVER_CARDS: Record<TruckId, DriverCard> = {
  AIF363: emptyCard('AIF363'),
  AIF220: emptyCard('AIF220'),
  AIF242: emptyCard('AIF242'),
  AIN471: emptyCard('AIN471'),
  AIN475: emptyCard('AIN475'),
  AYA796: emptyCard('AYA796'),
  AYA824: emptyCard('AYA824'),
  MNB814: emptyCard('MNB814'),
  MNB854: emptyCard('MNB854'),
  MOF455: emptyCard('MOF455'),
  NEV532: emptyCard('NEV532'),
  NRP081: {
    driverName: 'Rajendra Bijarniya',
    birthDate: '1997.07.01',
    employeeId: '0000',
    truckCompany: 'NRP081',
    trailer: 'SN021',
    mechanic: 'marius + email',
    missing: 'no OMV no TMB',
    cmrDate: 'CMR 05.07',
  },
  NSN238: emptyCard('NSN238'),
  NSN312: emptyCard('NSN312'),
  NUI290: emptyCard('NUI290'),
}
