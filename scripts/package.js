const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');
const { promisify } = require('util');
const yazl = require('yazl');

const pipe = promisify(pipeline);
const projectRoot = path.resolve(__dirname, '..');
const packageInfo = require(path.join(projectRoot, 'package.json'));
const distPath = path.join(projectRoot, 'dist');
const archivePath = path.join(distPath, packageInfo.name + '-' + packageInfo.version + '.zip');

async function main() {
    const files = ['index.js', 'info.json'];
    for (const file of files) {
        const source = path.join(distPath, file);
        if (!fs.statSync(source).isFile()) {
            throw new Error('Missing build output: ' + source);
        }
    }

    const zip = new yazl.ZipFile();
    zip.on('error', error => zip.outputStream.destroy(error));
    for (const file of files) {
        zip.addFile(path.join(distPath, file), file);
    }

    const completed = pipe(zip.outputStream, fs.createWriteStream(archivePath));
    zip.end();
    await completed;
    console.log('Created ' + archivePath);
}

main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
});
