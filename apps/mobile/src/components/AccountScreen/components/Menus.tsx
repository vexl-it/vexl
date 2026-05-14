import {Menu, MenuItem, Typography, YStack} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import React from 'react'
import {useContent} from '../useContent'
import NitroPhoneBanner from './NitroPhoneBanner'

export function Menus(): React.ReactElement {
  const content = useContent()

  return (
    <YStack gap="$7">
      {pipe(
        content,
        Array.map((section, sectionIndex) => {
          if (section.type === 'nitroKeyBanner') {
            return <NitroPhoneBanner key={sectionIndex} />
          }

          return (
            <YStack key={sectionIndex} gap="$3">
              {section.label ? (
                <Typography
                  variant="paragraphDemibold"
                  color="$foregroundPrimary"
                >
                  {section.label}
                </Typography>
              ) : null}
              <Menu>
                {pipe(
                  section.items,
                  Array.map((item, itemIndex) => (
                    <MenuItem
                      variant={item.variant}
                      key={`${sectionIndex}-${itemIndex}`}
                      label={item.label}
                      note={item.note}
                      icon={item.icon}
                      onPress={item.onPress}
                    />
                  ))
                )}
              </Menu>
            </YStack>
          )
        })
      )}
    </YStack>
  )
}
