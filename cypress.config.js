import { defineConfig } from 'cypress';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PNG from 'pngjs';
import pixelmatch from 'pixelmatch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:5173/image-grid-tool',
        setupNodeEvents(on) {
            on('task', {
                compareFiles({ actual, expected }) {
                    const img1 = PNG.PNG.sync.read(fs.readFileSync(expected));
                    const img2 = PNG.PNG.sync.read(fs.readFileSync(actual));

                    const { width, height } = img1;
                    const diffImg = new PNG.PNG({ width, height });

                    const diffPixels = pixelmatch(
                        img1.data,
                        img2.data,
                        diffImg.data,
                        width,
                        height,
                        {
                            threshold: 0.1,
                        },
                    );

                    return diffPixels === 0;
                },
                clearDownloads() {
                    const downloadsDir = path.join(
                        __dirname,
                        'cypress',
                        'downloads',
                    );

                    if (fs.existsSync(downloadsDir)) {
                        fs.rmSync(downloadsDir, {
                            recursive: true,
                            force: true,
                        });
                    }

                    fs.mkdirSync(downloadsDir, { recursive: true });

                    return null;
                },
            });
        },
    },
});
