import { useGrazInternalStore, useGrazSessionStore } from "../../store";
import type { Wallet } from "../../types/wallet";

export const getPara = (): Wallet => {
  const paraConfig = useGrazInternalStore.getState().paraConfig;

  if (!paraConfig || !paraConfig.apiKey || !paraConfig.env) {
    throw new Error("Para configuration is not set. Ensure `paraConfig` is provided in GrazProvider.");
  }

  const init = async () => {
    let connector = useGrazSessionStore.getState().paraConnector;

    if (connector) {
      return connector;
    }

    try {
      const { ParaGrazConnector } = await import("@getpara/graz-connector");

      if (
        ParaGrazConnector === undefined ||
        (typeof ParaGrazConnector !== "function" && typeof ParaGrazConnector !== "object")
      ) {
        throw new Error("`ParaGrazInternalProvider` not found or has unexpected type in @getpara/graz-connector");
      }

      const config = useGrazInternalStore.getState().paraConfig;
      const chains = useGrazInternalStore.getState().chains;

      if (!config) {
        throw new Error("Para config disappeared during initialization");
      }

      connector = new ParaGrazConnector(config, chains);

      return connector;
    } catch (error) {
      throw error;
    }
  };

  const enable = async (chainIds: string | string[]): Promise<void> => {
    try {
      const connector = await init();
      useGrazSessionStore.setState({ paraConnector: connector });
      await connector.enable(chainIds);
    } catch (error) {
      useGrazSessionStore.setState({ paraConnector: null });
      throw error;
    }
  };

  const getClientOrThrow = () => {
    const connector = useGrazSessionStore.getState().paraConnector;
    if (!connector) throw new Error("Para client not initialized. Call `enable` first.");
    return connector;
  };

  return {
    enable,
    disable: async () => getClientOrThrow().disconnect(),
    getKey: (chainId) => getClientOrThrow().getKey(chainId),
    getOfflineSigner: (chainId) => getClientOrThrow().getOfflineSigner(chainId),
    getOfflineSignerOnlyAmino: (chainId) => getClientOrThrow().getOfflineSignerOnlyAmino(chainId),
    getOfflineSignerAuto: (chainId) => getClientOrThrow().getOfflineSignerAuto(chainId),
    signAmino: (...args) => getClientOrThrow().signAmino(...args),
    signDirect: (...args) => getClientOrThrow().signDirect(...args),
    signArbitrary: (chainId, signer, data) => getClientOrThrow().signArbitrary(chainId, signer, data),
    experimentalSuggestChain: async () => Promise.reject(new Error("Suggest chain not supported by Para wallet.")),
  };
};
