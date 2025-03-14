'use client'

import { Button } from '@heroui/button'
import { useTheme } from 'next-themes'
import { Icon } from '@iconify/react'
import { useIsMounted } from '@/shared/hooks'

export const ThemeButton = () => {
  const { theme, setTheme } = useTheme()
  const isMounted = useIsMounted()
  if (!isMounted) return null
  return (
    <Button
      isIconOnly
      onPress={() => (theme === 'dark' ? setTheme('light') : setTheme('dark'))}
      className="absolute top-4 right-4"
      variant="light"
      color={theme === 'dark' ? 'danger' : 'default'}
    >
      {theme === 'dark' ? (
        <Icon icon="solar:sun-broken" width="48" height="48" className="text-[#C4441D]" />
      ) : (
        <Icon icon="solar:moon-broken" width="48" height="48" className="text-[#44403b]" />
      )}
    </Button>
  )
}
