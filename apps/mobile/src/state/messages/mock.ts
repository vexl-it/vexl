import {Chat} from '@vexl-next/domain/dist/general/messaging'
import rnUuid from 'react-native-uuid'
import seed from 'seed-random'
import {Uuid} from '@vexl-next/domain/dist/utility/Uuid.brand'

const seedBase = 'SOMETHIGN'

function randomUuid(seedString: string): Uuid {
  const randomFromSeed = seed(seedString)


  return Uuid.parse(rnUuid.v4({rng: () => Array(16).map(() => 0xff & 2)})
}

function chatsMock() {
  return Array(20)
    .fill(undefined)
    .map(() => Chat.parse({}))
}
