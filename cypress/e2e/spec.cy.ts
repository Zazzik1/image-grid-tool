describe('page', () => {
    beforeEach(() => {
        cy.visit('/');
        cy.clearDownloads();
        cy.loadImage('test.jpg');
    });
    it('loads the page', () => {
        cy.get('h2').contains('Image Grid Tool');
    });
    it('load and downloads image', () => {
        cy.downloadAndMatchSnapshot('test-default.png');
    });
    it('allows to change number of rows and columns', () => {
        cy.updateNumberInputWithLabel('Number of rows', 10);
        cy.updateNumberInputWithLabel('Number of columns', 3);
        cy.downloadAndMatchSnapshot('test-10x3.png');
    });
    it('rotates image - left', () => {
        const button = cy.get('button[data-test-name="rotate-left"]');
        button.click();
        cy.downloadAndMatchSnapshot('test-left.png');
        cy.clearDownloads();
        button.click();
        cy.downloadAndMatchSnapshot('test-upside-down.png');
        cy.clearDownloads();
        button.click();
        cy.downloadAndMatchSnapshot('test-right.png');
        cy.clearDownloads();
        button.click();
        cy.downloadAndMatchSnapshot('test-default.png');
    });
    it('rotates image - right', () => {
        const button = cy.get('button[data-test-name="rotate-right"]');
        button.click();
        cy.downloadAndMatchSnapshot('test-right.png');
        cy.clearDownloads();
        button.click();
        cy.downloadAndMatchSnapshot('test-upside-down.png');
        button.click();
        cy.clearDownloads();
        cy.downloadAndMatchSnapshot('test-left.png');
        cy.clearDownloads();
        button.click();
        cy.downloadAndMatchSnapshot('test-default.png');
    });
    it('allows to change line thickness', () => {
        cy.updateNumberInputWithLabel('Line thickness', 10);
        cy.downloadAndMatchSnapshot('test-line-thickness-10.png');
    });
    it('double grid button works as expected', () => {
        cy.get('[data-test-name="double-grid"]').click();
        cy.downloadAndMatchSnapshot('test-double-grid.png');
    });
    it('halve grid button works as expected', () => {
        cy.get('[data-test-name="halve-grid"]').click();
        cy.downloadAndMatchSnapshot('test-halve-grid.png');
    });
    it('increase grid button works as expected when cell aspect ratio is 1:1', () => {
        cy.get('[data-test-name="cell-aspect-ratio"]').should(
            'have.text',
            '1:1',
        );
        cy.get('[data-test-name="increase-grid"]').click();
        cy.downloadAndMatchSnapshot('test-increase-grid.png');
    });
    it('decrease grid button works as expected when cell aspect ratio is 1:1', () => {
        cy.get('[data-test-name="cell-aspect-ratio"]').should(
            'have.text',
            '1:1',
        );
        cy.get('[data-test-name="decrease-grid"]').click();
        cy.downloadAndMatchSnapshot('test-decrease-grid.png');
    });
    it('increase grid button does not change the cell aspect ratio when ratio is not 1:1', () => {
        const ratioEl = cy.get('[data-test-name="cell-aspect-ratio"]');
        const increaseButton = cy.get('[data-test-name="increase-grid"]');
        const decreaseButton = cy.get('[data-test-name="decrease-grid"]');

        cy.wait(200);

        cy.updateNumberInputWithLabel('Number of rows', 5);
        cy.updateNumberInputWithLabel('Number of columns', 7);

        ratioEl.should('have.text', '10:21');

        for (let i = 0; i < 10; i++) {
            increaseButton.click();
            cy.wait(100);
            ratioEl.should('have.text', '10:21');
        }

        for (let i = 0; i < 10; i++) {
            decreaseButton.click();
            cy.wait(100);
            ratioEl.should('have.text', '10:21');
        }
    });
});

// tests disabled in CI (antialiasing issue):
const isCI = Cypress.env('CI');

(isCI ? describe.skip : describe)('page - skipped in CI', () => {
    beforeEach(() => {
        cy.visit('/');
        cy.clearDownloads();
        cy.loadImage('test.jpg');
    });
    it('renders diagonals', () => {
        cy.get('label').contains('Add diagonals?').click();
        cy.downloadAndMatchSnapshot('test-diagonals.png');
    });
    it('adds cell ids', () => {
        cy.get('label').contains('Add cell ids?').click();
        cy.downloadAndMatchSnapshot('test-cell-ids.png');
    });
});
