export default function safeToJson(object: unknown): string {
  try {
    return JSON.stringify(object)
  } catch (e) {
    return '[[Error stringify-ing object]]'
  }
}
