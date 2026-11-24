module.exports = {
  // jest-expo (SDK 56+) ships its own native test environment that handles
  // Expo's lazily-installed globals, so do not override testEnvironment.
  preset: "jest-expo",
  moduleNameMapper: {
    "\\.css$": "<rootDir>/__mocks__/fileMock.js",
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
};
