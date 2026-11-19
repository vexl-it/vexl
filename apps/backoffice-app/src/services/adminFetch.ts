const readError = async (response: Response): Promise<string> => {
  try {
    const body = await response.json()
    if (typeof body.error === 'string') return body.error
    return response.statusText
  } catch {
    return response.statusText
  }
}

/** Same-origin request that carries the session cookie; throws on failure. */
const request = async (
  input: RequestInfo | URL,
  init: RequestInit
): Promise<Response> => {
  const response = await fetch(input, {
    ...init,
    headers: {'Content-Type': 'application/json'},
  })

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  return response
}

export const requestJson = async <A>(
  input: RequestInfo | URL,
  init: RequestInit
): Promise<A> => await (await request(input, init)).json()

export const requestNoContent = async (
  input: RequestInfo | URL,
  init: RequestInit
): Promise<void> => {
  await request(input, init)
}
