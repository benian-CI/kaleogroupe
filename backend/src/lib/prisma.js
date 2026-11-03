const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

// Prisma 7 se connecte à PostgreSQL via un adaptateur (driver "pg") au lieu de
// son ancien moteur intégré. Délai de connexion de 5 s, comme le comportement
// par défaut de Prisma 6 (pg n'en a pas par défaut).
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000
});

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
