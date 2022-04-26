// TODO: test switching to a new tree
// Start from the empty tree, then ...
// 1) Check the `curTree()` - shall be 0
// 2) Simulate insertion of 16383 triads with `fakeNextLeafId(16383 * 4)`, save `curRoot()` result,
// check the cache index 1021 = (16383 * 4) % (256 *4) + 1.
// 3) Check `finalRoots(0)` is 0x00.
// 4) Insert the 16484th triad with `internalInsertBatch`.
// 5) Check the `curRoot()` result - it shall be the empty tree root with index 0.
// 6) Check the `curTree()` - shall be 1.
// 7) Check the `finalRoots(0)` - shall be as expected (the root of the tree with 16383 zero triads
// and the last non-zero triad).
// 8) Check `finalRoots(1)` is 0x00.
// 9) Repeat the steps 1-8 for switching on the new tree on the triad #98304.
