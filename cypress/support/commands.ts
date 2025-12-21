/// <reference types="cypress" />

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            loadImage(name: string): Chainable;
            downloadAndMatchSnapshot(
                snapshotName: string,
                downloadName?: string,
            ): Chainable;
            clearDownloads(): Chainable;
        }
    }
}

Cypress.Commands.add('loadImage', (name: string) => {
    cy.get('[data-scope="file-upload"]')
        .contains('Load image')
        .parent()
        .get('input[type="file"]')
        .selectFile(`cypress/fixtures/${name}`, { force: true });
});

Cypress.Commands.add(
    'downloadAndMatchSnapshot',
    (snapshotName: string, downloadName: string = 'test-grid.png') => {
        cy.wait(100); // TODO: wait until login spinner disappears
        cy.get('button').contains('Download image with grid').click();

        // wait until files exist
        cy.readFile(`cypress/downloads/${downloadName}`, 'binary', {
            timeout: 15000,
        });
        cy.readFile(`cypress/snapshots/${snapshotName}`, 'binary', {
            timeout: 15000,
        });

        cy.task('compareFiles', {
            actual: `cypress/downloads/${downloadName}`,
            expected: `cypress/snapshots/${snapshotName}`,
        }).should('eq', true);
    },
);

Cypress.Commands.add('clearDownloads', () => {
    cy.task('clearDownloads');
});
export {};
