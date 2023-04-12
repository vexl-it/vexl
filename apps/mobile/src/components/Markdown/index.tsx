import MarkdownDisplay from 'react-native-markdown-display'
import {useMemo} from 'react'

interface Props {
  children: string
}

function Markdown({children}: Props): JSX.Element {
  const strong = useMemo(
    () => ({
      fontSize: 16,
      color: '#fff',
      fontFamily: 'TTSatoshi600',
    }),
    []
  )

  const body = useMemo(
    () => ({
      color: '#ababab',
      fontSize: 16,
      fontFamily: 'TTSatoshi500',
      // textAlign: 'left',
    }),
    []
  )

  const heading2 = useMemo(
    () => ({
      color: '#ffffff',
      fontSize: 18,
      fontFamily: 'TTSatoshi600',
      marginTop: 40,
    }),
    []
  )

  const heading3 = useMemo(
    () => ({
      color: '#ffffff',
      fontSize: 16,
      fontFamily: 'TTSatoshi600',
    }),
    []
  )
  return (
    <MarkdownDisplay
      style={{
        strong,
        body,
        heading2,
        heading3,
      }}
    >
      {children}
    </MarkdownDisplay>
  )
}

export default Markdown
