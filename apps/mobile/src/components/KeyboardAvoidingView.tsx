import {type ReactNode} from 'react'
import {
  Platform,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  View,
} from 'react-native'

function KeyboardAvoidingView({children}: {children: ReactNode}): JSX.Element {
  return (
    <RNKeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{flex: 1}}
    >
      <View style={{flex: 1}}>{children}</View>
    </RNKeyboardAvoidingView>
  )
}

export default KeyboardAvoidingView
