'use client'

import { cn } from '@/lib/utils'
import { Command as CommandPrimitive } from 'cmdk'
import * as React from 'react'

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn('bg-border -mx-1 h-px', className)}
      {...props}
    />
  )
}

export { CommandSeparator }
