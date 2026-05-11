/** @type {import("ts-jest").JestConfigWithTsJest} */
module.exports = {
  displayName: "unit-node",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        diagnostics: { ignoreCodes: [1343] },
        tsconfig: "./tsconfig.jest.json",
        astTransformers: {
          before: [
            {
              path: "node_modules/ts-jest-mock-import-meta",
              options: {
                metaObjectReplacement: {
                  env: {
                    VITE_APP_BASE_URL:
                      "https://conector-portal-investidor-dev.afinz.com.br",
                  },
                },
              },
            },
          ],
        },
      },
    ],
  },
  testMatch: ["**/*.spec.ts"],
  collectCoverageFrom: ["<rootDir>/src/**/*.ts", "!**/*.d.ts"],
  extensionsToTreatAsEsm: [".ts", ".tsx"],
};
