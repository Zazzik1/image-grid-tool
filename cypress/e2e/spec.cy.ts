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
    it('renders diagonals', () => {
        cy.get('label').contains('Add diagonals?').click();
        cy.downloadAndMatchSnapshot('test-diagonals.png');
    });
    it('adds cell ids', () => {
        cy.get('label').contains('Add cell ids?').click();
        cy.downloadAndMatchSnapshot('test-cell-ids.png');
    });
    it('allows to change number of rows and columns', () => {
        cy.get('label')
            .contains('Number of rows')
            .parent()
            .within(() => {
                cy.get('input[data-scope="number-input"]')
                    .focus()
                    .type('{selectAll}10', { delay: 50 })
                    .blur();
            });
        cy.get('label')
            .contains('Number of columns')
            .parent()
            .within(() => {
                cy.get('input[data-scope="number-input"]')
                    .focus()
                    .type('{selectAll}3', { delay: 50 })
                    .blur();
            });
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
        cy.get('label')
            .contains('Line thickness')
            .parent()
            .within(() => {
                cy.get('input[data-scope="number-input"]')
                    .focus()
                    .type('{selectAll}10', { delay: 50 })
                    .blur();
            });
        cy.downloadAndMatchSnapshot('test-line-thickness-10.png');
    });
});
