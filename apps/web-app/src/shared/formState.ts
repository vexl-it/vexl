export interface ErrorFormState {
  error: string | null
}

export const emptyErrorFormState: ErrorFormState = {
  error: null,
}

export interface PrintSessionPayload {
  hash: string
  publicKey: string
  signature: string
}

export interface PrintSessionFormState {
  error: string | null
  session: PrintSessionPayload | null
}

export const emptyPrintSessionFormState: PrintSessionFormState = {
  error: null,
  session: null,
}
