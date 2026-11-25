import {type CopyKey} from '../copy/copyFiles'

export interface StoreApp {
  readonly number: string
  readonly href: string
  readonly icon: string
  readonly eagerIcon: boolean
  readonly nameKey: CopyKey<'shared'>
  readonly tagKeys: ReadonlyArray<CopyKey<'shared'>>
}

export const STORE_APPS: readonly StoreApp[] = [
  {
    number: '001',
    href: 'https://www.minibits.cash/',
    icon: '/wf/6846e8829dfc413c00750e85_minibits.svg',
    eagerIcon: true,
    nameKey: 'apps.minibits.name',
    tagKeys: ['apps.minibits.tag1', 'apps.minibits.tag2'],
  },
  {
    number: '002',
    href: 'https://vexl.it/',
    icon: '/wf/68500afe05096d833b53a258_vexl.svg',
    eagerIcon: true,
    nameKey: 'apps.vexl.name',
    tagKeys: ['apps.vexl.tag1', 'apps.vexl.tag2'],
  },
  {
    number: '003',
    href: 'https://bitkit.to/',
    icon: '/wf/684fcc352a3f1a9aca860d63_Rectangle_4.svg',
    eagerIcon: true,
    nameKey: 'apps.bitkit.name',
    tagKeys: ['apps.bitkit.tag1', 'apps.bitkit.tag2'],
  },
  {
    number: '004',
    href: 'https://sovran.money',
    icon: '/wf/68500b22ae5bab4791a74cac_sovran.svg',
    eagerIcon: true,
    nameKey: 'apps.sovran.name',
    tagKeys: ['apps.sovran.tag1', 'apps.sovran.tag2'],
  },
  {
    number: '005',
    href: 'https://getflash.io/',
    icon: '/wf/684fc981c6e7edd505c605e0_flash.svg',
    eagerIcon: false,
    nameKey: 'apps.flash.name',
    tagKeys: ['apps.flash.tag1', 'apps.flash.tag2', 'apps.flash.tag3'],
  },
  {
    number: '006',
    href: 'https://github.com/SatoshiPortal',
    icon: '/wf/68500b650c6d5add1c9561f7_bullbitcoin.svg',
    eagerIcon: false,
    nameKey: 'apps.bullBitcoin.name',
    tagKeys: ['apps.bullBitcoin.tag1', 'apps.bullBitcoin.tag2'],
  },
]
