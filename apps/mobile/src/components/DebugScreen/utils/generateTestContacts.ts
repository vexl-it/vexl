export const NUMBER_OF_TEST_CONTACTS = 5300

// Simple random name generator
const firstNames = [
  'Jan',
  'Petr',
  'Martin',
  'Josef',
  'Pavel',
  'Jaroslav',
  'Tomáš',
  'Miroslav',
  'Eva',
  'Anna',
  'Marie',
  'Lucie',
  'Jana',
  'Petra',
  'Kateřina',
  'Hana',
  'Veronika',
  'Lenka',
  'Adéla',
  'Tereza',
]
const lastNames = [
  'Novák',
  'Svoboda',
  'Novotný',
  'Dvořák',
  'Černý',
  'Procházka',
  'Kučera',
  'Veselý',
  'Horák',
  'Němec',
  'Marek',
  'Pokorný',
  'Pospíšil',
  'Hájek',
  'Král',
  'Jelínek',
  'Růžička',
  'Beneš',
  'Fiala',
  'Sedláček',
]

function randomName(): string {
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`
}

function fakeHash(str: string): string {
  // Simple hash for example only, not cryptographic!
  let hash = 0
  let i
  let chr
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0
  }
  return Buffer.from(hash.toString()).toString('base64').padEnd(44, '=')
}

export function generateTestContacts(): string {
  let contacts: string = ''
  for (let i = 1; i <= NUMBER_OF_TEST_CONTACTS; i++) {
    const prefix = i % 2 === 0 ? '+420723' : '+420720'
    const numberSuffix = (
      '' + Math.floor(100000 + Math.random() * 900000)
    ).padStart(6, '0')
    const normalizedNumber = `${prefix}${numberSuffix}`
    const numberToDisplay = `${prefix.slice(0, 4)} ${prefix.slice(4)} ${numberSuffix.slice(0, 3)} ${numberSuffix.slice(3)}`

    contacts = contacts.concat(`{
      "info": {
        "nonUniqueContactId": "${i.toString()}",
        "name": "${randomName()}",
        "label": "mobile",
        "numberToDisplay": "${numberToDisplay}",
        "rawNumber": "${numberToDisplay}"
      },
      "flags": {
        "seen": false,
        "imported": true,
        "importedManually": false,
        "invalidNumber": "valid"
      },
      "computedValues": {
        "normalizedNumber": "${normalizedNumber}",
        "hash": "${fakeHash(normalizedNumber)}"
      }
    },`)
  }

  const toReturn = `[${contacts.slice(0, -1)}]`

  return toReturn
}
