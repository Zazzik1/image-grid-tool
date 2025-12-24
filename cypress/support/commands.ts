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
            updateNumberInputWithLabel(label: string, value: number): Chainable;
        }
    }
}

Cypress.Commands.add('loadImage', (name: string) => {
    cy.get('input[type="file"][data-test-name="upload-file-input"]').selectFile(
        `cypress/fixtures/${name}`,
        { force: true },
    );
});

Cypress.Commands.add(
    'downloadAndMatchSnapshot',
    (snapshotName: string, downloadName: string = 'test-GRID.png') => {
        cy.get('[data-test-name="canvas-spinner"]', { timeout: 15000 }).should(
            'not.exist',
        );
        cy.get('button').contains('Export').click();

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

Cypress.Commands.add(
    'updateNumberInputWithLabel',
    (label: string, value: number) => {
        cy.get('label')
            .contains(label)
            .parent()
            .within(() => {
                cy.get('input[data-scope="number-input"]')
                    .focus()
                    .type(`{selectAll}${value}`, { delay: 50 })
                    .blur();
            });
    },
);

export {};
