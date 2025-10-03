import fs from "fs";

// Creadores: (Félix ofc y Ado)
global.creadores = [
  "18297933865",
  "50493732693"
];

// Configuraciones Globales
global.ttag = ["18293142989"];
global.qrnombre = "Perro Bot";
global.version = "1.0.0";
global.jadi = "JadiBots";
global.sessions = "Session";
global.Jadibots = true;

global.nombredelbot = 'Perro Bot MD';
global.textbot = 'Developed by wirk and felix';
global.foto = 'foto.jpg';
global.icono = 'icono.jpg';
global.catalogo = 'catalogo.jpg';
global.grupo = 'hhg';
global.canal = 'hhp';
global.numero1 = 'wa1';
global.numero2 = 'wa2';

// APIS PARA EL BOT
global.apis = {};
try {
  if (fs.existsSync("./apis.json")) {
    global.apis = JSON.parse(fs.readFileSync("./apis.json"));
  }
} catch (e) {
  console.error("Error al cargar apis.json:", e);
}
