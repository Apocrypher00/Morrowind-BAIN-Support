import { statSync, createWriteStream, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import { ZipFile } from 'yazl';

const pipe = promisify(pipeline);
const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const packageInfo = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
const distPath = join(projectRoot, 'dist');
const archivePath = join(distPath, packageInfo.name + '-' + packageInfo.version + '.zip');

async function main() {
    const files = ['index.js', 'info.json'];
    for (const file of files) {
        const source = join(distPath, file);
        if (!statSync(source).isFile()) {
            throw new Error('Missing build output: ' + source);
        }
    }

    const zip = new ZipFile();
    zip.on('error', error => zip.outputStream.destroy(error));
    for (const file of files) {
        zip.addFile(join(distPath, file), file);
    }

    const completed = pipe(zip.outputStream, createWriteStream(archivePath));
    zip.end();
    await completed;
    console.log('Created ' + archivePath);
}

main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
});
