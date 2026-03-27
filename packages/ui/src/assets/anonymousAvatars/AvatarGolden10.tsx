/* eslint-disable @typescript-eslint/no-deprecated */
import React from 'react'
import Svg, {
  ClipPath,
  Defs,
  FeColorMatrix,
  Filter,
  G,
  LinearGradient,
  Mask,
  Path,
  Rect,
  Stop,
} from 'react-native-svg'

interface Props {
  readonly size?: number
  readonly grayscale?: boolean
}

export function AvatarGolden10({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><G clipPath="url(#clip0_115_1277)"><Rect width="150" height="150" rx="20" fill="url(#paint0_linear_115_1277)" /><G style={{mixBlendMode: 'soft-light'}}><Rect width="150" height="150" rx="20" fill="black" fillOpacity="0.4" /></G><G clipPath="url(#clip1_115_1277)"><Mask id="mask0_115_1277" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="15" y="15" width="120" height="120"><Path d="M135 15H15V135H135V15Z" fill="white" /></Mask><G mask="url(#mask0_115_1277)"><Path d="M39 123L99 63V123H39Z" fill="black" /><Path d="M39 123L99 63V123H39Z" fill="black" fillOpacity="0.2" /><Mask id="mask1_115_1277" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="27" y="51" width="96" height="48"><Path d="M123 51H27V99H123V51Z" fill="white" /></Mask><G mask="url(#mask1_115_1277)"><Path d="M123 98.9997C123 98.9997 101.51 98.9997 75 98.9997C48.4903 98.9997 27 98.9997 27 98.9997C27 72.4901 48.4903 50.9998 75 50.9998C101.51 50.9998 123 72.4901 123 98.9997Z" fill="black" /><Path d="M123 98.9997C123 98.9997 101.51 98.9997 75 98.9997C48.4903 98.9997 27 98.9997 27 98.9997C27 72.4901 48.4903 50.9998 75 50.9998C101.51 50.9998 123 72.4901 123 98.9997Z" fill="black" fillOpacity="0.2" /></G><Mask id="mask2_115_1277" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="52" y="2" width="102" height="102"><Path d="M153.904 69.9222L86.0215 2.04004L52.0804 35.9812L119.963 103.863L153.904 69.9222Z" fill="white" /></Mask><G mask="url(#mask2_115_1277)"><Path d="M119.963 103.863C119.963 103.863 104.767 88.6673 86.0217 69.9221C67.2766 51.177 52.0806 35.981 52.0806 35.981C70.8258 17.2358 101.218 17.2358 119.963 35.981C138.708 54.7262 138.708 85.1181 119.963 103.863Z" fill="black" /><Path d="M119.963 103.863C119.963 103.863 104.767 88.6673 86.0217 69.9221C67.2766 51.177 52.0806 35.981 52.0806 35.981C70.8258 17.2358 101.218 17.2358 119.963 35.981C138.708 54.7262 138.708 85.1181 119.963 103.863Z" fill="black" fillOpacity="0.2" /></G><G clipPath="url(#clip2_115_1277)"><Path d="M42 72.6702H108.776V77.4326H42V72.6702Z" fill="#DB921E" /><Path d="M69.6212 85.539C69.6212 85.539 64.967 80.878 59.2 75.1023C53.4329 69.3266 48.7788 64.6655 48.7788 64.6655C54.5459 58.8898 63.9553 58.8898 69.7223 64.6655C75.3882 70.3399 75.3882 79.7633 69.6212 85.539Z" fill="#FFD700" /><Path d="M69.6211 85.5386C63.854 91.3143 54.4446 91.3143 48.6776 85.5386C42.9105 79.7629 42.9105 70.3394 48.6776 64.5637C48.6776 64.5637 53.3317 69.2249 59.0988 75.0005C64.967 80.7762 69.6211 85.5386 69.6211 85.5386Z" fill="#DBA21E" /><Path d="M102.098 85.539C102.098 85.539 97.4443 80.878 91.6773 75.1023C85.9102 69.3266 81.2561 64.6655 81.2561 64.6655C87.0232 58.8898 96.4326 58.8898 102.2 64.6655C107.866 70.3399 107.866 79.7633 102.098 85.539Z" fill="#FFD700" /><Path d="M102.098 85.5386C96.3314 91.3143 86.9219 91.3143 81.1549 85.5386C75.3878 79.7629 75.3878 70.3394 81.1549 64.5637C81.1549 64.5637 85.809 69.2249 91.5761 75.0005C97.4443 80.7762 102.098 85.5386 102.098 85.5386Z" fill="#DBA21E" /><Path d="M73.365 69.5L98.6591 65.4259L101.694 42L104.73 65.4259L128 68.4815L104.73 71.537L101.694 97L98.6591 71.537L73.365 69.5Z" fill="white" /></G><Path d="M76.92 111C76.92 101.672 76.92 77.4001 76.92 77.4001C67.5753 77.4001 60 84.9624 60 94.2909V111H76.92Z" fill="black" /><Path d="M76.92 111C76.92 101.672 76.92 77.4001 76.92 77.4001C67.5753 77.4001 60 84.9624 60 94.2909V111H76.92Z" fill="black" fillOpacity="0.2" /></G></G></G><Defs><LinearGradient id="paint0_linear_115_1277" x1="0" y1="0" x2="150" y2="150" gradientUnits="userSpaceOnUse"><Stop stopColor="#FBB000" /><Stop offset="0.335" stopColor="#7C5600" /><Stop offset="0.73" stopColor="#FFC132" /><Stop offset="1" stopColor="#684800" /></LinearGradient><ClipPath id="clip0_115_1277"><Rect width="150" height="150" rx="20" fill="white" /></ClipPath><ClipPath id="clip1_115_1277"><Rect width="120" height="120" fill="white" transform="translate(15 15)" /></ClipPath><ClipPath id="clip2_115_1277"><Rect width="86" height="55" fill="white" transform="translate(42 42)" /></ClipPath></Defs></G></Svg>)
}
