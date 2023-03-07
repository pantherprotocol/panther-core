/// <reference types="cypress" />

Cypress.Commands.add('connectWallet', () => {
    cy.contains('Connect Wallet').click();
    cy.switchToMetamaskNotification();
    cy.acceptMetamaskAccess().should('be.true');
    cy.contains('Continue').click();
    cy.switchToCypressWindow();
});

export {};
