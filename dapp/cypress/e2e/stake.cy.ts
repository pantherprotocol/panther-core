describe('Staking', () => {
    it('Should be able to stake 100ZKP', () => {
        cy.visit('http://localhost:3000');
        cy.connectWallet();

        cy.get('[data-testid="input-item"]').type('100');
        cy.get('.expected-rewards-card-content').contains('0.19 zZKP');
        cy.get('.expected-rewards-card-content').contains('0 PRP');
        cy.get('.buttons-holder button').contains('STAKE 100.00 ZKP').click();

        cy.switchToMetamaskNotification();
        cy.confirmMetamaskSignatureRequest();
        cy.switchToCypressWindow();

        cy.switchToMetamaskNotification();
        cy.confirmMetamaskDataSignatureRequest();
        cy.switchToCypressWindow();

        cy.switchToMetamaskNotification();
        cy.confirmMetamaskTransaction();
        cy.switchToCypressWindow();
    });
});

export {};
