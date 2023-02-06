# IPFS Deployment Script

The script is designed to deploy the content of the build directory to the IPFS node. It can deploy whatever build (prod, dev, test, staging) to whatever IPFS node (local, custom, Infura).

It can be run from the GitLab CI/CD and interact with GitLab API to make comments with the build links on IPFS. It will create a link every time the CI runs.

The script can be used in couple of different ways.

1. [Deploy to local IPFS node with default settings](#deploy-to-local-ipfs-node-with-default-settings)
2. [Deploy to custom IPFS node](#deploy-to-custom-ipfs-node)
3. [Deploy to Infura node](#deploy-to-infura-ipfs-node)
4. [Deploy to IPFS from CI/CD](#deploy-to-ipfs-from-cicd)
5. [Unpin ipfs content when MR is closed](#unpin-ipfs-content)

## Deploy To local IPFS node with default settings

By default, the local IPFS node is running on port **5001** with **HTTP**. The script can deploy to IPFS node with the default settings below

```json
{
    "host": "127.0.0.1",
    "port": 5001,
    "protocol": "http"
}
```

To deploy to local node, you need to pass the `--local-default` flag.

```bash
$ yarn ts-node scripts/deploy-ipfs.ts --local-default
```

## Deploy to custom IPFS node

If you changed the local IPFS settings or want to deploy to a remote IPFS node. Both cases are the same and you need to provide the node info as environmental variables. `IPFS_HOST`, `IPFS_PORT`, and `IPFS_PROTOCOL`. Note that the protocol can only be `http` or `https`.

| Variable        | Description                                                           |
| --------------- | --------------------------------------------------------------------- |
| `IPFS_HOST`     | The IP address for the IPFS node (e.g. `ipfs.infura.io`, `127.0.0.1`) |
| `IPFS_PORT`     | The port of the IPFS node (e.g. 5001)                                 |
| `IPFS_PROTOCOL` | The protocol that IPFS node running at. Can be `http` or `https`      |

To deploy to local node, you need to pass the `--custom` flag.

```bash
$ yarn ts-node scripts/deploy-ipfs.ts --custom
```

## Deploy to Infura IPFS node

If you have an Infura node and want to deploy to it you need to provide both the Project ID and Project Secret.

To get an infura node go to [infura.io/ipfs](https://www.infura.io/product/ipfs).

| Variable                   | Description                                                 |
| -------------------------- | ----------------------------------------------------------- |
| `INFURA_PROJECT_ID`        | Project Id provided by Infura.                              |
| `INFURA_PROJECT_SECRET_ID` | Project Secret provided by Infura. **Should never shared**. |

To deploy to local node, you need to pass the `--custom` flag.

```bash
$ yarn ts-node scripts/deploy-ipfs.ts --custom
```

## Deploy to IPFS from CI/CD

When running the script from the CI/CD the environment variables below must exist.
All of them are provided by GitLab out of the box expect for the `GITLAB_ACCESS_TOKEN` variable.

| Variable               | Description                                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `GITLAB_ACCESS_TOKEN`  | GitLab access token. Used to make GitLab comments (get [one](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html)) |
| `CI_COMMIT_SHORT_SHA`  | A short version of the commit ID used to associate IPFS link with a given commit(e.g: `55828831`)                                  |
| `CI_COMMIT_MESSAGE`    | The **full commit message** is used to extract the **workspace** from the message                                                  |
| `CI_MERGE_REQUEST_IID` | The merge request ID                                                                                                               |

To run the script from the CI/CD you either need to use an Infura node or a custom node.

```bash
# Deploy using infura node
$ yarn ts-node scripts/deploy-ipfs.ts --ci --infura
# Deploy using custom node
$ yarn ts-node scripts/deploy-ipfs.ts --ci --custom
```

## Unpin IPFS content

This script can be used to unpin (remove) the builds from IPFS after the MR got closed.

#### Notes

1. the `--unpin` flag only works from the CI.
2. Can only unpin from **infura nodes**.

```bash
$ yarn ts-node scripts/deploy-ipfs.ts --ci --infura --unpin
```

## Flags

We relay on **flags** to control the script behavior.

| Flag              | Description                                                                        |
| ----------------- | ---------------------------------------------------------------------------------- |
| `--ci`            | Indicate that the script is running form the CI                                    |
| `--unpin`         | Will unpin the ipfs content from the node. Important ([note](#unpin-ipfs-content)) |
| `--custom`        | Will deploy to ipfs node with custom settings                                      |
| `--local-default` | Will deploy to **local** ipfs node using the **default settings**                  |
| `--infura`        | Will deploy to Infura node                                                         |
