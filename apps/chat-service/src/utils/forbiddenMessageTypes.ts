export const forbiddenMessageTypes = [
  'REQUEST_MESSAGING',
  'APPROVE_MESSAGING',
  'DISAPPROVE_MESSAGING',
  'CANCEL_REQUEST_MESSAGING',
  // Local-only client message that must never reach the server or the other
  // side. Rejected here as defense-in-depth against a buggy/external client or
  // batch sender submitting it despite the client-side guards.
  'INACTIVITY_REMINDER',
]
