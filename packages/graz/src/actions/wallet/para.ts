import { useGrazInternalStore, useGrazSessionStore } from "../../store";
import { type Key, type Wallet, WalletType } from "../../types/wallet";

const RECONNECT_SESSION_KEY = "para.reconnect";

export const getPara = (): Wallet => {
  const wrap = (ctx: string, err: unknown): never => {
    throw new Error(`Para wallet (${ctx}) – ${(err as Error).message}`);
  };

  const getClientOrThrow = () => {
    const connector = useGrazSessionStore.getState().paraConnector;
    if (!connector) throw new Error("Para wallet not initialised. Call `enable()` first.");
    return connector;
  };

  const paraConfig = useGrazInternalStore.getState().paraConfig;
  if (!paraConfig || !paraConfig.apiKey || !paraConfig.env) {
    throw new Error("Para configuration missing. Supply `paraConfig` in GrazProvider.");
  }

  const init = async () => {
    let connector = useGrazSessionStore.getState().paraConnector;
    if (connector) return connector;

    try {
      const { ParaGrazConnector } = await import("@getpara/graz-connector");
      if (typeof ParaGrazConnector !== "function" && typeof ParaGrazConnector !== "object") {
        throw new Error("`ParaGrazConnector` not found in @getpara/graz-connector");
      }

      const chains = useGrazInternalStore.getState().chains;
      connector = new ParaGrazConnector(paraConfig, chains);
      return connector;
    } catch (err) {
      throw wrap("init", err);
    }
  };

  const enable = async (_chainIds: string | string[]) => {
    const chainIds = Array.isArray(_chainIds) ? _chainIds : [_chainIds];

    try {
      const connector = await init();
      useGrazSessionStore.setState({ paraConnector: connector, status: "connecting" });

      await connector.enable(chainIds);

      const accounts = Object.fromEntries(
        await Promise.all(chainIds.map(async (c): Promise<[string, Key]> => [c, await connector.getKey(c)])),
      );

      useGrazSessionStore.setState((prev) => ({
        accounts: { ...(prev.accounts || {}), ...accounts },
        activeChainIds: Array.from(new Set([...(prev.activeChainIds || []), ...chainIds])),
        status: "connected",
      }));

      useGrazInternalStore.setState((prev) => ({
        recentChainIds: Array.from(new Set([...(prev.recentChainIds || []), ...chainIds])),
        walletType: WalletType.PARA,
        _reconnect: false,
        _reconnectConnector: WalletType.PARA,
      }));

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(RECONNECT_SESSION_KEY, "1");
      }
    } catch (err) {
      useGrazSessionStore.setState({ paraConnector: null, status: "disconnected" });
      throw wrap("enable", err);
    }
  };

  return {
    enable,
    disable: async () => {
      const connector = getClientOrThrow();
      try {
        await connector.disconnect();
      } finally {
        useGrazSessionStore.setState({ paraConnector: null, status: "disconnected" });
      }
    },
    getKey: (chainId) =>
      getClientOrThrow()
        .getKey(chainId)
        .catch((e: Error) => wrap("getKey", e)),
    getOfflineSigner: (chainId) => getClientOrThrow().getOfflineSigner(chainId),
    getOfflineSignerOnlyAmino: (chainId) => getClientOrThrow().getOfflineSignerOnlyAmino(chainId),
    getOfflineSignerAuto: (chainId) => getClientOrThrow().getOfflineSignerAuto(chainId),
    signAmino: (c, s, d, o) =>
      getClientOrThrow()
        .signAmino(c, s, d, o)
        .catch((e: Error) => wrap("signAmino", e)),
    signDirect: (c, s, d, o) =>
      getClientOrThrow()
        .signDirect(c, s, d, o)
        .catch((e: Error) => wrap("signDirect", e)),
    signArbitrary: (c, s, data) =>
      getClientOrThrow()
        .signArbitrary(c, s, data)
        .catch((e: Error) => wrap("signArbitrary", e)),
    experimentalSuggestChain: async () => Promise.reject(new Error("Suggest chain not supported by Para wallet.")),
  };
};
