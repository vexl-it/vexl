import {StyleSheet} from 'react-native'
import MarkdownDisplay from 'react-native-markdown-display'

interface Props {
  children: string
}

const styles = StyleSheet.create({
  strong: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'TTSatoshi600',
  },
  body: {
    color: '#ababab',
    fontSize: 16,
    fontFamily: 'TTSatoshi500',
    // textAlign: 'left',
  },
  heading2: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'TTSatoshi600',
    marginTop: 40,
  },
  heading3: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'TTSatoshi600',
  },
})

function Markdown({children}: Props): JSX.Element {
  const {strong, body, heading2, heading3} = styles
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
