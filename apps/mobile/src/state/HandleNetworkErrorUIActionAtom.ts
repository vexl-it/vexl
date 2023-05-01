import {atom} from 'jotai'
import {type NetworkError} from '@vexl-next/rest-api/dist/Errors'

const HandleNetworkErrorUIActionAtom = atom(
  null,
  (get, set, error: NetworkError) => {}
)
export default HandleNetworkErrorUIActionAtom
