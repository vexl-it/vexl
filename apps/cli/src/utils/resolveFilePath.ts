import {resolve} from 'node:path'

// For development purposes, it is nice to be able to set cwd - when running yarn dev process.cwd() resolves to the root of the project.
const CURRENT_DIR = process.env.CWD || process.cwd()

export default function resolveFilePath(path?: string): string {
  return resolve(CURRENT_DIR, path)
}
