import { alertaService } from '../modules/alertas/alerta.service.js'

/**
 * Verifica atrasos uma vez ao iniciar e depois a cada minuto.
 * Rodar também ao iniciar cobre o caso do servidor ter ficado fora do ar às 22:40.
 * Em produção isso costuma virar um cron/worker separado.
 */
export function startAtrasosJob(intervalMs = 60_000) {
  const run = () =>
    alertaService
      .verificarAtrasos()
      .then(({ created }) => {
        if (created > 0) console.log(`${created} item(ns) marcado(s) como atrasado(s).`)
      })
      .catch((error: unknown) => console.error('Falha ao verificar atrasos:', error))

  void run()
  const timer = setInterval(run, intervalMs)
  timer.unref() // não impede o processo de encerrar
  return timer
}
