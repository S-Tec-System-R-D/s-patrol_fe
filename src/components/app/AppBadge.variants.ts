import { cva } from 'class-variance-authority'

export const badgeVariants = cva(
  'inline-flex w-fit items-center rounded-sm px-2 py-1 text-xs font-semibold whitespace-nowrap',
  {
    variants: {
      variant: {
        success: 'bg-success-bg text-success-foreground',
        point: 'bg-point-bg text-point-foreground',
        warning: 'bg-warning-bg text-warning-foreground',
        danger: 'bg-danger-bg text-danger-foreground',
        muted: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'muted',
    },
  }
)
