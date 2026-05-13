import { vi } from 'vitest';

vi.mock('../shared/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    story: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    refinement: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));
