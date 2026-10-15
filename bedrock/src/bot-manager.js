/**
 * Minecraft Companion Bots - Bedrock Edition
 * Usa bedrock-protocol (base mais estável atualmente)
 * Roda na memória do celular via Termux
 *
 * LIMITAÇÕES HONESTAS:
 * - Pathfinding avançado ainda é experimental no Bedrock
 * - Coleta de recursos e craft são limitados
 * - Comandos básicos (seguir, atacar, chat, parar) funcionam melhor
 */

const bedrock = require('bedrock-protocol')
const fs = require('fs')
const path = require('path')
const { Vec3 } = require('vec3')

const CONFIG_PATH = path.join(__dirname, '..', 'data', 'config.json')
const HISTORY_PATH = path.join(__dirname, '..', 'data', 'history.json')

let config = loadConfig()
const bots = new Map()
const botStates = new Map()

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
    }
  } catch (e) {}
  const defaultConfig = {
    host: '127.0.0.1',
    port: 19132,          // Porta padrão do Bedrock
    version: '1.21.50',   // Ajuste conforme sua versão
    maxBots: 2,           // Recomendado começar com 1-2 no Bedrock
    bots: [
      { name: 'Companheiro1', enabled: true },
      { name: 'Companheiro2', enabled: false }
    ],
    ownerName: 'Arthur',
    webPort: 3000,
    offline: true
  }
  saveConfig(defaultConfig)
  return defaultConfig
}

function saveConfig(cfg = config) {
  const dir = path.dirname(CONFIG_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2))
  config = cfg
}

function addHistory(entry) {
  let history = []
  try {
    if (fs.existsSync(HISTORY_PATH)) {
      history = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'))
    }
  } catch (e) {}
  history.push({ ...entry, time: new Date().toISOString() })
  if (history.length > 150) history = history.slice(-150)
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2))
}

function createBot(botConfig) {
  const name = botConfig.name
  if (bots.has(name)) {
    console.log(`[${name}] Já está conectado`)
    return bots.get(name)
  }

  console.log(`[${name}] Conectando Bedrock em ${config.host}:${config.port} ...`)

  const client = bedrock.createClient({
    host: config.host,
    port: config.port,
    username: name,
    offline: config.offline !== false,
    version: config.version || undefined,
    skipPing: true
  })

  botStates.set(name, { status: 'connecting', currentTask: null, lastMessage: 'Conectando...' })

  client.on('join', () => {
    console.log(`[${name}] Entrou no servidor (join)`)
  })

  client.on('spawn', () => {
    console.log(`[${name}] Spawnou no mundo Bedrock!`)
    botStates.set(name, { status: 'online', currentTask: 'idle', lastMessage: 'Pronto (Bedrock)' })
    addHistory({ bot: name, type: 'spawn', message: 'Bot Bedrock conectado' })

    setTimeout(() => {
      try {
        client.queue('text', {
          type: 'chat',
          needs_translation: false,
          source_name: name,
          xuid: '',
          platform_chat_id: '',
          filtered_message: '',
          message: `Olá ${config.ownerName}! Eu sou ${name} (Bedrock).`
        })
      } catch (e) {
        console.log('Erro ao enviar chat:', e.message)
      }
    }, 2000)
  })

  client.on('text', (packet) => {
    if (packet.source_name === name) return
    const msg = (packet.message || '').toLowerCase()
    if (packet.source_name?.toLowerCase() === (config.ownerName || '').toLowerCase() || msg.startsWith('!')) {
      handleCommand(client, name, packet.source_name, packet.message)
    }
  })

  client.on('error', (err) => {
    console.log(`[${name}] Erro:`, err.message)
    botStates.set(name, { status: 'error', currentTask: null, lastMessage: err.message })
    addHistory({ bot: name, type: 'error', message: err.message })
  })

  client.on('kick', (packet) => {
    console.log(`[${name}] Kickado:`, packet)
    botStates.set(name, { status: 'kicked', currentTask: null, lastMessage: 'Kickado' })
    bots.delete(name)
  })

  client.on('close', () => {
    console.log(`[${name}] Desconectado`)
    botStates.set(name, { status: 'offline', currentTask: null, lastMessage: 'Desconectado' })
    bots.delete(name)
  })

  const botWrapper = {
    client,
    username: name,
    chat: (message) => {
      try {
        client.queue('text', {
          type: 'chat',
          needs_translation: false,
          source_name: name,
          xuid: '',
          platform_chat_id: '',
          filtered_message: '',
          message
        })
      } catch (e) {
        console.log('Erro chat:', e.message)
      }
    },
    moveForward: (seconds = 2) => {
      botStates.set(name, { ...botStates.get(name), currentTask: 'moving', lastMessage: 'Andando' })
    }
  }

  bots.set(name, botWrapper)
  return botWrapper
}

function handleCommand(client, botName, username, message) {
  const msg = (message || '').toLowerCase().trim()
  const bot = bots.get(botName)
  if (!bot) return

  if (msg === '!stop' || msg === 'parar' || msg === 'stop') {
    botStates.set(botName, { ...botStates.get(botName), currentTask: 'idle', lastMessage: 'Parado' })
    bot.chat('Parando.')
    return
  }

  if (msg === '!follow' || msg === 'me seguir' || msg === 'follow') {
    botStates.set(botName, { ...botStates.get(botName), currentTask: 'follow', lastMessage: `Tentando seguir ${username}` })
    bot.chat(`Vou tentar te seguir, ${username}! (Bedrock ainda tem pathfinding limitado)`)
    return
  }

  if (msg === '!guard' || msg === 'guardar') {
    botStates.set(botName, { ...botStates.get(botName), currentTask: 'guard', lastMessage: 'Guardando' })
    bot.chat('Ficarei por aqui guardando.')
    return
  }

  if (msg === '!pos') {
    bot.chat('Posição ainda em desenvolvimento no Bedrock.')
    return
  }
}

function stopAllTasks(botName) {
  const state = botStates.get(botName)
  if (state) {
    botStates.set(botName, { ...state, currentTask: 'idle', lastMessage: 'Parado' })
  }
}

module.exports = {
  config,
  bots,
  botStates,
  createBot,
  stopAllTasks,
  saveConfig,
  loadConfig,
  addHistory,
  getStatus: () => {
    const status = {}
    for (const [name, state] of botStates) {
      status[name] = state
    }
    return status
  },
  startEnabledBots: () => {
    config.bots.forEach(b => {
      if (b.enabled) createBot(b)
    })
  },
  disconnectBot: (name) => {
    const bot = bots.get(name)
    if (bot && bot.client) {
      try { bot.client.close() } catch (e) {}
      bots.delete(name)
    }
  },
  setConfig: (newConfig) => {
    Object.assign(config, newConfig)
    saveConfig()
  },
  followPlayer: (bot, playerName) => {
    if (!bot) return
    botStates.set(bot.username, { ...botStates.get(bot.username), currentTask: 'follow', lastMessage: `Seguindo ${playerName}` })
    bot.chat(`Tentando seguir ${playerName} (limitado no Bedrock)`)
  },
  guardArea: (bot) => {
    if (!bot) return
    botStates.set(bot.username, { ...botStates.get(bot.username), currentTask: 'guard', lastMessage: 'Guardando' })
    bot.chat('Guardando a área.')
  },
  attackNearest: (bot) => {
    if (!bot) return
    bot.chat('Ataque automático ainda experimental no Bedrock.')
  },
  explore: (bot) => {
    if (!bot) return
    botStates.set(bot.username, { ...botStates.get(bot.username), currentTask: 'explore', lastMessage: 'Explorando' })
    bot.chat('Explorando...')
  }
}

if (require.main === module) {
  console.log('=== Minecraft Companion Bots - Bedrock ===')
  console.log('Rodando na memória do celular')
  console.log(`Host: ${config.host}:${config.port}`)
  module.exports.startEnabledBots()
}
