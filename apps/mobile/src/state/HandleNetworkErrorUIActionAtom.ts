import {atom} from 'jotai'
import {type NetworkError} from '@vexl-next/rest-api/src/Errors'

const HandleNetworkErrorUIActionAtom = atom(
  null,
  (get, set, error: NetworkError) => {}
)
export default HandleNetworkErrorUIActionAtom
