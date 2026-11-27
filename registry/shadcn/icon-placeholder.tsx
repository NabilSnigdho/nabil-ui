// Dev/preview stand-in for shadcn's IconPlaceholder. Never shipped: on install the
// CLI replaces every <IconPlaceholder> with the consumer's iconLibrary and drops
// imports whose path contains "icon-placeholder".
// ponytail: renders lucide only; add other libraries if the playground needs a switcher.
import { icons, type LucideProps } from "lucide-react"

type IconPlaceholderProps = LucideProps & {
  lucide: string
  tabler: string
  hugeicons: string
  phosphor: string
  remixicon: string
}

export function IconPlaceholder({
  lucide,
  tabler: _tabler,
  hugeicons: _hugeicons,
  phosphor: _phosphor,
  remixicon: _remixicon,
  ...props
}: IconPlaceholderProps) {
  const Icon = icons[lucide.replace(/Icon$/, "") as keyof typeof icons]
  return Icon ? <Icon {...props} /> : null
}
