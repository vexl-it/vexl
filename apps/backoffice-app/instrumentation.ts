export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const {registerNode} = await import('./instrumentation.node')
  await registerNode()
}
