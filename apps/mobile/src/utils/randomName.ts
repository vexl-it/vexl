import randomNumber from './randomNumber'
import {UserName} from '@vexl-next/domain/dist/general/UserName.brand'

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

export default function randomName(): UserName {
  const lowercase = ['', '', '']
    .map(() => sils[randomNumber(0, sils.length - 1)])
    .join('')
  return UserName.parse(lowercase.charAt(0).toUpperCase() + lowercase.slice(1))
}
