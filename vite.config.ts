import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    plugins: [
        react(),
        electron([
            {
                entry: 'electron/main.ts',
                vite: {
                    build: {
                        outDir: 'dist-electron',
                        rollupOptions: {
                            external: ['electron', 'better-sqlite3'],
                            output: {
                                format: 'es',
                                entryFileNames: '[name].mjs',
                            },
                        },
                        minify: false,
                        sourcemap: false,
                    },
                },
            },
        ]),
        {
            name: 'copy-preload',
            buildStart() {
                this.addWatchFile('electron/preload.js');
            },
            generateBundle() {
                // Copy preload.js to preload.cjs after build
                const sourceFile = path.resolve(
                    __dirname,
                    'electron/preload.js',
                );
                const destFile = path.resolve(
                    __dirname,
                    'dist-electron/preload.cjs',
                );
                fs.copyFileSync(sourceFile, destFile);
            },
        },
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
    },
});
