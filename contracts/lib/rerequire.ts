import path from 'path';

// rerequire deletes the module from the cache and re-imports it.
// intended to use in the node and hardhat console
// IMPORTANT: it only works for importing files (not npm modules) due
// to the way how the path to the files is resolved.
export function rerequire(moduleName: string): NodeModule {
    const fullPath = path.join(process.cwd(), moduleName);
    if (require.resolve(fullPath) && require.cache[require.resolve(fullPath)]) {
        delete require.cache[require.resolve(fullPath)];
    }

    return require(fullPath);
}
