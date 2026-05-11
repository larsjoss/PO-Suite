/**
 * User provisioning script for the PO Suite enterprise backend.
 * Usage: npm run create-user -- --email user@firma.ch --password secret123
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : undefined;
}

async function main() {
  const email = getArg('email');
  const password = getArg('password');

  if (!email || !password) {
    console.error('Usage: npm run create-user -- --email <email> --password <password>');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { email, passwordHash } });
    console.log(`User created: ${user.id} <${user.email}>`);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Unique constraint')) {
      console.error(`User with email ${email} already exists`);
      process.exit(1);
    }
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
