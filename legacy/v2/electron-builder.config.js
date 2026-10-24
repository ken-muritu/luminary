/**
 * @type {import('electron-builder').Configuration}
 *
 * Before running `npm run dist`, ensure icons exist:
 *   node scripts/generate-icons.cjs
 */
module.exports = {
  appId: 'ai.muritu.luminary',
  productName: 'Luminary',
  copyright: 'Copyright © 2026 Kennedy Muritu. All Rights Reserved.',

  directories: {
    output: 'dist-electron',
    buildResources: 'build',
  },

  // App code + production deps from root package.json (electron-builder bundles them automatically)
  files: [
    'index.js',
    'apps/main/dist/**/*',
    'apps/main/assets/bible/*.json',
    'apps/renderer/dist/**/*',
    'package.json',
  ],

  asar: true,
  asarUnpack: [
    '**/*.node',
    'node_modules/sharp/**/*',
    'node_modules/@img/**/*',
    'node_modules/@libsql/linux-x64-gnu/**/*',
    'node_modules/@libsql/linux-x64-musl/**/*',
  ],

  win: {
    target: [{ target: 'portable', arch: ['x64'] }],
    icon: 'build/icon.ico',
    artifactName: 'Luminary-${version}-${arch}.exe',
    signAndEditExecutable: false,
    verifyUpdateCodeSignature: false,
  },

  linux: {
    target: [
      { target: 'AppImage', arch: ['x64'] },
      { target: 'dir', arch: ['x64'] },
    ],
    icon: 'build/icon.png',
    artifactName: 'Luminary-${version}.AppImage',
    category: 'AudioVideo;Presentation;',
  },

  electronDist: 'node_modules/electron/dist',
}
