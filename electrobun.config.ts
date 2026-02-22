import type { ElectrobunConfig } from 'electrobun';

export default {
    app: {
        name: 'DevLog',
        identifier: 'com.devlog.app',
        version: '1.0.0',
    },
    runtime: {
        exitOnLastWindowClosed: false,
    },
    build: {
        bun: {
            entrypoint: 'src/bun/index.ts',
        },
        copy: {
            'dist/index.html': 'views/main/index.html',
            'dist/assets/': 'views/main/assets/',
            'dist/favicon.png': 'views/main/favicon.png',
            'dist/logo.png': 'views/main/logo.png',
        },
        mac: {
            icons: 'icon.iconset',
        },
    },
} satisfies ElectrobunConfig;
