# Panther Protocol dApp

This is the repository for the Panther Protocol dApp. The dApp is a web application that allows users to interact with the Panther Protocol smart contracts.

# How to publish the dApp

1.  The dApp is published on the IPFS network. To publish the dApp, you need to have the IPFS daemon running on your machine. You can download the IPFS daemon or desktop application from [here](https://ipfs.io/docs/install/).

2.  Rename `.env.production` to `.env`.

3.  Once you have the IPFS daemon running and environmental variables are set, you can publish the dApp by running the following command:

         yarn deploy:ipfs
