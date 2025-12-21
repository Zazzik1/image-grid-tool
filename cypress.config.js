import { defineConfig } from 'cypress';
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

function hashFile(path) {
    const buffer = fs.readFileSync(path);
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:5173/image-grid-tool',
        setupNodeEvents(on) {
            on('task', {
                compareFiles({ actual, expected }) {
                    const actualHash = hashFile(actual);
                    const expectedHash = hashFile(expected);

                    return actualHash === expectedHash;
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
