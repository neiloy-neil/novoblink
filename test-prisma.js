const { PrismaClient } = require('@prisma/client');
const { PrismaSqLite } = require('@prisma/adapter-sqlite');
const Database = require('better-sqlite3');

const sqlite = new Database('dev.db');
const adapter = new PrismaSqLite(sqlite);
const prisma = new PrismaClient({ adapter });

prisma.user.findMany().then(console.log).catch(console.error);
