# Dapp E2E Testing

For e2e testing we are using [Synpress](https://github.com/Synthetixio/synpress). It is e2e testing
framework based on [Cypress](https://www.cypress.io/) and [playwright](https://playwright.dev/) with support for metamask.

# Run tests

All dApp E2E tests are located in `dapp/cypress/`

To be able to run the tests you must have the environment variables listed below.

| Env. Variable  | Description                                                                                |
| -------------- | ------------------------------------------------------------------------------------------ |
| `SECRET_WORDS` | **Space seperated** words for the mnemonic of a testing wallet (e.g. `test test test ...`) |
| `NETWORK_NAME` | The name of the network the tests will run on (e.g. `Mumbai`)                              |
| `CHAIN_ID`     | The chain ID (e.g `80001`)                                                                 |
| `RPC_URL`      | RPC for the network (e.g. `https://matic-mumbai.chainstacklabs.com`)                       |
| `SYMBOL`       | The token symbol for the default network token (e.g. `MATIC`)                              |
| `IS_TESTNET`   | `boolean`                                                                                  |

Make sure the dApp UI runs on `http://localhost:3000` by running `yarn start` in a separate terminal.

Run all tests using `yarn synpress:run`

To run specific files or directory `yarn synpress:run --spec <PATH OR GLOB>`

Example: `yarn synpress:run --spec cypress/e2e/stake.cy.ts`

# Writing and Organizing Tests

We are using the folder structure suggested by [Cypress](https://docs.cypress.io/guides/core-concepts/writing-and-organizing-tests)

- Test files should end by `<file_name>.cy.ts`
- Fixtures (testing data like JSON files) are located in `cypress/fixtures`
- Screenshots are located in `cypress/screenshots`
- Videos are located in `cypress/videos`
- Support/Commands are located in `cypress/support`
  - All new commands must be imported to `cypress/support/e2e.ts` file to take effect (entry point)
