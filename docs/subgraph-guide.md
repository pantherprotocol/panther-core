# Subgraph guide

This guide will quickly take you through how to deploy the subgraph.

## Prerequisites

First, you need to register an account on the [Subgraph](https://thegraph.com) to get your access token.

- Go to [Subgraph Hosted Service](https://thegraph.com/hosted-service) and create an account with your Github.
- After creating your account, go to `My Dashboard`.
- You will now see your `Access Token`. Copy the token. You will need it when you deploy the subgraph.
- Now you need to create a new subgraph. To do that, click on the `Add Subgraph` button. You will be asked to choose a name, description, image, etc, for your subgraph.

### Setting up

Execute below command to create the `.env` file. It contains pool address and its deployment block number. You may change these env variables to your own values, but it is not necessary if you aim to deploy the subgraph just for testing purposes.

        cp subgraph/.env.example subgraph/.env

Now it's time to generate a valid yaml file that contains the necessary information to deploy the subgraph. You may either connect the subgraph to the existing contract or freshly deployed ones:

- In case you want to connect subgraph to a newly deployed contracts, execute the following commands to deploy contracts and setup the subgraph.

        yarn deploy:contracts --network <network_name>
        yarn graph:setup <network_name>

- If you aim to connect the subgraph to the existing contracts, you can replace the `<env>` with `staging` or `production` to determine whether the subgraph is connected to the staging contracts or production ones.

        yarn graph:setup <network_name> <env>

### Deploying the Subgraph

- Build and compile the subgraph:

        yarn build:graph

- Verify your account:

        yarn graph:auth <YOUR_ACCESS_TOKEN>

- Deploy the subgraph:

        yarn deploy:graph <GITHUB_USERNAME>/<SUBGRAPH NAME>

If you see the `Build ID` and the subgraph link in your terminal, it means the subgraph is deployed successfully. ie:

        Build completed: QmfD72g6naqX1B3JgAzEzf1n9yjmqzEGWdtmGEUm9u2vGm

        Deployed to https://thegraph.com/explorer/subgraph/<GITHUB_USERNAME>/<SUBGRAPH NAME>

Go to `https://thegraph.com/explorer/subgraph/<GITHUB_USERNAME>/<SUBGRAPH NAME>` to see your subgraph.
Do not forget to compare the deployment ID that you have seen in your terminal (ie: `QmfD72g6naqX1B3JgAzEzf1n9yjmqzEGWdtmGEUm9u2vGm`) with the deployment ID that you see in the browser.
