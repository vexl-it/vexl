export {}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      USER_API_BASE_URL: string
      CONTACT_API_BASE_URL: string
      OFFER_API_BASE_URL: string
      CHAT_API_BASE_URL: string

      CWD?: string
    }
  }
}
