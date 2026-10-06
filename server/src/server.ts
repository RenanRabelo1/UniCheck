import { createApp } from './app.js'
import { config } from './config.js'
import { startAtrasosJob } from './jobs/atrasos.job.js'

createApp().listen(config.port, () => {
  console.log(`UniCheck API rodando em http://localhost:${config.port}`)
  startAtrasosJob()
})
