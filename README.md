# Morrowind BAIN Support

A Vortex extension for selecting numbered components in Morrowind BAIN archives.

## Build prerequisites

- Node.js 20.9.0 or newer (validated with Node.js 20.19.2 and npm 10.8.2).

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

Development uses the published `@nexusmods/vortex-api` package, pinned in
`package.json` and `package-lock.json`. The build uses TypeScript 6 and webpack 5
with bundler module resolution and ES2019 output. Stricter source typing is a
separate change.

The API package supplies type declarations and the metadata generator. The compiled
extension still imports `vortex-api` from Vortex at runtime; the API package and
its UI dependencies are not bundled into the extension.

The repository's `.npmrc` uses `legacy-peer-deps=true`, following the
[Vortex migration guide](https://github.com/Nexus-Mods/Vortex/blob/master/packages/vortex-api/docs/MIGRATION.md#if-npm-install-fails-with-eresolve)
for conflicting React peer dependencies. This installer does not use React, so it
does not install Vortex's UI packages. Node and Bluebird type declarations are
explicit development dependencies. If UI components are added later, their
development dependencies must be reviewed rather than relying on automatic peer
installation.

## License

This project's source is released under the Unlicense; see [UNLICENSE](UNLICENSE).
Third-party dependencies retain their respective licenses.
