import { TezosToolkit } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { NetworkType } from "@airgap/beacon-dapp";

// TODO: automatically log the user in if possible - no need
// for making them click connect
const ensureActiveAccount = async (wallet) => {
  const activeAccount = await wallet.client.getActiveAccount();
  if (!activeAccount) {
    await wallet.requestPermissions({
      network: { type: NetworkType.MAINNET },
    });
    const activeAccount = await wallet.client.getActiveAccount();
    if (!activeAccount) {
      throw new Error("missing active account");
    }
    return activeAccount;
  }
  return activeAccount;
};
export const connect = async () => {
  const Tezos = new TezosToolkit("https://mainnet.api.tez.ie/");

  const wallet = new BeaconWallet({
    name: "SetaPay",
    preferredNetwork: NetworkType.MAINNET,
  });

  Tezos.setWalletProvider(wallet);

  const account = await ensureActiveAccount(wallet);
  // TODO: can activeAccount change?
  return { Tezos, wallet, account };
};
export const getAddress = async (api) => api.account.address;
export const getPublicKey = async (api) => api.account.publicKey;

export const submitTransfer = async (
  api,
  destination,
  order_id,
  amount_mutez
) => {
  const contract = await api.Tezos.wallet.at(destination);
  console.log("contract", contract);
  console.log("methods", contract.methods);
  const op = await contract.methods
    .transfer(order_id)
    .send({ amount: amount_mutez / 1000000 });
  return op.opHash;
};

console.log("hello");
