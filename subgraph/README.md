# Subgraph guide

This guide will quickly take you through how to deploy the subgraph.

## Prerequisites

First, you need to register an account on the [Subgraph](https://thegraph.com) to get your access token.

- Go to [Subgraph Hosted Service](https://thegraph.com/hosted-service) and create an account with your Github.
- After creating your account, go to `My Dashboard`.
- You will now see your `Access Token`. Copy the token. You will need it when you deploy the subgraph.
- Now you need to create a new subgraph. To do that, click on the `Add Subgraph` button. You will be asked to choose a name, description, image, etc, for your subgraph.

### Checking the subgraph configurations

This subgraph interacts with `AdvancedStakeRewardController` and `PantherPoolV0` smart contracts on the Polygon network.
We have added these contracts' addresses and other information required for the subgraph deployment to the [subgraph.yaml](./subgraph.yaml) file.

If you need to check the addresses and block numbers (aka `startBlock`), open the `subgraph.yaml`. You can find the information under the `data sources` section.

### Deploying the Subgraph

Make sure you are inside the `subgraph` folder.

- Install the dependencies:

        yarn install

- Verify your account to be able to deploy the subgraph:

        yarn graph:auth <YOUR_ACCESS_TOKEN>

- Now, you can execute the following command to compile and deploy the subgraph sequentially:

        yarn subgraph:publish <GITHUB_USERNAME>/<SUBGRAPH NAME>

If you see the `Build ID` and the subgraph link in your terminal, it means the subgraph is deployed successfully, i.e.,

        Build completed: QmfD72g6naqX1B3JgAzEzf1n9yjmqzEGWdtmGEUm9u2vGm

        Deployed to https://thegraph.com/explorer/subgraph/<GITHUB_USERNAME>/<SUBGRAPH NAME>

Go to `https://thegraph.com/explorer/subgraph/<GITHUB_USERNAME>/<SUBGRAPH NAME>` to see your subgraph.
Do not forget to compare the deployment ID that you have seen in your terminal (i.e., `QmfD72g6naqX1B3JgAzEzf1n9yjmqzEGWdtmGEUm9u2vGm`) with the deployment ID that you see in the browser.

For more detailed information, please checkout the [thegraph](https://thegraph.com/docs/en/deploying/deploying-a-subgraph-to-hosted/) deployment documents.

### Existing deployments

For advanced staking v0.5:

- toxicehc deployed subgraph ID `QmTi7Z7YoUpzYqwGytPuKYu2FuYPEhtPTsXti5dRxn8wHR`
  at: https://thegraph.com/hosted-service/subgraph/toxicehc/panther

- cryptoefelle deployed subgraph ID `QmZPs5CFi5vpZW73DmwF5VMzt5CYvFX7vD9Ez9gkZteuRd`
  at: https://thegraph.com/explorer/subgraph/cryptoefelle/panther
