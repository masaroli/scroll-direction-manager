module.exports = {
  preset: "ts-jest",
  testEnvironment: "jest-environment-jsdom", // <-- Change this line
  testMatch: ["**/__tests__/**/*.ts?(x)", "**/?(*.)+(spec|test).ts?(x)"],
  collectCoverageFrom: ["src/**/*.{js,ts}"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
};
