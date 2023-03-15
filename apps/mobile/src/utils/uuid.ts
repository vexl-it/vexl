import rnUuid from 'react-native-uuid'
import {type Uuid} from '@vexl-next/domain/dist/utility/Uuid.brand'

export default function uuid(): Uuid {
  return rnUuid.v4() as Uuid
}
