'use client'

import { cn } from '@/lib/utils'
import { Command as CommandPrimitive } from 'cmdk'
import * as React from 'react'

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        'bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md',
        className,
      )}
      {...props}
    />
  )
}

export { Command }
