function configureTool(config: {
    logTransform?: {
        enabled: boolean;
    };
    duplicate?: {
        enabled: boolean;
        duplicates: number;
    };
    scaleAndRotate?: {
        enabled: boolean;
        re: number;
        im: number;
    };
    deduplicate?: {
        enabled: boolean;
        duplicates: number;
    };
    expTransform?: {
        enabled: boolean;
    };
}) {
    if (config.logTransform) {
        cy.get(
            '[data-test-name="log-transform-tool-log-transform-subtool"]',
        ).setCheckbox(config.logTransform.enabled);
    }
    if (config.duplicate) {
        cy.get(
            '[data-test-name="log-transform-tool-duplicate-image-subtool"]',
        ).setCheckbox(config.duplicate.enabled);
        if (config.duplicate.enabled)
            cy.get(
                '[data-test-name="log-transform-tool-duplicate-image-subtool-duplicates-input"]',
            )
                .focus()
                .type(`{selectAll}${config.duplicate.duplicates}`, {
                    delay: 50,
                })
                .blur();
    }
    if (config.scaleAndRotate) {
        cy.get(
            '[data-test-name="log-transform-tool-scale-and-rotate-subtool"]',
        ).setCheckbox(config.scaleAndRotate.enabled);
        if (config.scaleAndRotate.enabled) {
            cy.get(
                '[data-test-name="log-transform-tool-scale-and-rotate-subtool-re-input"]',
            )
                .focus()
                .type(`{selectAll}${config.scaleAndRotate.re}`, { delay: 50 })
                .blur();
            cy.get(
                '[data-test-name="log-transform-tool-scale-and-rotate-subtool-im-input"]',
            )
                .focus()
                .type(`{selectAll}${config.scaleAndRotate.im}`, { delay: 50 })
                .blur();
        }
    }
    if (config.deduplicate) {
        cy.get(
            '[data-test-name="log-transform-tool-deduplicate-image-subtool"]',
        ).setCheckbox(config.deduplicate.enabled);
        if (config.deduplicate.enabled)
            cy.get(
                '[data-test-name="log-transform-tool-deduplicate-image-subtool-duplicates-input"]',
            )
                .focus()
                .type(`{selectAll}${config.deduplicate.duplicates}`, {
                    delay: 50,
                })
                .blur();
    }
    if (config.expTransform) {
        cy.get(
            '[data-test-name="log-transform-tool-exponential-transform-subtool"]',
        ).setCheckbox(config.expTransform.enabled);
    }
}

function openTool() {
    cy.get('[data-test-name="log-transform-tool-open"]').click();
}

function cancelTool() {
    cy.get('[data-test-name="log-transform-tool-close"]').click();
}

function saveTool() {
    cy.get('[data-test-name="log-transform-tool-save"]').click();
}

describe('transformation tool', () => {
    beforeEach(() => {
        cy.visit('/');
        cy.clearDownloads();
        cy.loadImage('test.jpg');
        openTool();
    });
    it('has all subtools enabled by default', () => {
        const tools = [
            'log-transform',
            'duplicate-image',
            'scale-and-rotate',
            'deduplicate-image',
            'exponential-transform',
        ];
        for (const tool of tools) {
            cy.get(
                `[data-test-name="log-transform-tool-${tool}-subtool"]`,
            ).contains('Enabled');
        }
    });
    it('can be closed without applying changes', () => {
        cancelTool();
        cy.downloadAndMatchSnapshot('test-default.png');
    });
    it('returns the same image if all subtools are disabled', () => {
        // disable all subtools:
        configureTool({
            logTransform: { enabled: false },
            duplicate: { enabled: false, duplicates: 3 },
            scaleAndRotate: { enabled: false, re: 0.4, im: 0.7 },
            deduplicate: { enabled: false, duplicates: 3 },
            expTransform: { enabled: false },
        });
        saveTool();
        cy.downloadAndMatchSnapshot('test-default.png');
    });
    it('returns the same but "cropped" image if re=1, im=0 - all effects combine', () => {
        configureTool({
            logTransform: { enabled: true },
            duplicate: { enabled: true, duplicates: 3 },
            scaleAndRotate: { enabled: true, re: 1, im: 0 },
            deduplicate: { enabled: true, duplicates: 3 },
            expTransform: { enabled: true },
        });
        saveTool();
        cy.downloadAndMatchSnapshot(
            'test-transform-tool-all-dupl3-re1-im0.png',
        );
    });
    it('works with default settings', () => {
        saveTool();
        cy.downloadAndMatchSnapshot('test-transform-tool-default.png');
    });
    it('complex logarithmic transform subtool works as expected', () => {
        configureTool({
            logTransform: { enabled: true },
            duplicate: { enabled: false, duplicates: 3 },
            scaleAndRotate: { enabled: false, re: 0.4, im: 0.7 },
            deduplicate: { enabled: false, duplicates: 3 },
            expTransform: { enabled: false },
        });
        saveTool();
        cy.downloadAndMatchSnapshot('test-transform-tool-log-subtool.png');
    });
    it('duplicate image subtool works as expected', () => {
        configureTool({
            logTransform: { enabled: false },
            duplicate: { enabled: true, duplicates: 3 },
            scaleAndRotate: { enabled: false, re: 0.4, im: 0.7 },
            deduplicate: { enabled: false, duplicates: 3 },
            expTransform: { enabled: false },
        });
        saveTool();
        cy.downloadAndMatchSnapshot('test-transform-tool-dupl3-subtool.png');
    });
    it('scale and rotate subtool works as expected', () => {
        configureTool({
            logTransform: { enabled: false },
            duplicate: { enabled: false, duplicates: 3 },
            scaleAndRotate: { enabled: true, re: 0.4, im: 0.7 },
            deduplicate: { enabled: false, duplicates: 3 },
            expTransform: { enabled: false },
        });
        saveTool();
        cy.downloadAndMatchSnapshot(
            'test-transform-tool-scale-rotate-subtool-re04-im07.png',
        );
    });
    it('deduplicate image subtool works as expected', () => {
        configureTool({
            logTransform: { enabled: false },
            duplicate: { enabled: false, duplicates: 3 },
            scaleAndRotate: { enabled: false, re: 0.4, im: 0.7 },
            deduplicate: { enabled: true, duplicates: 2 },
            expTransform: { enabled: false },
        });
        saveTool();
        cy.downloadAndMatchSnapshot('test-transform-tool-dedupl2-subtool.png');
    });
    it('exponential transform subtool works as expected', () => {
        configureTool({
            logTransform: { enabled: false },
            duplicate: { enabled: false, duplicates: 3 },
            scaleAndRotate: { enabled: false, re: 0.4, im: 0.7 },
            deduplicate: { enabled: false, duplicates: 3 },
            expTransform: { enabled: true },
        });
        saveTool();
        cy.downloadAndMatchSnapshot('test-transform-tool-exp-subtool.png');
    });
});
