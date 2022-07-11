// Teach the VM how to serialize BigInts, to stop Redux barfing when we
// dispatch with keys as arguments.
//
// See:
//   https://github.com/GoogleChromeLabs/jsbi/issues/30
//   https://stackoverflow.com/questions/65152373/typescript-serialize-bigint-in-json
//   https://github.com/facebook/react/pull/17233
//   https://github.com/facebook/react/commit/5235d193d70d2623c98788ccb8dffc1d5abd688d

// eslint-disable-next-line @typescript-eslint/no-redeclare, @typescript-eslint/no-unused-vars
interface BigInt {
    /** Convert to BigInt to string form in JSON.stringify */
    toJSON: () => string;
}
BigInt.prototype.toJSON = function () {
    return this.toString();
};
