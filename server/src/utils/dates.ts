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

// Fortaleza não tem horário de verão: o fuso é sempre UTC-3.
const OFFSET = '-03:00'

const dbFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

/** Data/hora para gravar no MySQL (DATETIME), sempre no horário de Fortaleza: "2026-10-05 14:15:00". */
export function toDbDateTime(date: Date): string {
  return dbFormatter.format(date)
}

/** Volta do MySQL para o formato ISO que a API sempre devolveu: "2026-10-05T14:15:00-03:00". */
export function fromDbDateTime(value: string): string {
  return `${value.replace(' ', 'T')}${OFFSET}`
}
