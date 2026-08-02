import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type TruncatedTextProps = {
  text: string
  className?: string
  contentClassName?: string
}

/** Single-line truncate with custom tooltip for the full text. */
export function TruncatedText({ text, className, contentClassName }: TruncatedTextProps) {
  if (!text || text === '—') {
    return <span className={cn('block truncate', className)}>{text || '—'}</span>
  }

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <span className={cn('block truncate', className)}>{text}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className={cn('max-w-sm break-words', contentClassName)}>
        {text}
      </TooltipContent>
    </Tooltip>
  )
}
