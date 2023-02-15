import pbkdf2 from './pbkdf2Promise'

it('Pbkdf2 hashes string as expected', async () => {
  const result = await pbkdf2('some pass', 'some salt', 1000, 64, 'sha512')
  expect(result.toString('base64')).toEqual(
    'EFSKAZFoVERhMNSCdyOcK6hoMOLvqeqo2yck6hAL44KFwrwy9buUpD3yEAmB7A8q9uouNnMyfS/rIDPsGCJsMA=='
  )
})
