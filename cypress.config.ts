import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      console.log(on);
      console.log(config);
      // implement node event listeners here
    },
  },
});
