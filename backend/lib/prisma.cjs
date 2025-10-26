const { PrismaClient } = require('@prisma/client');

globalThis.prisma =
  globalThis.prisma || new PrismaClient({ log: ['error', 'warn'] });

module.exports = { prisma: globalThis.prisma };