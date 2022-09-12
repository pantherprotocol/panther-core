This folder (files [EIP173Proxy.sol](./EIP173Proxy.sol) and [Proxy.sol](./Proxy.sol)) contains the original code of the default [proxy](https://github.com/wighawag/hardhat-deploy/blob/master/solc_0.8/proxy/EIP173Proxy.sol) used by the `hardhat-deploy` plugin.\
See the [license](https://github.com/wighawag/hardhat-deploy/blob/master/LICENSE).

The bytecode the `hardhat-deploy` plugin _(v.0.11.4)_ uses is compiled with the following params:

```
// refer to `hardhat-deploy/extendedArtifacts/EIP173Proxy.json`
"compiler": {
    "version":"0.8.10+commit.fc410830"
}
...
"optimizer": {
      "enabled": true,
      "runs": 999999
}
```
