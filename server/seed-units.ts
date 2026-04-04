import { getDb } from './db';
import { clientUnits } from '../drizzle/schema';

async function seed() {
  const db = await getDb();
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  try {
    const result = await db.insert(clientUnits).values([
      { clientId: 1, name: 'Sorotama', address: 'Rua A, 123 - São Paulo, SP', isActive: true },
      { clientId: 1, name: 'Base Central', address: 'Avenida B, 456 - São Paulo, SP', isActive: true },
      { clientId: 1, name: 'Dufrio', address: 'Rua C, 789 - Guarulhos, SP', isActive: true },
      { clientId: 1, name: 'Unidade RG', address: 'Rua D, 321 - São Paulo, SP', isActive: true },
    ]);
    console.log('Inserted units successfully');
  } catch (e) {
    console.error('Error:', e);
  }
  process.exit(0);
}

seed();
