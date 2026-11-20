const authSwitches = async (
  nodeEnv: 'development' | 'production',
  disableAuth: string
) => {
  jest.replaceProperty(process, 'env', {
    ...process.env,
    NODE_ENV: nodeEnv,
    BACKOFFICE_DISABLE_AUTH: disableAuth,
  })
  // The config module reads NODE_ENV once, when it is first loaded.
  jest.resetModules()
  const config = await import('../server/config')
  return {
    authDisabled: config.isAuthDisabled(),
    refusesToStart: config.isAuthDisabledInProduction(),
  }
}

afterEach(() => {
  jest.restoreAllMocks()
})

describe('BACKOFFICE_DISABLE_AUTH', () => {
  it('turns auth off in development', async () => {
    expect(await authSwitches('development', 'true')).toEqual({
      authDisabled: true,
      refusesToStart: false,
    })
  })

  it('never turns auth off in production and stops the server there', async () => {
    expect(await authSwitches('production', 'true')).toEqual({
      authDisabled: false,
      refusesToStart: true,
    })
  })

  it.each<'development' | 'production'>(['development', 'production'])(
    'changes nothing in %s when it is not set to true',
    async (nodeEnv) => {
      expect(await authSwitches(nodeEnv, 'false')).toEqual({
        authDisabled: false,
        refusesToStart: false,
      })
    }
  )
})
