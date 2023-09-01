import { TezosToolkit } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { NetworkType, AccountInfo } from "@airgap/beacon-dapp";

type BeaconAPI = {
  Tezos: TezosToolkit;
  wallet: BeaconWallet;
  account: AccountInfo;
};

// TODO: automatically log the user in if possible - no need
// for making them click connect
const ensureActiveAccount = async (wallet: BeaconWallet) => {
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
export const connect = async (): Promise<BeaconAPI> => {
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
export const getAddress = async (api: BeaconAPI) => api.account.address;
export const getPublicKey = async (api: BeaconAPI) => api.account.publicKey;

export const submitTransfer = async (
  api: BeaconAPI,
  destination: string,
  order_id: number,
  amount_mutez: number
) => {
  const contract = await api.Tezos.wallet.at(destination);
  console.log("contract", contract);
  console.log("methods", contract.methods);
  const op = await contract.methods
    .transfer(order_id)
    .send({ amount: amount_mutez / 1000000 });
  return op.opHash;
};
