import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghostLight' | 'ctaLight'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'rounded-2xl px-[34px] py-[17px] text-[19px] text-white bg-purple shadow-[0_5px_0_#3A0E86] hover:translate-y-0.5 hover:shadow-[0_3px_0_#3A0E86]',
  secondary:
    'rounded-2xl px-[34px] py-[17px] text-[19px] text-ink bg-yellow shadow-[0_5px_0_#B98400] hover:translate-y-0.5 hover:shadow-[0_3px_0_#B98400]',
  outline:
    'rounded-[14px] px-[22px] py-[9px] text-base text-purple bg-white border-[2.5px] border-purple hover:bg-[#F3EBFF]',
  ghostLight: 'rounded-[14px] px-[28px] py-[14px] text-[17px] text-ink bg-yellow hover:translate-y-0.5',
  ctaLight:
    'rounded-2xl px-[36px] py-[17px] text-[19px] text-purple bg-white shadow-[0_5px_0_#C9BEE8] hover:translate-y-0.5 hover:shadow-[0_3px_0_#C9BEE8]',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`font-display font-semibold cursor-pointer transition-[transform,box-shadow,background-color] duration-150 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
