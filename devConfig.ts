/**
 * Service Environment Configuration for Local Development
 *
 * This file configures environment variables for each service when running locally.
 * It provides working defaults for development and references .env.local for secrets.
 *
 * Structure:
 * - `common`: Shared by all services (infrastructure, security, development settings)
 * - `[serviceName]`: Service-specific overrides (keyed by camelCase service name)
 *
 * Secrets:
 * Sensitive values are pulled from .env.local via process.env. The orchestrator
 * loads .env.local before importing this file.
 *
 * Configuration Override:
 * All values can be overridden via .env.local using DEV_* prefixed environment
 * variables. See .env.example for the full list of available options.
 *
 * To get secrets:
 * - Crypto keys: Generate locally or copy from staging/production securely
 * - PRELUDE_API_TOKEN: From Prelude dashboard (SMS verification)
 * - FIREBASE_CREDENTIALS: From Firebase console (service account JSON)
 * - EXPO_ACCESS_TOKEN: From Expo dashboard (push notifications)
 * - GOOGLE_PLACES_API_KEY: From Google Cloud console
 * - AWS credentials: From AWS IAM console
 *
 * Note: Changes to this file require orchestrator restart to take effect.
 */
import type { DevConfig } from "./tooling/dev-orchestrator/src/config/dev-config-schema.js";

const devConfig = {
  /**
   * Common environment variables for all services.
   * These provide infrastructure defaults and security keys.
   */
  common: {
    // Infrastructure - matches dev.docker-compose.yaml defaults
    DB_URL: process.env.DB_URL!!,
    DB_USER: process.env.DB_USER!!,
    DB_PASSWORD: process.env.DB_PASSWORD!!,
    REDIS_URL: process.env.REDIS_URL!!,

    // Security - pull from .env.local (required for most services)
    SECRET_PUBLIC_KEY: process.env.SECRET_PUBLIC_KEY ?? "",
    SECRET_PRIVATE_KEY: process.env.SECRET_PRIVATE_KEY ?? "",
    SECRET_HMAC_KEY: process.env.SECRET_HMAC_KEY ?? "",
    SECRET_EAS_KEY: process.env.SECRET_EAS_KEY ?? "",

    // Development defaults
    NODE_ENV: process.env.DEV_COMMON_NODE_ENV ?? "development",
    SERVICE_VERSION: process.env.DEV_COMMON_SERVICE_VERSION ?? "local",
    DISABLE_METRICS: process.env.DEV_COMMON_DISABLE_METRICS ?? "true",
    METRICS_QUEUE_NAME:
      process.env.DEV_COMMON_METRICS_QUEUE_NAME ?? "dev-metrics-queue",
  },

  /**
   * User Service - handles authentication and user management.
   * Requires SMS verification provider credentials for phone number verification.
   */
  userService: {
    // SMS verification provider (prelude or twilio)
    VERIFICATION_PROVIDER:
      process.env.DEV_USER_SERVICE_VERIFICATION_PROVIDER ?? "prelude",
    PRELUDE_API_TOKEN: process.env.DEV_USER_SERVICE_PRELUDE_API_TOKEN ?? "",
    // Test mode - bypass SMS verification for these numbers
    LOGIN_CODE_DUMMY_NUMBERS:
      process.env.DEV_USER_SERVICE_LOGIN_CODE_DUMMY_NUMBERS ?? "+420733333331",
    LOGIN_CODE_DUMMY_CODE:
      process.env.DEV_USER_SERVICE_LOGIN_CODE_DUMMY_CODE ?? "222222",
    LOGIN_CODE_DUMMY_FOR_ALL:
      process.env.DEV_USER_SERVICE_LOGIN_CODE_DUMMY_FOR_ALL ?? "222222",

    // Redirect to feedback service
    FEEDBACK_URL_TO_REDIRECT_TO:
      process.env.DEV_USER_SERVICE_FEEDBACK_URL_TO_REDIRECT_TO ??
      "http://localhost:3008",
  },

  /**
   * Chat Service - handles encrypted messaging between users.
   */
  chatService: {
    REQUEST_TIMEOUT_DAYS:
      process.env.DEV_CHAT_SERVICE_REQUEST_TIMEOUT_DAYS ?? "30",
    MESSAGE_EXPIRATION_LOWER_LIMIT_DAYS:
      process.env.DEV_CHAT_SERVICE_MESSAGE_EXPIRATION_LOWER_LIMIT_DAYS ?? "7",
    MESSAGE_EXPIRATION_UPPER_LIMIT_DAYS:
      process.env.DEV_CHAT_SERVICE_MESSAGE_EXPIRATION_UPPER_LIMIT_DAYS ?? "90",
  },

  /**
   * Offer Service - manages buy/sell offers.
   */
  offerService: {
    EXPIRATION_PERIOD_DAYS:
      process.env.DEV_OFFER_SERVICE_EXPIRATION_PERIOD_DAYS ?? "30",
    OFFER_REPORT_FILTER:
      process.env.DEV_OFFER_SERVICE_OFFER_REPORT_FILTER ?? "3",
    REPORT_LIMIT_INTERVAL_DAYS:
      process.env.DEV_OFFER_SERVICE_REPORT_LIMIT_INTERVAL_DAYS ?? "7",
    REPORT_LIMIT_COUNT: process.env.DEV_OFFER_SERVICE_REPORT_LIMIT_COUNT ?? "5",
  },

  /**
   * Contact Service - handles contact book sync and clubs.
   * Requires Firebase credentials for cloud messaging.
   */
  contactService: {
    // Firebase - for push notifications
    FIREBASE_CREDENTIALS:
      process.env.DEV_CONTACT_SERVICE_FIREBASE_CREDENTIALS ?? "",

    // Notification timing
    INACTIVITY_NOTIFICATION_AFTER_DAYS:
      process.env.DEV_CONTACT_SERVICE_INACTIVITY_NOTIFICATION_AFTER_DAYS ??
      "30",
    NEW_CONTENT_NOTIFICATION_AFTER_DAYS:
      process.env.DEV_CONTACT_SERVICE_NEW_CONTENT_NOTIFICATION_AFTER_DAYS ??
      "7",

    // Contact import quotas
    INITIAL_IMPORT_CONTACTS_COUNT_QUOTA:
      process.env.DEV_CONTACT_SERVICE_INITIAL_IMPORT_CONTACTS_COUNT_QUOTA ??
      "500",
    IMPORT_CONTACTS_COUNT_QUOTA:
      process.env.DEV_CONTACT_SERVICE_IMPORT_CONTACTS_COUNT_QUOTA ?? "100",
    IMPORT_CONTACTS_RESET_AFTER_DAYS_QUOTA:
      process.env.DEV_CONTACT_SERVICE_IMPORT_CONTACTS_RESET_AFTER_DAYS_QUOTA ??
      "7",

    // Admin and push
    ADMIN_TOKEN_HASH: process.env.DEV_CONTACT_SERVICE_ADMIN_TOKEN_HASH ?? "",
    EXPO_ACCESS_TOKEN: process.env.EXPO_ACCESS_TOKEN ?? "",

    // Clubs
    CLUB_LINK_TEMPLATE:
      process.env.DEV_CONTACT_SERVICE_CLUB_LINK_TEMPLATE ??
      "vexl://club/{code}",
    CLUB_REMOVE_AFTER_MARKED_AS_DELETED_DAYS:
      process.env
        .DEV_CONTACT_SERVICE_CLUB_REMOVE_AFTER_MARKED_AS_DELETED_DAYS ?? "30",
    CLUB_MEMBER_EXPIRATION_AFTER_DAYS_OF_INACTIVITY:
      process.env
        .DEV_CONTACT_SERVICE_CLUB_MEMBER_EXPIRATION_AFTER_DAYS_OF_INACTIVITY ??
      "90",
    CLUB_REPORT_LIMIT_INTERVAL_DAYS:
      process.env.DEV_CONTACT_SERVICE_CLUB_REPORT_LIMIT_INTERVAL_DAYS ?? "7",
    CLUB_REPORT_LIMIT_COUNT:
      process.env.DEV_CONTACT_SERVICE_CLUB_REPORT_LIMIT_COUNT ?? "5",

    // Server contacts hashing
    SECRET_SALT_FOR_SERVER_CONTACTS:
      process.env.SECRET_SALT_FOR_SERVER_CONTACTS ?? "",

    // AWS S3 for club images
    S3_BUCKET_NAME: process.env.DEV_CONTACT_SERVICE_S3_BUCKET_NAME ?? "",
    AWS_REGION: process.env.DEV_CONTACT_SERVICE_AWS_REGION ?? "eu-west-1",
  },

  /**
   * Notification Service - sends push notifications via FCM and Expo.
   */
  notificationService: {
    EXPO_ACCESS_TOKEN: process.env.EXPO_ACCESS_TOKEN ?? "",
    FCM_TOKEN_PUBLIC_KEY:
      process.env.DEV_NOTIFICATION_SERVICE_FCM_TOKEN_PUBLIC_KEY ?? "",
    FCM_TOKEN_PRIVATE_KEY:
      process.env.DEV_NOTIFICATION_SERVICE_FCM_TOKEN_PRIVATE_KEY ?? "",
  },

  /**
   * Location Service - provides location autocomplete via Google Places.
   */
  locationService: {
    GOOGLE_PLACES_API_KEY:
      process.env.DEV_LOCATION_SERVICE_GOOGLE_PLACES_API_KEY ?? "",
    BTC_EXCHANGE_RATE_URL_TO_REDIRECT_TO:
      process.env.DEV_LOCATION_SERVICE_BTC_EXCHANGE_RATE_URL_TO_REDIRECT_TO ??
      "http://localhost:3007",
  },

  /**
   * Content Service - serves app content from Webflow CMS.
   */
  contentService: {
    CLEAR_CACHE_TOKEN_HASH:
      process.env.DEV_CONTENT_SERVICE_CLEAR_CACHE_TOKEN_HASH ?? "",
    FORCE_UPDATE_FOR_VERSION_AND_LOWER:
      process.env.DEV_CONTENT_SERVICE_FORCE_UPDATE_FOR_VERSION_AND_LOWER ?? "0",
    APP_IN_MAINTENANCE_MODE:
      process.env.DEV_CONTENT_SERVICE_APP_IN_MAINTENANCE_MODE ?? "false",
    BTC_PAY_SERVER_URL:
      process.env.DEV_CONTENT_SERVICE_BTC_PAY_SERVER_URL ?? "",
    BTC_PAY_SERVER_API_KEY:
      process.env.DEV_CONTENT_SERVICE_BTC_PAY_SERVER_API_KEY ?? "",
    BTC_PAY_SERVER_STORE_ID:
      process.env.DEV_CONTENT_SERVICE_BTC_PAY_SERVER_STORE_ID ?? "",
    WEBFLOW_TOKEN: process.env.CONTENT_SERVICE_WEBFLOW_TOKEN ?? "",
    WEBFLOW_EVENTS_COLLECTION_ID:
      process.env.DEV_CONTENT_SERVICE_WEBFLOW_EVENTS_COLLECTION_ID ?? "",
    WEBFLOW_SPEAKERS_COLLECTION_ID:
      process.env.DEV_CONTENT_SERVICE_WEBFLOW_SPEAKERS_COLLECTION_ID ?? "",
    WEBFLOW_BLOG_COLLECTION_ID:
      process.env.DEV_CONTENT_SERVICE_WEBFLOW_BLOG_COLLECTION_ID ?? "",
    VEXL_BLOG_URL_TEMPLATE:
      process.env.DEV_CONTENT_SERVICE_VEXL_BLOG_URL_TEMPLATE ??
      "https://vexl.it/post/{slug}",
  },

  /**
   * BTC Exchange Rate Service - fetches Bitcoin exchange rates.
   * Only requires common vars.
   */
  btcExchangeRateService: {},

  /**
   * Feedback Service - collects user feedback.
   * Only requires common vars.
   */
  feedbackService: {},

  /**
   * Metrics Service - aggregates service metrics.
   * Only requires common vars.
   */
  metricsService: {},

  /**
   * Mobile App Configuration
   *
   * Controls Expo dev server startup when running `yarn dev:local`.
   * Set enabled: false to run backend services only.
   */
  mobile: {
    enabled: process.env.DEV_MOBILE_ENABLED !== "false",
    platform:
      (process.env.DEV_MOBILE_PLATFORM as
        | "ios-simulator"
        | "android-emulator"
        | "physical-device") ?? "ios-simulator", // Options: 'ios-simulator' | 'android-emulator' | 'physical-device'
    expoPort: parseInt(process.env.DEV_MOBILE_EXPO_PORT ?? "8081", 10),
  },
} satisfies DevConfig;

export default devConfig;
