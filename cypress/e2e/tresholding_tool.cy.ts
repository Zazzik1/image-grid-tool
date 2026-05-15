describe('Tresholding tool', () => {
    beforeEach(() => {
        cy.visit('/');
        cy.clearDownloads();
        cy.loadImage('test.jpg');
        cy.get('[data-test-name="tresholding-tool-open"]').click();
        cy.wait(100);
    });
    it('can be closed without applying changes', () => {
        cy.get('[data-test-name="tresholding-tool-close"]').click();
        cy.downloadAndMatchSnapshot('test-default.png');
    });
    it('works with default settings', () => {
        cy.get('[data-test-name="tresholding-tool-save"]').click();
        cy.downloadAndMatchSnapshot('test-treshold-default-settings.png');
    });
    it('works with updated tresholds', () => {
        cy.get('[data-scope="slider"][data-part="thumb"]:first')
            .focus()
            .type('{rightarrow}{rightarrow}{rightarrow}');
        cy.get('[data-scope="slider"][data-part="thumb"]:last')
            .focus()
            .type('{rightarrow}{rightarrow}{rightarrow}');
        cy.get('[data-test-name="tresholding-tool-save"]').click();
        cy.downloadAndMatchSnapshot('test-treshold-updated-tresholds.png');
    });
});
