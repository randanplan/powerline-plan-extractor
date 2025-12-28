// jest.setup.js

// Mock localStorage to prevent errors with pdfjs-dist in a Node.js test environment.
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(global, 'localStorage', { value: localStorageMock });
Object.defineProperty(global, 'sessionStorage', { value: localStorageMock });

// Also mock Worker if necessary, though pdfjs-dist might handle it internally
// or if not, it will fail later.
// global.Worker = class {
//   constructor(stringUrl: string) {
//     return {
//       postMessage: () => {},
//       terminate: () => {},
//     };
//   }
// };
