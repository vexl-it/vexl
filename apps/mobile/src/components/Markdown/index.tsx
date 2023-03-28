import MarkdownDisplay from 'react-native-markdown-display'
import {css} from '@emotion/native'
import {useTheme} from '@emotion/react'

interface Props {
  children: string
}

function Markdown({children}: Props): JSX.Element {
  const theme = useTheme()
  return (
    <MarkdownDisplay
      style={{
        strong: css`
          font-size: 16px;
          color: ${theme.colors.white};
          font-family: '${theme.fonts.ttSatoshi600}';
        `,
        body: css`
          color: #ababab;
          font-size: 16px;
          font-family: '${theme.fonts.ttSatoshi500}';
          text-align: left;
        `,
        heading2: css`
          color: #ffffff;
          font-size: 18px;
          font-family: '${theme.fonts.ttSatoshi600}';
          margin-top: 40px;
        `,
        heading3: css`
          color: #ffffff;
          font-size: 16px;
          font-family: '${theme.fonts.ttSatoshi600}';
        `,
      }}
    >
      {children}
    </MarkdownDisplay>
  )
}

export default Markdown
