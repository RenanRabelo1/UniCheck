export const TIME_ZONE = 'America/Fortaleza'

const isoDayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE })

/** Data de "hoje" em Fortaleza, no formato AAAA-MM-DD. */
export function todayIso(now: Date = new Date()): string {
  return isoDayFormatter.format(now)
}

/** Confere se o texto é uma data de calendário real (rejeita 2026-02-31). */
export function isRealDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** Hora atual em Fortaleza, no formato HH:mm. */
export function currentTime(now: Date = new Date()): string {
  return timeFormatter.format(now)
}
