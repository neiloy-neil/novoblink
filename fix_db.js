const fs = require('fs');

try {
  let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  schema = schema.replace(/provider = "postgresql"/, 'provider = "sqlite"');
  schema = schema.replace(/@db\.Decimal\(10, 2\)/g, '');
  fs.writeFileSync('prisma/schema.prisma', schema);
} catch (e) {
  console.log('Error updating schema:', e);
}

try {
  let env = fs.readFileSync('.env.local', 'utf8');
  env = env.replace(/DATABASE_URL=.*/, 'DATABASE_URL="file:./dev.db"');
  fs.writeFileSync('.env.local', env);
} catch (e) {
  console.log('Error updating .env.local:', e);
}

try {
  if (fs.existsSync('prisma.config.ts')) {
    let config = fs.readFileSync('prisma.config.ts', 'utf8');
    config = config.replace(/postgresql/g, 'sqlite');
    fs.writeFileSync('prisma.config.ts', config);
  }
} catch (e) {
  console.log('Error updating config:', e);
}
