import { getDb } from './db';
import { clients, clientUnits } from '../drizzle/schema';

async function main() {
  const db = await getDb();
  if (!db) {
    console.log('DB connection failed');
    return;
  }

  const clientsList = await db.select().from(clients).limit(3);
  console.log('=== CLIENTES ===');
  console.log(JSON.stringify(clientsList, null, 2));

  const unitsList = await db.select().from(clientUnits).limit(10);
  console.log('\n=== UNITS ===');
  console.log(JSON.stringify(unitsList, null, 2));
}

main().catch(console.error);
