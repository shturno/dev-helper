// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: {},
      asPath: '',
      push: jest.fn(),
      replace: jest.fn(),
    }
  },
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  usePathname() {
    return ''
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession() {
    return { data: null, status: 'unauthenticated' }
  },
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: require('react').forwardRef((props, ref) => (
      <div ref={ref} {...props} />
    )),
    // Add other motion components as needed
  },
  AnimatePresence: ({ children }) => children,
}))

// Global fetch mock
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
    status: 200,
  })
)

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
}) 