/**
 * Web UI local - roda no próprio celular
 * Abra http://localhost:3000 no Chrome do Android
 */

const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const path = require('path')
const manager = require('./bot-manager')

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

app.use(express.json())
app.use(express.static(path.join(__dirname, '..', 'android', 'web-ui')))

// API simples
app.get('/api/status', (req, res) => {
  res.json({
    config: manager.config,
    status: manager.getStatus(),
    bots: Array.from(manager.bots.keys())
  })
})

app.post('/api/config', (req, res) => {
  manager.setConfig(req.body)
  res.json({ ok: true, config: manager.config })
})

app.post('/api/bot/start', (req, res) => {
  const { name } = req.body
  const botCfg = manager.config.bots.find(b => b.name === name) || { name, enabled: true }
  manager.createBot(botCfg)
  res.json({ ok: true })
})

app.post('/api/bot/stop', (req, res) => {
  const { name } = req.body
  manager.disconnectBot(name)
  res.json({ ok: true })
})

app.post('/api/command', (req, res) => {
  const { botName, command, args } = req.body
  const bot = manager.bots.get(botName)
  if (!bot) return res.status(404).json({ error: 'Bot não encontrado' })

  try {
    switch (command) {
      case 'follow':
        manager.followPlayer(bot, args?.player || manager.config.ownerName)
        break
      case 'guard':
        manager.guardArea(bot)
        break
      case 'gather':
        manager.gatherResource(bot, args?.block || 'oak_log', args?.count || 8)
        break
      case 'explore':
        manager.explore(bot)
        break
      case 'sleep':
        manager.goSleep(bot)
        break
      case 'attack':
        manager.attackNearest(bot)
        break
      case 'stop':
        manager.stopAllTasks(bot)
        break
      case 'chat':
        bot.chat(args?.message || 'Olá!')
        break
      default:
        return res.status(400).json({ error: 'Comando desconhecido' })
    }
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// WebSocket para status em tempo real
wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'status', data: manager.getStatus() }))

  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'status', data: manager.getStatus() }))
    }
  }, 2000)

  ws.on('close', () => clearInterval(interval))
})

const PORT = manager.config.webPort || 3000
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=== Interface Web pronta ===`)
  console.log(`Abra no Chrome do celular: http://localhost:${PORT}`)
  console.log(`Ou pelo IP local do celular se estiver em outra aba.\n`)
  console.log('Iniciando bots habilitados...')
  manager.startEnabledBots()
})
