import './perroBot.js'; // Configuraciones 
import fs from "fs";
import figlet from "figlet";
import chalk from "chalk";
import readlineSync from "readline-sync";
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  DisconnectReason,
  generateWAMessageFromContent,
  jidNormalizedUser
} from "@whiskeysockets/baileys";
import path from "path";
import { fileURLToPath } from "url";

// IMPORTAR LÓGICA PARA SUBBOTS
import "./comandos/socket.conexion.js";

// === CONFIGURACIÓN DE SESIÓN ===
const SESSION_FOLDER = global.sessions || "Session";

// === MOSTRAR MENSAJE DE INICIO ===
console.clear();
console.log(
  chalk.cyan(
    figlet.textSync("PERRO BOT MD", { horizontalLayout: "default" })
  )
);
console.log(
  chalk.greenBright(`
Elige una opción:
1. Escribe qr para enviarte un código qr.
2. Escribe code para enviarte código de 8 dígitos.
`)
);

// === ESPERAR OPCIÓN DEL USUARIO ===
let opcion = "";
while (opcion !== "qr" && opcion !== "code") {
  opcion = readlineSync.question(chalk.yellow("Opción (qr/code): ")).trim().toLowerCase();
}

// === INICIAR BOT SEGÚN OPCIÓN ===
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_FOLDER);
  const { version } = await fetchLatestBaileysVersion();
  const store = makeInMemoryStore({});

  const sock = makeWASocket({
    version,
    printQRInTerminal: false, // lo manejamos manualmente
    auth: state,
    syncFullHistory: false,
    logger: { level: "silent" }
  });

  sock.ev.on("creds.update", saveCreds);

  // === QRCODE MANUAL O CÓDIGO DE 8 DÍGITOS ===
  let vinculado = false;
  sock.ev.on("connection.update", async (update) => {
    const { connection, qr, pairingCode, lastDisconnect } = update;

    // QR
    if (opcion === "qr" && qr) {
      console.clear();
      console.log(
        chalk.cyan(figlet.textSync("PERRO BOT MD"))
      );
      console.log(chalk.greenBright("Escanea este código QR con WhatsApp Web para vincular el bot:"));
      console.log(qr);
    }

    // CÓDIGO DE 8 DÍGITOS
    if (opcion === "code" && !pairingCode && connection === "connecting") {
      try {
        // ¡Solo disponible en algunos clientes!
        const code = await sock.requestPairingCode(global.numero1 || undefined); // O usa tu número principal
        console.log(chalk.greenBright("Código de 8 dígitos:"));
        console.log(chalk.bold(code));
      } catch (e) {
        console.log(chalk.red("No fue posible generar el código de 8 dígitos. Usa 'qr'."));
        process.exit();
      }
    }
    if (pairingCode) {
      // Si pairingCode aparece, muéstralo
      console.log(chalk.greenBright("Código de 8 dígitos:"));
      console.log(chalk.bold(pairingCode));
    }

    // CONECTADO
    if (connection === "open") {
      vinculado = true;
      console.log(chalk.green("\nBot principal registrado, leyendo mensajes entrantes..."));
    }

    // DESCONECTADO
    if (connection === "close") {
      if (!vinculado) {
        setInterval(() => {
          console.log(
            chalk.red(
              `\nNo se pudo vincular, Elimina la carpeta ${SESSION_FOLDER} y reinicia el servidor.\n`
            )
          );
        }, 2000);
      }
    }
  });

  // === ESCUCHA MENSAJES ENTRANTES PARA SUBBOTS (#code y #qr) ===
  sock.ev.on("messages.upsert", async ({ messages }) => {
    if (!messages || !messages[0]) return;
    const m = messages[0];
    let body = m.message?.conversation || m.message?.extendedTextMessage?.text || "";
    body = body.trim().toLowerCase();

    // SubBot: enviar código QR o 8 dígitos por mensaje
    if (body === "#qr") {
      const qr = sock.qr; // No siempre está disponible, depende del flujo
      if (qr) {
        await sock.sendMessage(m.key.remoteJid, { text: `Escanea este código QR:\n${qr}` });
      } else {
        await sock.sendMessage(m.key.remoteJid, { text: "No hay QR disponible en este momento. Intenta de nuevo más tarde." });
      }
    }
    if (body === "#code") {
      try {
        const code = await sock.requestPairingCode(jidNormalizedUser(m.key.participant || m.key.remoteJid));
        await sock.sendMessage(m.key.remoteJid, { text: `Tu código de 8 dígitos: ${code}` });
      } catch {
        await sock.sendMessage(m.key.remoteJid, { text: "No fue posible generar el código (quizás por limitación del cliente)." });
      }
    }
  });

  // === INTEGRACIÓN CON CÓDIGO DE SUBBOTS (socket.conexion.js) ===
  try {
    if (fs.existsSync("./comandos/socket.conexion.js")) {
      // El archivo puede usar sock y store
      (await import('./comandos/socket.conexion.js')).default?.(sock, store);
    }
  } catch (e) {
    // No pasa nada si no existe
  }
}

await startBot();

// === HOT RELOAD PARA DESARROLLO ===
let __filename = fileURLToPath(import.meta.url);
fs.watchFile(__filename, () => {
  fs.unwatchFile(__filename);
  console.log(chalk.redBright("Update 'index.js'"));
  import(`${__filename}?update=${Date.now()}`);
});
