/**
 * Web UI para a versão Bedrock
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

app.get('/api/status', (req, res) => {
  res.json({
    config: manager.config,
    status: manager.getStatus(),
    bots: Array.from(manager.bots.keys()),
    edition: 'bedrock'
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
  const { botName, command } = req.body
  const bot = manager.bots.get(botName)
  if (!bot) return res.status(404).json({ error: 'Bot não encontrado' })

  try {
    switch (command) {
      case 'follow':
        manager.followPlayer(bot, manager.config.ownerName)
        break
      case 'guard':
        manager.guardArea(bot)
        break
      case 'attack':
        manager.attackNearest(bot)
        break
      case 'explore':
        manager.explore(bot)
        break
      case 'stop':
        manager.stopAllTasks(botName)
        bot.chat('Parado.')
        break
      case 'chat':
        bot.chat('Olá do Bedrock!')
        break
      default:
        return res.status(400).json({ error: 'Comando ainda limitado no Bedrock' })
    }
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'status', data: manager.getStatus() }))
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'status', data: manager.getStatus() }))
    }
  }, 2500)
  ws.on('close', () => clearInterval(interval))
})

const PORT = manager.config.webPort || 3000
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=== Companheiros Bedrock prontos ===`)
  console.log(`Abra no Chrome: http://localhost:${PORT}`)
  console.log(`Porta padrão Bedrock: 19132`)
  console.log(`Host: ${manager.config.host}`)
  console.log('\nAVISO: Versão Bedrock ainda experimental.\n')
  manager.startEnabledBots()
})
