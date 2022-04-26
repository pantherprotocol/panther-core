// TODO: test wrapping of cached roots around 256th and 512th inserted triads
// Start from the empty tree and then...
// 1) Insert the 1st triad with `internalInsertBatch`, save the `curRoot()` result, check the cache
// index 5 = (1 * 4) % (256 *4) + 1.
// 2) Insert the 2nd triad with `internalInsertBatch`, save the `curRoot()` request result, check the cache
// index 9 = (2 * 4) % (256 *4) + 1.
// 3) Simulate insertion of another 253 triads with `fakeNextLeafId(255 * 4)`, save `curRoot()` result,
// check the cache index 1021 = (255 * 4) % (256 *4) + 1.
// 4) Insert the 256th triad with `internalInsertBatch`, save `curRoot()` result, check the cache index
// 1 = (256 * 4) % (256 *4) + 1.
// 5) Check `isKnownRoot` returns `true` for roots saved on steps 1), 2) 3) and 4) - twice for each root,
// with the cache index 0 (i.e. "default") and the index saved on these steps.
// 6) Insert the 257th triad with `internalInsertBatch`, save the `curRoot()` result, check the cache
// index 5 = (257 * 4) % (256 *4) + 1.
// 7) Check `isKnownRoot` returns `true` for roots saved on steps 2) and 6), and `false` for the root
// after step 1) - twice for each root (with the default and saved indexes).
// 8) Insert the 258th triad with `internalInsertBatch`, save the `curRoot()` result, check the cache
// index 9 = (258 * 4) % (256 *4) + 1.
// 9) Check `isKnownRoot` returns `true` for the root after the the steps 8), and `false` for roots
// after step 1) and 2) - twice for each root (with the default and saved indexes).
// 10) Simulate insertion of another 253 triads with `fakeNextLeafId(511 * 4)`, save `curRoot()` result,
// check the cache index 1021 = (511 * 4) % (256 *4) + 1.
// 11) Insert the 512th triad with `internalInsertBatch`, save `curRoot()` result, check the cache index
// 1 = (512 * 4) % (256 *4) + 1.
// 12) Check `isKnownRoot` returns `true` for roots after steps 6), 8) and 11), but `false` for roots
// after steps 1), 2) 3) and 4) - twice for each root (with the default and saved indexes),
