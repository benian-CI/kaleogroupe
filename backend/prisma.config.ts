// Configuration de la CLI Prisma (obligatoire depuis Prisma 7) : l'adresse de la
// base n'est plus dans schema.prisma mais ici. Prisma 7 ne charge plus le .env
// tout seul, d'où l'import de dotenv (sans effet sur Render, où les variables
// d'environnement sont déjà définies).
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js'
  },
  datasource: {
    url: env('DATABASE_URL')
  }
});
