import {type SpokenLanguage} from '@vexl-next/domain/src/general/offers'

const spokenLanguageToFlagEmojiMap: Record<SpokenLanguage, string> = {
  ENG: '\u{1F1EC}\u{1F1E7}',
  DEU: '\u{1F1E9}\u{1F1EA}',
  CZE: '\u{1F1E8}\u{1F1FF}',
  SVK: '\u{1F1F8}\u{1F1F0}',
  PRT: '\u{1F1F5}\u{1F1F9}',
  FRA: '\u{1F1EB}\u{1F1F7}',
  ITA: '\u{1F1EE}\u{1F1F9}',
  ESP: '\u{1F1EA}\u{1F1F8}',
  BG: '\u{1F1E7}\u{1F1EC}',
  FAS: '\u{1F1EE}\u{1F1F7}',
}

export default function spokenLanguageToFlagEmoji(
  language: SpokenLanguage
): string {
  return spokenLanguageToFlagEmojiMap[language]
}
