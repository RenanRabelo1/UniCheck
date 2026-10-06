import { TIME_ZONE, todayIso } from '../../utils/dates.js'

const dayFormatter = new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE, day: '2-digit', month: '2-digit' })
const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** "hoje, 14:15" ou "23/10, 09:30", sempre no fuso de Fortaleza. */
export function formatWhen(iso: string, now: Date = new Date()): string {
  const date = new Date(iso)
  const day = todayIso(date) === todayIso(now) ? 'hoje' : dayFormatter.format(date)
  return `${day}, ${timeFormatter.format(date)}`
}
