# Morrowind BAIN Support

A Vortex extension for selecting numbered components in Morrowind BAIN archives.

## Build prerequisites

- Node.js 20.9.0 or newer (validated with Node.js 20.19.2 and npm 10.8.2).
- Git, required to download the pinned Vortex API development dependency.

Vortex source code is not required. The installed Vortex application supplies
`vortex-api` when running the extension.

## Build and package

From the repository root:

```shell
npm ci
npm run package
```

This checks TypeScript, builds the JavaScript, generates metadata, and creates
`dist/morrowind-bain-support-1.1.0.zip`. The filename follows the version in
`package.json`. The ZIP contains `index.js` and `info.json` at its root.
Install the ZIP from Vortex's Extensions page and restart Vortex if prompted.

Individual commands:

- `npm run typecheck`: check source without generating files.
- `npm run build`: check source and generate the extension files in `dist/`.
- `npm run package`: build and create the installation ZIP.

Commit source, configuration, packaging scripts, and `package-lock.json`.
Dependencies and generated build output are excluded from Git.

## Installer behavior

The installer recognizes Morrowind archives with top-level component folders
starting with two digits and whitespace. It installs files from selected folders,
removing the component-folder prefix. Root files and unselected folders are ignored.
Canceling or selecting no folders cancels installation.

## Development scope

The Vortex API remains pinned to the previously used commit. The build uses
TypeScript 6 and webpack 5, while preserving the existing TypeScript checking
settings and ES2019 output target. Stricter source typing and migration to a newer
Vortex API are separate changes.

## License

This project's source is released under the Unlicense; see [UNLICENSE](UNLICENSE).
Third-party dependencies retain their respective licenses.
