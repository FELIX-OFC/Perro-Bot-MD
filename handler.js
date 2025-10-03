// Código creado por Félix

import { smsg } from "./bib/simple.js"
import { fileURLToPath } from "url"
import path, { join } from "path"
import fs, { unwatchFile, watchFile } from "fs"
import chalk from "chalk"

const isNumber = x => typeof x === "number" && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function () {
  clearTimeout(this)
  resolve()
}, ms))

export async function handler(chatUpdate) {
  this.msgqueque = this.msgqueque || []
  this.uptime = this.uptime || Date.now()
  if (!chatUpdate) return

  this.pushMessage(chatUpdate.messages).catch(console.error)
  let m = chatUpdate.messages[chatUpdate.messages.length - 1]
  if (!m) return

  // Contextos reconocidos
  let contextType = "normal"
  if (m.key?.remoteJid?.endsWith("@newsletter")) contextType = "newsletter"
  else if (m.key?.remoteJid?.endsWith("@broadcast")) contextType = "rcanal"
  else if (m.isFake) contextType = "fake"

  // Cargar base de datos si falta
  if (global.db.data == null)
    await global.loadDatabase()

  try {
    m = smsg(this, m) || m
    if (!m) return
    m.exp = 0

    // Inicialización de usuario/chat/settings
    try {
      let user = global.db.data.users[m.sender]
      if (typeof user !== "object")
        global.db.data.users[m.sender] = {}
      if (user) {
        if (!("name" in user)) user.name = m.name
        if (!isNumber(user.exp)) user.exp = 0
        if (!isNumber(user.coin)) user.coin = 0
        if (!isNumber(user.bank)) user.bank = 0
        if (!isNumber(user.level)) user.level = 0
        if (!isNumber(user.health)) user.health = 100
        if (!("genre" in user)) user.genre = ""
        if (!("birth" in user)) user.birth = ""
        if (!("marry" in user)) user.marry = ""
        if (!("description" in user)) user.description = ""
        if (!("packstickers" in user)) user.packstickers = null
        if (!("premium" in user)) user.premium = false
        if (!user.premium) user.premiumTime = 0
        if (!("banned" in user)) user.banned = false
        if (!("bannedReason" in user)) user.bannedReason = ""
        if (!isNumber(user.commands)) user.commands = 0
        if (!isNumber(user.afk)) user.afk = -1
        if (!("afkReason" in user)) user.afkReason = ""
        if (!isNumber(user.warn)) user.warn = 0
      } else global.db.data.users[m.sender] = {
        name: m.name,
        exp: 0,
        coin: 0,
        bank: 0,
        level: 0,
        health: 100,
        genre: "",
        birth: "",
        marry: "",
        description: "",
        packstickers: null,
        premium: false,
        premiumTime: 0,
        banned: false,
        bannedReason: "",
        commands: 0,
        afk: -1,
        afkReason: "",
        warn: 0
      }

      let chat = global.db.data.chats[m.chat]
      if (typeof chat !== 'object')
        global.db.data.chats[m.chat] = {}
      if (chat) {
        if (!("isBanned" in chat)) chat.isBanned = false
        if (!("welcome" in chat)) chat.welcome = true
        if (!("sWelcome" in chat)) chat.sWelcome = ""
        if (!("sBye" in chat)) chat.sBye = ""
        if (!("detect" in chat)) chat.detect = trueBot" in chat)) chat.primaryBot = null
        if (!("modoadmin" in chat)) chat.modoadmin = false
        if (!("antiLink" in chat)) chat.antiLink = true
        if (!("nsfw" in chat)) chat.nsfw = false
        if (!("economy" in chat)) chat.economy = true
        if (!("gacha" in chat)) chat.gacha = true
      } else global.db.data.chats[m.chat] = {
        isBanned: false,
        welcome: true,
        sWelcome: "",
        sBye: "",
        detect: true,
        primaryBot: null,
        modoadmin: false,
        antiLink: true,
        nsfw: false,
        economy: true,
        gacha: true
      }

      var settings = global.db.data.settings[this.user.jid]
      if (typeof settings !== "object")
        global.db.data.settings[this.user.jid] = {}
      if (settings) {
        if (!("self" in settings)) settings.self = false
        if (!("restrict" in settings)) settings.restrict = true
        if (!("jadibotmd" in settings)) settings.jadibotmd = true
        if (!("antiPrivate" in settings)) settings.antiPrivate = false
        if (!("gponly" in.jid] = {
        self: false,
        restrict: true,
        jadibotmd: true,
        antiPrivate: false,
        gponly: false
      }
    } catch (e) {
      console.error(e)
    }

    if (typeof m.text !== "string") m.text = ""
    const user = global.db.data.users[m.sender]
    try {
      const actual = user.name || ""
      const nuevo = m.pushName || await this.getName(m.sender)
      if (typeof nuevo === "string" && nuevo.trim() && nuevo !== actual) {
        user.name = nuevo
      }
    } catch { }

    const chat = global.db.data.chats[m.chat]
    const setting = global.db.data.settings[this.user.jid]

    // Permisos y contexto
    const isROwner = [...global.creadores].map(v => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(m.sender)
    const isOwner = isROwner || m.fromMe
    const isPrems = isROwner || (global.prems || []).map(v => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(m.sender) || user.premium == true

    if (global.opts["nyimak"]) return
    if (!m.fromMe && setting["self"]) return
    if (!m.fromMe && setting["gponly"] && !m.chat.endsWith("g.us")) return

    if (m.isBaileys) return
    m.exp += Math.ceil(Math.random() * 10)
    let usedPrefix

    // Plugins ahora están en comandos/
    const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), "./comandos")
    for (const name in global.plugins) {
      const plugin = global.plugins[name]
      if (!plugin) continue
      if (plugin.disabled) continue
      const __filename = join(___dirname, name)
      if (typeof plugin.all === "function") {
        try {
          await plugin.all.call(this, m, { chatUpdate, contextType, __dirname: ___dirname, __filename, user, chat, setting })
        } catch (err) { console.error(err) }
      }
      const str pluginPrefix.map(prefix => {
            const regex = prefix instanceof RegExp ?
              prefix : new RegExp(strRegex(prefix))
            return [regex.exec(m.text), regex]
          }) : typeof pluginPrefix === "string" ?
            [[new RegExp(strRegex(pluginPrefix)).exec(m.text), new RegExp(strRegex(pluginPrefix))]] :
            [[[], new RegExp]]).find(prefix => prefix[1])
      if (typeof plugin.before === "function") {
        if (await plugin.before.call(this, m, {
          match,
          conn: this,
          contextType,
          __dirname: ___dirname,
          __filename,
          user,
          chat,
          setting
        })) continue
      }
      if (typeof plugin !== "function") continue
      if ((usedPrefix = (match[0] || "")[0])) {
        let [command, ...args] = m.text.replace(usedPrefix, "").trim().split(" ")
        args = args || []
        let _args = m.text.replace(usedPrefix, "").trim().split(" ").slice(1)
        let text = _args.join(" ")
        command = (command || "").toLowerCase()
        const isAccept = plugin.command instanceof RegExp ?
          plugin.command.test(command) :
          Array.isArray(plugin.command) ?
            plugin.command.some(cmd => cmd instanceof RegExp ?
              cmd.test(command) : cmd === command) :
            typeof plugin.command === "string" ?
              plugin.command === command : false
        if (!isAccept) continue
        m.plugin = name
        if (isAccept) { user.commands = (user.commands || 0) + 1 }
        m.isCommand = true
        m.exp += plugin.exp ? parseInt(plugin.exp) : 10

        // Contexto solo para el plugin
        let extra = {
          match, usedPrefix, args, command, text, conn: this, contextType, __dirname: ___dirname, __filename, user, chat, setting
        }
        try {
          await plugin.call(this, m, extra)
        } catch (err) {
          m.error = err
          console.error(err)
        } finally {
          if (typeof plugin.after === "function") {
            try { await plugin.after.call(this, m, extra) }
            catch (err) { console.error(err) }
          }
        }
      }
    }
  } catch (err) {
    console.error(err)
  } finally {
    if (global.opts["queque"] && m.text) {
      const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
      if (quequeIndex !== -1)
        this.msgqueque.splice(quequeIndex, 1)
    }
    let user
    if (m && m.sender && (user = global.db.data.users[m.sender])) {
      user.exp += m.exp
    }
    try {
      if (!global.opts["noprint"]) await (await import("./bib/print.js")).default(m, this)
    } catch (err) {
      console.warn(err)
      console.log(m.message)
    }
  }
}

// Fallos de permisos/adaptación para contextos
global.dfail = (type, m, conn, contextType = "normal") => {
  const msg = {
    creadores: `☆ Este comando solo puede ser usado por Felix y Ado`,
    propietarios: `☆ Este comando solo puede ser usado por Felix y Ado`,
    grupos: `☆ ERROR:\n\nEste bot solo ejecuta comandos en grupos.`,
    private: `☆ El comando *${global.comando}* solo puede ser usado al chat privado del bot.`,
    adminuser: `☆ El comando *${global.comando}* solo puede ser usado por los administradores del grupo.`,
    adminbot: `☆ Para ejecutar el comando *${global.comando}* debo ser administrador del grupo.`,
    restrict: `☆ El comando *${global.comando}* fue desactivado por mis creadores.`
  }[type]
  if (msg) return conn.reply(m.chat, msg, m, { contextType }).then(_ => m.react('✖️'))
    }

// Hot reload!
let file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
  unwatchFile(file)
  console.log(chalk.magenta("Se actualizó 'handler.js'"))
})
