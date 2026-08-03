import {
  Baby,
  Briefcase,
  Car,
  Coffee,
  CreditCard,
  Dumbbell,
  Film,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  type LucideIcon,
  MoreHorizontal,
  PawPrint,
  PiggyBank,
  Plane,
  Receipt,
  ShoppingBag,
  Smartphone,
  Utensils,
  Wallet,
  Wifi,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const RULES: Array<{ test: RegExp; Icon: LucideIcon }> = [
  { test: /transporte|uber|mobilidade|combust|gasolina|carro/i, Icon: Car },
  { test: /moradia|aluguel|casa|condom/i, Icon: Home },
  { test: /mercado|feira|aliment|comida|restaur|almo[cç]o|jantar/i, Icon: Utensils },
  { test: /caf[eé]|padaria/i, Icon: Coffee },
  { test: /sa[uú]de|farm[aá]cia|m[eé]dic|hospital/i, Icon: HeartPulse },
  { test: /educa|curso|faculdade|escola/i, Icon: GraduationCap },
  { test: /lazer|cinema|streaming|entreten/i, Icon: Film },
  { test: /jogo|game/i, Icon: Gamepad2 },
  { test: /academia|fitness|esporte/i, Icon: Dumbbell },
  { test: /viagem|passagem|hotel/i, Icon: Plane },
  { test: /sal[aá]rio|renda|receita|freelance|trabalho/i, Icon: Briefcase },
  { test: /investimento|reserva|poupan/i, Icon: PiggyBank },
  { test: /banco|tarifa|juros/i, Icon: Landmark },
  { test: /cart[aã]o|fatura/i, Icon: CreditCard },
  { test: /luz|energia|agua|internet|telefone|celular/i, Icon: Zap },
  { test: /assinatura|software|netflix|spotify/i, Icon: Wifi },
  { test: /compras|shopping|roupa/i, Icon: ShoppingBag },
  { test: /presente|doac/i, Icon: Gift },
  { test: /pet|animal/i, Icon: PawPrint },
  { test: /filho|beb[eê]|crian/i, Icon: Baby },
  { test: /fix|gadget/i, Icon: Smartphone },
  { test: /fixo|fix|conta/i, Icon: Receipt },
  { test: /carteira|dinheiro/i, Icon: Wallet },
]

const EMOJI_OPTIONS = ['🏠', '🚗', '🍔', '💊', '🎮', '✈️', '💼', '🛒', '💡', '📱', '🎓', '🐕', '🎬', '💪', '📦']

export function categoryEmojiOptions() {
  return EMOJI_OPTIONS
}

export function CategoryIcon({
  name,
  icon,
  color,
  className,
}: {
  name: string
  icon?: string | null
  color?: string | null
  className?: string
}) {
  if (icon && !/^[a-z_]+$/i.test(icon)) {
    return (
      <span className={cn('inline-flex h-5 w-5 items-center justify-center text-sm leading-none', className)} title={name}>
        {icon}
      </span>
    )
  }

  const match = RULES.find((r) => r.test.test(name ?? ''))
  const Icon = match?.Icon ?? MoreHorizontal
  return (
    <span
      className={cn(
        'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground',
        className,
      )}
      style={color ? { color, backgroundColor: `${color}22` } : undefined}
      title={name}
    >
      <Icon className="h-3.5 w-3.5" />
    </span>
  )
}
