// import micromatch from 'micromatch';
import {ESLint} from 'eslint';

const removeIgnoredFiles = async (prefix, cfgFile, ignorePath, files) => {
    const eslint = new ESLint({
        overrideConfigFile: cfgFile,
        ignorePath,
    });
    // console.log(eslint.calculateConfigForFile(files[0]));
    const isIgnored = await Promise.all(
        files.map(file => {
            if (!file.startsWith(prefix)) {
                console.error(
                    `ERROR in .lintstagedrc.mjs: ${file} doesn't start with ${prefix}`,
                );
            }
            const f = file.slice(prefix.length);
            return eslint.isPathIgnored(f);
        }),
    );
    const filteredFiles = files.filter((_, i) => !isIgnored[i]);
    // const ignoredFiles = files.filter((_, i) => isIgnored[i]);
    // console.log('Ignored files:', ignoredFiles);
    return filteredFiles;
};

const run = (command, files) => {
    if (files.length === 0) {
        return `echo "Skipping; no files to run ${command}"`;
    }
    const cmd = `${command} ${files.join(' ')}`;
    return cmd;
};

const fullPathToContractsWorkspaceRelativePath = path => {
    const contractsWorkspacePath = process.cwd() + '/contracts/';
    return path.replace(contractsWorkspacePath, '');
};

export default {
    '*': files => {
        return run('prettier --write', files);
    },
    'contracts/**/*.sol': files => {
        return run(
            'yarn workspace @panther-core/contracts lint:solhint',
            files.map(fullPathToContractsWorkspaceRelativePath),
        );
    },
    'contracts/**/*.{js,ts}': async files => {
        const prefix = process.cwd() + '/contracts/';
        const toLint = await removeIgnoredFiles(
            prefix,
            'contracts/.eslintrc.json',
            'contracts/.eslintignore',
            files,
        );
        // const match = micromatch.not(files, '**/*.cli.js');
        return run(
            'yarn workspace @panther-core/contracts lint:eslint',
            toLint,
        );
    },
    'dapp/**/*.{js,jsx,ts,tsx}': async files => {
        const prefix = process.cwd() + '/dapp/';
        const toLint = await removeIgnoredFiles(
            prefix,
            'dapp/.eslintrc.json',
            'dapp/.eslintignore',
            files,
        );
        return run('yarn workspace @panther-core/dapp lint:eslint', toLint);
    },
};
