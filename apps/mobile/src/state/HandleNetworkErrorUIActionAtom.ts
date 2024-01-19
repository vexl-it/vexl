import {type NetworkError} from '@vexl-next/rest-api/src/Errors'
import {atom} from 'jotai'

const HandleNetworkErrorUIActionAtom = atom(
  null,
  (get, set, error: NetworkError) => {}
)
export default HandleNetworkErrorUIActionAtom
