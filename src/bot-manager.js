/**
 * Minecraft Companion Bots - Multi-bot manager
 * Runs fully on Android (Termux) using phone memory
 * Compatible with Minecraft Java Edition LAN worlds (offline auth)
 */

const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const collectBlock = require('mineflayer-collectblock').plugin
const pvp = require('mineflayer-pvp').plugin
const armorManager = require('mineflayer-armor-manager')
const toolPlugin = require('mineflayer-tool').plugin
const fs = require('fs')
const path = require('path')
const Vec3 = require('vec3')

const CONFIG_PATH = path.join(__dirname, '..', 'data', 'config.json')
const HISTORY_PATH = path.join(__dirname, '..', 'data', 'history.json')

let config = loadConfig()
const bots = new Map() // name -> bot instance
const botStates = new Map() // name -> { status, currentTask, lastMessage }

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
    }
  } catch (e) {
    console.log('[Config] Usando configuração padrão')
  }
  // Default
  const defaultConfig = {
    host: '127.0.0.1',
    port: 25565,
    version: false,
    maxBots: 4,
    bots: [
      { name: 'Companheiro1', enabled: true },
      { name: 'Companheiro2', enabled: false },
      { name: 'Companheiro3', enabled: false },
      { name: 'Companheiro4', enabled: false }
    ],
    ownerName: 'Arthur',
    webPort: 3000,
    voiceEnabled: true,
    language: 'pt'
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
  if (history.length > 200) history = history.slice(-200)
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2))
}

function createBot(botConfig) {
  const name = botConfig.name
  if (bots.has(name)) {
    console.log(`[${name}] Já está conectado`)
    return bots.get(name)
  }

  console.log(`[${name}] Conectando a ${config.host}:${config.port} ...`)

  const bot = mineflayer.createBot({
    host: config.host,
    port: config.port,
    username: name,
    auth: 'offline',
    version: config.version || false,
    hideErrors: false
  })

  bot.loadPlugin(pathfinder)
  bot.loadPlugin(collectBlock)
  bot.loadPlugin(pvp)
  bot.loadPlugin(armorManager)
  bot.loadPlugin(toolPlugin)

  botStates.set(name, { status: 'connecting', currentTask: null, lastMessage: '' })

  bot.once('spawn', () => {
    console.log(`[${name}] Spawnou no mundo!`)
    botStates.set(name, { status: 'online', currentTask: 'idle', lastMessage: 'Pronto para ajudar' })
    bot.chat(`Olá ${config.ownerName}! Eu sou ${name}, seu companheiro.`)
    addHistory({ bot: name, type: 'spawn', message: 'Bot conectado e spawnou' })

    // Configurar movimentos
    const mcData = require('minecraft-data')(bot.version)
    const defaultMove = new Movements(bot, mcData)
    bot.pathfinder.setMovements(defaultMove)

    // Auto equip armor
    if (bot.armorManager) {
      setTimeout(() => bot.armorManager.equipAll().catch(() => {}), 2000)
    }
  })

  bot.on('error', (err) => {
    console.log(`[${name}] Erro:`, err.message)
    botStates.set(name, { status: 'error', currentTask: null, lastMessage: err.message })
    addHistory({ bot: name, type: 'error', message: err.message })
  })

  bot.on('kicked', (reason) => {
    console.log(`[${name}] Kickado:`, reason)
    botStates.set(name, { status: 'kicked', currentTask: null, lastMessage: String(reason) })
    bots.delete(name)
    addHistory({ bot: name, type: 'kicked', message: String(reason) })
  })

  bot.on('end', () => {
    console.log(`[${name}] Desconectado`)
    botStates.set(name, { status: 'offline', currentTask: null, lastMessage: 'Desconectado' })
    bots.delete(name)
  })

  // Chat listener (comandos básicos via chat do jogo também)
  bot.on('chat', (username, message) => {
    if (username === bot.username) return
    if (username.toLowerCase() === (config.ownerName || '').toLowerCase() || message.startsWith('!')) {
      handleChatCommand(bot, username, message)
    }
  })

  bots.set(name, bot)
  return bot
}

function handleChatCommand(bot, username, message) {
  const msg = message.toLowerCase().trim()
  const name = bot.username

  if (msg === '!stop' || msg === 'parar' || msg === 'stop') {
    stopAllTasks(bot)
    bot.chat('Parando tudo.')
    return
  }
  if (msg === '!follow' || msg === 'me seguir' || msg === 'follow') {
    followPlayer(bot, username)
    return
  }
  if (msg === '!guard' || msg === 'guardar' || msg === 'guard') {
    guardArea(bot)
    return
  }
  // Mais comandos podem ser adicionados aqui ou via web UI
}

function stopAllTasks(bot) {
  bot.pathfinder.setGoal(null)
  if (bot.pvp) bot.pvp.stop()
  bot.clearControlStates()
  botStates.set(bot.username, { ...botStates.get(bot.username), currentTask: 'idle', lastMessage: 'Parado' })
}

function followPlayer(bot, playerName) {
  const player = bot.players[playerName]?.entity
  if (!player) {
    bot.chat('Não consigo te ver. Chegue mais perto!')
    return
  }
  const goal = new goals.GoalFollow(player, 2)
  bot.pathfinder.setGoal(goal, true)
  botStates.set(bot.username, { ...botStates.get(bot.username), currentTask: 'follow', lastMessage: `Seguindo ${playerName}` })
  bot.chat(`Seguindo você, ${playerName}!`)
  addHistory({ bot: bot.username, type: 'command', message: `Follow ${playerName}` })
}

function guardArea(bot) {
  const pos = bot.entity.position.clone()
  botStates.set(bot.username, { ...botStates.get(bot.username), currentTask: 'guard', lastMessage: 'Guardando área' })
  bot.chat('Guardando esta área!')

  const interval = setInterval(() => {
    if (!bots.has(bot.username) || botStates.get(bot.username)?.currentTask !== 'guard') {
      clearInterval(interval)
      return
    }
    const entity = bot.nearestEntity(e => e.type === 'mob' && e.position.distanceTo(bot.entity.position) < 16)
    if (entity && bot.pvp) {
      bot.pvp.attack(entity)
    } else {
      // Voltar para posição de guarda se longe
      if (bot.entity.position.distanceTo(pos) > 8) {
        bot.pathfinder.setGoal(new goals.GoalBlock(pos.x, pos.y, pos.z))
      }
    }
  }, 1500)
}

async function gatherResource(bot, blockName = 'oak_log', count = 8) {
  botStates.set(bot.username, { ...botStates.get(bot.username), currentTask: 'gather', lastMessage: `Coletando ${blockName}` })
  bot.chat(`Coletando ${blockName}...`)

  try {
    const mcData = require('minecraft-data')(bot.version)
    const blockType = mcData.blocksByName[blockName]
    if (!blockType) {
      bot.chat(`Não conheço o bloco ${blockName}`)
      return
    }

    const blocks = bot.findBlocks({
      matching: blockType.id,
      maxDistance: 48,
      count: count
    })

    if (blocks.length === 0) {
      bot.chat('Não encontrei nenhum por perto.')
      return
    }

    const targets = blocks.map(pos => bot.blockAt(pos)).filter(b => b)
    await bot.collectBlock.collect(targets)
    bot.chat('Coleta concluída!')
    botStates.set(bot.username, { ...botStates.get(bot.username), currentTask: 'idle', lastMessage: 'Coleta concluída' })
  } catch (err) {
    bot.chat('Erro na coleta: ' + err.message)
    console.log(err)
  }
}

async function craftItem(bot, itemName = 'crafting_table') {
  bot.chat(`Tentando craftar ${itemName}...`)
  // Implementação simplificada - o usuário pode expandir
  bot.chat('Craft ainda em desenvolvimento avançado. Use a mesa de craft manualmente por enquanto.')
}

function explore(bot) {
  const pos = bot.entity.position
  const target = pos.offset(
    (Math.random() - 0.5) * 40,
    0,
    (Math.random() - 0.5) * 40
  )
  bot.pathfinder.setGoal(new goals.GoalNear(target.x, target.y, target.z, 2))
  botStates.set(bot.username, { ...botStates.get(bot.username), currentTask: 'explore', lastMessage: 'Explorando' })
  bot.chat('Explorando a área!')
}

async function goSleep(bot) {
  const bed = bot.findBlock({
    matching: block => bot.isABed(block),
    maxDistance: 16
  })
  if (!bed) {
    bot.chat('Não achei nenhuma cama por perto.')
    return
  }
  try {
    await bot.sleep(bed)
    bot.chat('Boa noite!')
    botStates.set(bot.username, { ...botStates.get(bot.username), currentTask: 'sleep', lastMessage: 'Dormindo' })
  } catch (e) {
    bot.chat('Não consegui dormir: ' + e.message)
  }
}

function attackNearest(bot) {
  const entity = bot.nearestEntity(e => e.type === 'mob' && e.position.distanceTo(bot.entity.position) < 16)
  if (!entity) {
    bot.chat('Nenhum mob por perto.')
    return
  }
  if (bot.pvp) {
    bot.pvp.attack(entity)
    botStates.set(bot.username, { ...botStates.get(bot.username), currentTask: 'attack', lastMessage: `Atacando ${entity.name}` })
    bot.chat(`Atacando ${entity.name || 'mob'}!`)
  }
}

// Export for web server and CLI
module.exports = {
  config,
  bots,
  botStates,
  createBot,
  stopAllTasks,
  followPlayer,
  guardArea,
  gatherResource,
  craftItem,
  explore,
  goSleep,
  attackNearest,
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
    if (bot) {
      bot.quit()
      bots.delete(name)
    }
  },
  setConfig: (newConfig) => {
    Object.assign(config, newConfig)
    saveConfig()
  }
}

// Se rodado diretamente
if (require.main === module) {
  console.log('=== Minecraft Companion Bots ===')
  console.log('Rodando na memória do dispositivo')
  console.log(`Host: ${config.host}:${config.port}`)
  console.log('Iniciando bots habilitados...\n')
  module.exports.startEnabledBots()
}
