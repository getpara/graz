import { ParaGrazInternalProvider } from "@getpara/graz-connector";
import { useGrazInternalStore, useGrazSessionStore } from "../../store";
import type { Wallet, Key, SignAminoParams, SignDirectParams } from "../../types/wallet";
import type { ChainInfo } from "@keplr-wallet/types";

export const getPara = (): Wallet => {
  const paraConfig = useGrazInternalStore.getState().paraConfig;

  if (!paraConfig || !paraConfig.apiKey || !paraConfig.env) {
    throw new Error("Para configuration is not set. Ensure `paraConfig` is provided in GrazProvider.");
  }
  const init = async () => {
    let connector = useGrazSessionStore.getState().paraConnector;
    if (connector) return connector;

    try {
      const { ParaGrazInternalProvider } = await import("@getpara/graz-connector");

      if (
        ParaGrazInternalProvider === undefined ||
        (typeof ParaGrazInternalProvider !== "function" && typeof ParaGrazInternalProvider !== "object")
      ) {
        throw new Error("`ParaGrazInternalProvider` not found or has unexpected type in @getpara/graz-connector");
      }

      const config = useGrazInternalStore.getState().paraConfig;
      if (!config) throw new Error("Para config disappeared during initialization");

      connector = new ParaGrazInternalProvider(config);

      return connector;
    } catch (error) {
      console.error("Graz: Failed to initialize Para client:", error);
      throw error;
    }
  };

  const enable = async (chainIds: string | string[]): Promise<void> => {
    try {
      const connector = await init();
      useGrazSessionStore.setState({ paraConnector: connector });
      connector.enable(chainIds);
    } catch (error) {
      console.error("Graz: Failed during Para enable:", error);
      useGrazSessionStore.setState({ paraConnector: null });
      throw error;
    }
  };

  const getClientOrThrow = (): ParaGrazInternalProvider => {
    const connector = useGrazSessionStore.getState().paraConnector;
    if (!connector) {
      throw new Error("Para client is not initialized. Ensure `enable` has been called successfully.");
    }
    return connector;
  };

  return {
    enable,
    disable: async (chainIds?: string | undefined) => {
      const connector = useGrazSessionStore.getState().paraConnector;
      if (connector?.disconnect) {
        await connector.disconnect();
      }
      return Promise.resolve();
    },
    getKey: async (chainId: string): Promise<Key> => getClientOrThrow().getKey(chainId),
    getOfflineSigner: (chainId: string) => getClientOrThrow().getOfflineSigner(chainId),
    getOfflineSignerOnlyAmino: (chainId: string) => getClientOrThrow().getOfflineSignerOnlyAmino(chainId),
    getOfflineSignerAuto: (chainId: string) => getClientOrThrow().getOfflineSignerAuto(chainId),
    signAmino: (...args: SignAminoParams) => getClientOrThrow().signAmino(...args),
    signDirect: (...args: SignDirectParams) => getClientOrThrow().signDirect(...args),
    signArbitrary: async (chainId: string, signer: string, data: string | Uint8Array) =>
      getClientOrThrow().signArbitrary(chainId, signer, data),

    experimentalSuggestChain: async (chainInfo: Omit<ChainInfo, "nodeProvider">) => {
      console.warn("Para Wallet: experimentalSuggestChain is not supported.");
      return Promise.reject(new Error("Suggest chain not supported by Para wallet."));
    },
  };
};
