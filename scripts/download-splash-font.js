#!/usr/bin/env node

/**
 * Script para descargar la fuente Pacifico de Google Fonts
 *
 * Uso:
 *   node scripts/download-splash-font.js
 *
 * O desde package.json:
 *   npm run setup:splash-font
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// Configuración
const FONT_URL =
  "https://github.com/google/fonts/raw/main/ofl/pacifico/Pacifico-Regular.ttf";
const FONTS_DIR = path.join(__dirname, "..", "assets", "fonts");
const FONT_FILE = path.join(FONTS_DIR, "Pacifico-Regular.ttf");

// Colores para la consola
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function downloadFont() {
  return new Promise((resolve, reject) => {
    log("📥 Descargando fuente Pacifico...", "blue");

    // Crear directorio si no existe
    if (!fs.existsSync(FONTS_DIR)) {
      fs.mkdirSync(FONTS_DIR, { recursive: true });
      log(`✅ Creado directorio: ${FONTS_DIR}`, "green");
    }

    // Verificar si ya existe
    if (fs.existsSync(FONT_FILE)) {
      log("⚠️  La fuente ya existe. Sobrescribiendo...", "yellow");
    }

    // Descargar archivo
    const file = fs.createWriteStream(FONT_FILE);

    https
      .get(FONT_URL, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Error HTTP: ${response.statusCode}`));
          return;
        }

        const totalSize = parseInt(response.headers["content-length"], 10);
        let downloadedSize = 0;

        response.on("data", (chunk) => {
          downloadedSize += chunk.length;
          const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
          process.stdout.write(`\r⏳ Progreso: ${progress}%`);
        });

        response.pipe(file);

        file.on("finish", () => {
          file.close();
          console.log(""); // Nueva línea después del progreso
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(FONT_FILE, () => {}); // Eliminar archivo parcial
        reject(err);
      });

    file.on("error", (err) => {
      fs.unlink(FONT_FILE, () => {}); // Eliminar archivo parcial
      reject(err);
    });
  });
}

async function main() {
  try {
    log("🚀 Instalando fuente para Splash Screen\n", "blue");

    await downloadFont();

    log("\n✅ ¡Fuente instalada exitosamente!", "green");
    log(`📁 Ubicación: ${FONT_FILE}`, "blue");
    log("\n💡 Siguiente paso:", "yellow");
    log("   Ejecuta: npx expo start", "blue");
    log(
      '   La app ahora mostrará el splash screen con el logo "brigadaDigital"\n',
      "reset",
    );
  } catch (error) {
    log(`\n❌ Error al descargar la fuente:`, "red");
    log(`   ${error.message}`, "red");
    log("\n💡 Alternativa manual:", "yellow");
    log("   1. Visita: https://fonts.google.com/specimen/Pacifico", "blue");
    log("   2. Descarga Pacifico-Regular.ttf", "blue");
    log(`   3. Colócalo en: ${FONT_FILE}\n`, "blue");
    process.exit(1);
  }
}

main();
