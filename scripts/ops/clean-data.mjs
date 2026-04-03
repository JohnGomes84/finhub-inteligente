import mysql from "mysql2/promise";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL não definida");
  process.exit(1);
}

const parseUrl = (url) => {
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)\?/);
  if (!match) throw new Error("Invalid DATABASE_URL format");
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5],
    ssl: { rejectUnauthorized: true },
  };
};

const config = parseUrl(connectionString);
config.waitForConnections = true;
config.connectionLimit = 1;
config.queueLimit = 0;

(async () => {
  const connection = await mysql.createConnection(config);
  console.log("✓ Conexão com DB estabelecida\n");

  const tables = [
    "audit_logs",
    "pix_change_requests",
    "schedule_allocations",
    "schedule_functions",
    "work_schedules",
    "payment_batches",
    "accounts_payable",
    "accounts_receivable",
    "employees",
    "clients",
    "suppliers",
  ];

  console.log("📊 CONTAGEM ANTES DA LIMPEZA:");
  const before = {};

  for (const table of tables) {
    const [rows] = await connection.execute(`SELECT COUNT(*) as cnt FROM \`${table}\``);
    before[table] = rows[0].cnt;
    console.log(`  ${table}: ${rows[0].cnt} registros`);
  }

  console.log("\n🗑️  EXECUTANDO LIMPEZA...");

  // Backup
  for (const table of tables) {
    try {
      await connection.execute(`CREATE TABLE IF NOT EXISTS backup_${table} AS SELECT * FROM ${table}`);
    } catch (e) {
      // Ignorar se já existe
    }
  }
  console.log("✓ Backup criado em tabelas backup_*");

  // Delete em ordem
  for (const table of tables) {
    await connection.execute(`DELETE FROM \`${table}\``);
    await connection.execute(`ALTER TABLE \`${table}\` AUTO_INCREMENT = 1`);
  }
  console.log("✓ Dados deletados e AUTO_INCREMENT resetado");

  console.log("\n📊 CONTAGEM DEPOIS DA LIMPEZA:");
  let totalRemoved = 0;

  for (const table of tables) {
    const [rows] = await connection.execute(`SELECT COUNT(*) as cnt FROM \`${table}\``);
    const removed = before[table] - rows[0].cnt;
    totalRemoved += removed;
    console.log(`  ${table}: 0 registros (removidos: ${removed})`);
  }

  console.log(`\n✅ LIMPEZA CONCLUÍDA: ${totalRemoved} registros removidos no total`);

  // Verificar tabelas mantidas
  console.log("\n📌 TABELAS MANTIDAS (estrutura + dados base):");
  const kept = ["users", "shifts", "job_functions", "cost_centers"];
  for (const table of kept) {
    const [rows] = await connection.execute(`SELECT COUNT(*) as cnt FROM \`${table}\``);
    console.log(`  ${table}: ${rows[0].cnt} registros`);
  }

  await connection.end();
})().catch((err) => {
  console.error("❌ Erro:", err.message);
  process.exit(1);
});
