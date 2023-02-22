declare namespace Cypress {
    interface Chainable<Subject = any> {
        connectWallet(): Chainable<Subject>;
    }
}
