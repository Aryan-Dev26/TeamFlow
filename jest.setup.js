import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Mock Redis for testing
jest.mock('ioredis', () => {
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    hget: jest.fn(),
    hset: jest.fn(),
    hgetall: jest.fn(),
    lpush: jest.fn(),
    ltrim: jest.fn(),
    lrange: jest.fn(),
    sadd: jest.fn(),
    expire: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG'),
    disconnect: jest.fn(),
    duplicate: jest.fn(() => mockRedis),
    on: jest.fn(),
  }
  
  return jest.fn(() => mockRedis)
})

// Mock Socket.IO
jest.mock('socket.io', () => ({
  Server: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    close: jest.fn(),
    adapter: jest.fn(),
    engine: {
      on: jest.fn(),
    },
    sockets: {
      sockets: new Map(),
    },
  })),
}))

// Mock Winston logger
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    simple: jest.fn(),
  },
  transports: {
    File: jest.fn(),
    Console: jest.fn(),
  },
}))

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}