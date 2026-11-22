// The Prisma client — rendered by the pipeline. One instance per server
// process, kept across dev reloads so hot reload does not exhaust connections.
import { PrismaClient, Prisma } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Password hashes never leave the database by accident: every query omits any
// field that holds one, unless the query asks for it (`omit: { passwordHash:
// false }`) — only the sign-in and register routes do. An admin "users" list
// returned every user's bcrypt hash (measured 2026-10-17). Read from Prisma's own
// model list, so it covers whatever the model and field are called.
const SECRET_FIELD = /^(password|passwordHash|password_hash|hashedPassword|hashed_password|passwordDigest|password_digest)$/;
function secretOmit(): Record<string, Record<string, true>> {
  const omit: Record<string, Record<string, true>> = {};
  const models = (Prisma as unknown as {
    dmmf?: { datamodel?: { models?: Array<{ name: string; fields: Array<{ name: string }> }> } };
  }).dmmf?.datamodel?.models ?? [];
  for (const model of models) {
    for (const field of model.fields) {
      if (SECRET_FIELD.test(field.name)) {
        const key = model.name.charAt(0).toLowerCase() + model.name.slice(1);
        (omit[key] ??= {})[field.name] = true;
      }
    }
  }
  return omit;
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ omit: secretOmit() } as never);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const db = prisma;
export default prisma;
