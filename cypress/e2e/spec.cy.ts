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
