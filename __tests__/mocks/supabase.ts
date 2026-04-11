import type { Database } from '@/lib/supabase/database.types'

type Tables = Database['public']['Tables']

/**
 * Creates a mock Supabase client for unit testing.
 * Each call returns a builder that records the chain and resolves with mockData/mockError.
 */
export function createMockSupabaseClient() {
  let mockData: unknown = null
  let mockError: { message: string; code?: string } | null = null

  const resolveValue = () => Promise.resolve({ data: mockData, error: mockError })

  const builder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockImplementation(resolveValue),
    maybeSingle: jest.fn().mockImplementation(resolveValue),
    then: jest.fn().mockImplementation((resolve: (v: unknown) => void) =>
      resolveValue().then(resolve)
    ),
  }

  // Make builder thenable (so `await supabase.from(...).select(...)` works)
  builder.select.mockReturnValue(builder)
  builder.insert.mockReturnValue(builder)
  builder.update.mockReturnValue(builder)
  builder.delete.mockReturnValue(builder)
  builder.upsert.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  builder.neq.mockReturnValue(builder)
  builder.gt.mockReturnValue(builder)
  builder.gte.mockReturnValue(builder)
  builder.lt.mockReturnValue(builder)
  builder.lte.mockReturnValue(builder)
  builder.order.mockReturnValue(builder)
  builder.limit.mockReturnValue(builder)

  const client = {
    from: jest.fn().mockReturnValue(builder),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    _builder: builder,
    _setMockData: (data: unknown) => { mockData = data; mockError = null },
    _setMockError: (message: string, code?: string) => { mockData = null; mockError = { message, code } },
    _reset: () => { mockData = null; mockError = null },
  }

  return client
}

export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>
