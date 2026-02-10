/**
 * Script de prueba para verificar la inicialización de la base de datos
 *
 * Este archivo es solo para testing durante desarrollo
 */

import {
  closeDatabase,
  getDatabase,
  getDatabaseStats,
  initializeDatabase,
} from "./index";

/**
 * Test de inicialización de base de datos
 */
export async function testDatabaseInitialization(): Promise<void> {
  console.log("🧪 Iniciando test de base de datos...\n");

  try {
    // 1. Inicializar base de datos
    console.log("1️⃣ Inicializando base de datos...");
    await initializeDatabase();

    // 2. Obtener estadísticas
    console.log("\n2️⃣ Obteniendo estadísticas...");
    const stats = await getDatabaseStats();
    console.log("📊 Estadísticas:", JSON.stringify(stats, null, 2));

    // 3. Verificar admin por defecto
    console.log("\n3️⃣ Verificando admin por defecto...");
    const db = await getDatabase();
    const admin = await db.getFirstAsync(
      `SELECT id, email, full_name, role, state FROM users WHERE email = ?`,
      ["admin@brigada.digital"],
    );

    if (admin) {
      console.log("✅ Admin encontrado:", admin);
    } else {
      console.warn("⚠️ Admin no encontrado");
    }

    // 4. Verificar tablas
    console.log("\n4️⃣ Verificando tablas...");
    const tables = await db.getAllAsync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`,
    );
    console.log("📋 Tablas creadas:", tables.map((t) => t.name).join(", "));

    // 5. Verificar índices
    console.log("\n5️⃣ Verificando índices...");
    const indexes = await db.getAllAsync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name`,
    );
    console.log("🔍 Índices creados:", indexes.map((i) => i.name).join(", "));

    console.log("\n✅ ¡Test completado exitosamente!");
  } catch (error) {
    console.error("\n❌ Error en test:", error);
    throw error;
  } finally {
    await closeDatabase();
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  testDatabaseInitialization()
    .then(() => {
      console.log("\n🎉 Test finalizado");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Test falló:", error);
      process.exit(1);
    });
}
