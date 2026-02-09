/**
 * 🔍 Script de diagnóstico del Splash Screen
 * Verifica que todo esté configurado correctamente
 */

const fs = require("fs");
const path = require("path");

// Obtener directorio base del proyecto
const projectRoot = path.resolve(__dirname, "..");

console.log("\n🔍 DIAGNÓSTICO DEL SPLASH SCREEN\n");
console.log("=".repeat(50));

let allGood = true;

// 1. Verificar fuente
console.log("\n1️⃣ Verificando fuente Pacifico...");
const fontPath = path.join(
  projectRoot,
  "assets",
  "fonts",
  "Pacifico-Regular.ttf",
);
if (fs.existsSync(fontPath)) {
  const stats = fs.statSync(fontPath);
  console.log("   ✅ Fuente encontrada");
  console.log(`   📦 Tamaño: ${(stats.size / 1024).toFixed(2)} KB`);
} else {
  console.log("   ❌ Fuente NO encontrada");
  console.log(`   📂 Buscado en: ${fontPath}`);
  console.log("   🔧 Solución: npm run setup:splash-font");
  allGood = false;
}

// 2. Verificar componente
console.log("\n2️⃣ Verificando componente...");
const componentPath = path.join(
  projectRoot,
  "components",
  "layout",
  "splash-screen.tsx",
);
if (fs.existsSync(componentPath)) {
  console.log("   ✅ Componente encontrado");
  const content = fs.readFileSync(componentPath, "utf8");

  // Verificar importaciones clave
  if (content.includes("expo-linear-gradient")) {
    console.log("   ✅ Import de LinearGradient");
  } else {
    console.log("   ⚠️ Falta import de LinearGradient");
  }

  if (content.includes("useFonts")) {
    console.log("   ✅ Hook useFonts configurado");
  } else {
    console.log("   ⚠️ Falta hook useFonts");
  }

  if (content.includes("useSystemFont")) {
    console.log("   ✅ Fallback de fuente configurado");
  } else {
    console.log("   ⚠️ Falta fallback de fuente");
  }
} else {
  console.log("   ❌ Componente NO encontrado");
  allGood = false;
}

// 3. Verificar integración
console.log("\n3️⃣ Verificando integración en _layout.tsx...");
const layoutPath = path.join(projectRoot, "app", "_layout.tsx");
if (fs.existsSync(layoutPath)) {
  const content = fs.readFileSync(layoutPath, "utf8");

  if (content.includes("SplashScreen")) {
    console.log("   ✅ Import de SplashScreen");
  } else {
    console.log("   ❌ Falta import de SplashScreen");
    allGood = false;
  }

  if (content.includes("preventAutoHideAsync")) {
    console.log("   ✅ preventAutoHideAsync configurado");
  } else {
    console.log(
      "   ⚠️ Falta preventAutoHideAsync (splash nativo puede ocultarse)",
    );
  }

  if (content.includes("onLoadComplete")) {
    console.log("   ✅ Callback onLoadComplete configurado");
  } else {
    console.log("   ❌ Falta callback onLoadComplete");
    allGood = false;
  }
} else {
  console.log("   ❌ _layout.tsx NO encontrado");
  allGood = false;
}

// 4. Verificar dependencias
console.log("\n4️⃣ Verificando dependencias...");
const packagePath = path.join(projectRoot, "package.json");
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  if (deps["expo-linear-gradient"]) {
    console.log("   ✅ expo-linear-gradient instalado");
  } else {
    console.log("   ❌ expo-linear-gradient NO instalado");
    console.log("   🔧 Solución: npx expo install expo-linear-gradient");
    allGood = false;
  }

  if (deps["expo-font"]) {
    console.log("   ✅ expo-font instalado");
  } else {
    console.log("   ⚠️ expo-font NO instalado (se instala con expo)");
  }

  if (deps["expo-splash-screen"]) {
    console.log("   ✅ expo-splash-screen instalado");
  } else {
    console.log("   ⚠️ expo-splash-screen NO instalado (se instala con expo)");
  }
} else {
  console.log("   ❌ package.json NO encontrado");
  allGood = false;
}

// Resultado final
console.log("\n" + "=".repeat(50));
if (allGood) {
  console.log("\n✅ TODO LISTO! El splash debería funcionar.\n");
  console.log("🚀 Ejecuta: npx expo start -c\n");
} else {
  console.log("\n⚠️ HAY PROBLEMAS. Revisa los errores arriba.\n");
  console.log("📚 Consulta: docs/SPLASH_TROUBLESHOOTING.md\n");
}
