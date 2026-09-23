export const jsonHeaders = (adminToken: string): HeadersInit => ({
  'Content-Type': 'application/json',
  'x-admin-token': adminToken,
})

const readError = async (response: Response): Promise<string> => {
  try {
    const body = await response.json()
    if (typeof body.error === 'string') return body.error
    return response.statusText
  } catch {
    return response.statusText
  }
}

export const requestJson = async <A>(
  input: RequestInfo | URL,
  init: RequestInit
): Promise<A> => {
  const response = await fetch(input, init)

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  return await response.json()
}

export const requestNoContent = async (
  input: RequestInfo | URL,
  init: RequestInit
): Promise<void> => {
  const response = await fetch(input, init)

  if (!response.ok) {
    throw new Error(await readError(response))
  }
}
