/**
 * Configuration module - handles environment loading and validation
 *
 * Responsibilities:
 * - Load .env.local from project root
 * - Validate all required environment variables
 * - Provide typed configuration to other modules
 * - Define service configurations with dependency tiers
 */

export * from './env-loader.js'
export * from './env-schema.js'
export * from './port-checker.js'
export * from './services.js'
