import {UserName} from '@vexl-next/domain/src/general/UserName.brand'
import seed from 'seed-random'

const sils = [
  'bo',
  'da',
  'ga',
  'ge',
  'chi',
  'ka',
  'ko',
  'ku',
  'ma',
  'mi',
  'mo',
  'na',
  'no',
  'ro',
  'ri',
  'ru',
  'sa',
  'se',
  'su',
  'shi',
  'she',
  'sha',
  'sho',
  'ta',
  'te',
  'to',
  'yu',
  'za',
  'zo',
]

export default function randomName(seedString?: string): UserName {
  const getRandom = seedString ? seed(seedString) : Math.random

  const lowercase = ['', '', '', '']
    .map(() => sils[Math.floor(getRandom() * (sils.length - 1))])
    .join('')
  return UserName.parse(lowercase.charAt(0).toUpperCase() + lowercase.slice(1))
}
