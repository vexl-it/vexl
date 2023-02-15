import {sha1, sha256} from './sha'

it('sha256 hashes as expected', () => {
  expect(sha256('something')).toEqual(
    'P8m2iUWdc4+MiKOkiqnjNUIBa3pAUuABqqU2/KdIE8s='
  )
})

it('sha1 hashes as expected', () => {
  expect(sha1('something')).toEqual('GvF+c3IdvgxAARuC7Uuxp9vjzik=')
})
