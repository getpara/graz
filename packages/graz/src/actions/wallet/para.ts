import { useGrazInternalStore, useGrazSessionStore } from "../../store";
import { type Key, type Wallet, WalletType } from "../../types/wallet";

const RECONNECT_SESSION_KEY = "para.reconnect";

export const getPara = (): Wallet => {
  const wrap = (ctx: string, err: unknown, extraInfo?: string): never => {
    const baseMsg = `Para wallet error in ${ctx}: ${(err as Error).message}`;
    const fullMsg = extraInfo ? `${baseMsg}. Additional details: ${extraInfo}` : baseMsg;
    throw new Error(fullMsg);
  };

  const getClientOrThrow = () => {
    const connector = useGrazSessionStore.getState().paraConnector;
    if (!connector) {
      throw new Error(
        "Para wallet connector not initialized. Ensure 'enable()' is called successfully before accessing connector methods. Check if 'paraConfig' is properly set in GrazProvider.",
      );
    }
    return connector;
  };

  const paraConfig = useGrazInternalStore.getState().paraConfig;
  if (!paraConfig || !paraConfig.paraWeb) {
    throw new Error(
      "Para configuration is missing or incomplete. Ensure 'paraConfig' with 'paraWeb' is provided in GrazProvider. Example: { paraWeb: '...', ... }.",
    );
  }

  const init = async () => {
    console.log("[DEBUG] Initializing Para connector. Current paraConfig:", paraConfig);
    let connector = useGrazSessionStore.getState().paraConnector;
    console.log("[DEBUG] Existing Para connector from session store:", connector);
    if (connector) return connector;
    try {
      let ConnectorClass;
      if (paraConfig.connectorClass) {
        console.log("[DEBUG] Using embedded connectorClass from paraConfig.");
        ConnectorClass = paraConfig.connectorClass;
      } else if (!paraConfig.connectorImportPath) {
        console.log("[DEBUG] Using static import from @getpara/graz-integration.");
        const module = await import("@getpara/graz-integration");
        ConnectorClass = module.ParaGrazConnector;
        if (typeof ConnectorClass !== "function") {
          throw new Error(
            `ParaGrazConnector not found or not a function in @getpara/graz-integration module. Verify package installation and exports.`,
          );
        }
      } else {
        console.warn(
          `[DEBUG] Using dynamic import for custom path "${paraConfig.connectorImportPath}". This may cause bundling issues in frameworks like Next.js. Prefer static imports or connectorClass for compatibility.`,
        );
        const module = await import(paraConfig.connectorImportPath);
        ConnectorClass = module.ParaGrazConnector;
        if (typeof ConnectorClass !== "function") {
          throw new Error(
            `ParaGrazConnector not found or not a function in module at ${paraConfig.connectorImportPath}. Check the module's exports and path validity.`,
          );
        }
      }
      const chains = useGrazInternalStore.getState().chains;
      console.log("[DEBUG] Instantiating Para connector with chains:", chains);
      connector = new ConnectorClass(paraConfig, chains);
      console.log("[DEBUG] Para connector instantiated successfully:", connector);
      return connector;
    } catch (err) {
      throw wrap("init", err, `paraConfig: ${JSON.stringify(paraConfig)}`);
    }
  };

  const enable = async (_chainIds: string | string[]) => {
    console.log("[DEBUG] Para enable method called with input chainIds:", _chainIds);
    const chainIds = Array.isArray(_chainIds) ? _chainIds : [_chainIds];
    console.log("[DEBUG] Normalized chainIds for enable:", chainIds);

    try {
      console.log("[DEBUG] Starting Para connector initialization in enable.");
      const connector = await init();
      console.log("[DEBUG] Para connector initialized in enable:", connector);
      if (!connector) {
        throw new Error(
          `Failed to initialize Para wallet connector. Verify paraConfig: ${JSON.stringify(paraConfig)} and chainIds: ${JSON.stringify(chainIds)}. Ensure required dependencies are installed.`,
        );
      }
      console.log("[DEBUG] Updating Graz session store to 'connecting' status with connector:", connector);
      useGrazSessionStore.setState({ paraConnector: connector, status: "connecting" });
      console.log("[DEBUG] Calling enable on Para connector for chainIds:", chainIds);
      await connector.enable(chainIds);

      console.log("[DEBUG] Fetching accounts for chainIds:", chainIds);
      const accounts = Object.fromEntries(
        await Promise.all(chainIds.map(async (c): Promise<[string, Key]> => [c, await connector.getKey(c)])),
      );
      console.log("[DEBUG] Retrieved accounts:", accounts);

      console.log("[DEBUG] Updating Graz session store with accounts, activeChainIds, and 'connected' status.");
      useGrazSessionStore.setState((prev) => ({
        accounts: { ...(prev.accounts || {}), ...accounts },
        activeChainIds: Array.from(new Set([...(prev.activeChainIds || []), ...chainIds])),
        status: "connected",
      }));

      console.log("[DEBUG] Updating Graz internal store with recentChainIds, walletType, and reconnect flags.");
      useGrazInternalStore.setState((prev) => ({
        recentChainIds: Array.from(new Set([...(prev.recentChainIds || []), ...chainIds])),
        walletType: WalletType.PARA,
        _reconnect: false,
        _reconnectConnector: WalletType.PARA,
      }));

      if (typeof window !== "undefined") {
        console.log("[DEBUG] Setting reconnect flag in sessionStorage.");
        window.sessionStorage.setItem(RECONNECT_SESSION_KEY, "1");
      }
    } catch (err) {
      console.log("[DEBUG] Error in enable; resetting session store to disconnected.");
      useGrazSessionStore.setState({ paraConnector: null, status: "disconnected" });
      throw wrap("enable", err, `chainIds: ${JSON.stringify(chainIds)}, paraConfig: ${JSON.stringify(paraConfig)}`);
    }
  };

  return {
    enable,
    disable: async () => {
      console.log("[DEBUG] Para disable method called.");
      const connector = getClientOrThrow();
      console.log("[DEBUG] Retrieved connector for disable:", connector);
      try {
        console.log("[DEBUG] Calling disconnect on Para connector.");
        await connector.disconnect();
        console.log("[DEBUG] Disconnect successful.");
      } finally {
        console.log("[DEBUG] Updating Graz session store to 'disconnected' status and clearing connector.");
        useGrazSessionStore.setState({ paraConnector: null, status: "disconnected" });
      }
    },
    getKey: (chainId) => {
      console.log("[DEBUG] Para getKey method called for chainId:", chainId);
      return getClientOrThrow()
        .getKey(chainId)
        .catch((e: Error) => wrap("getKey", e, `chainId: ${chainId}`));
    },
    getOfflineSigner: (chainId) => {
      console.log("[DEBUG] Para getOfflineSigner method called for chainId:", chainId);
      return getClientOrThrow().getOfflineSigner(chainId);
    },
    getOfflineSignerOnlyAmino: (chainId) => {
      console.log("[DEBUG] Para getOfflineSignerOnlyAmino method called for chainId:", chainId);
      return getClientOrThrow().getOfflineSignerOnlyAmino(chainId);
    },
    getOfflineSignerAuto: (chainId) => {
      console.log("[DEBUG] Para getOfflineSignerAuto method called for chainId:", chainId);
      return getClientOrThrow().getOfflineSignerAuto(chainId);
    },
    signAmino: (c, s, d, o) => {
      console.log(
        "[DEBUG] Para signAmino method called with params: chainId=",
        c,
        ", signer=",
        s,
        ", data=",
        d,
        ", options=",
        o,
      );
      return getClientOrThrow()
        .signAmino(c, s, d, o)
        .catch((e: Error) => wrap("signAmino", e, `chainId: ${c}, signer: ${s}`));
    },
    signDirect: (c, s, d, o) => {
      console.log(
        "[DEBUG] Para signDirect method called with params: chainId=",
        c,
        ", signer=",
        s,
        ", data=",
        d,
        ", options=",
        o,
      );
      return getClientOrThrow()
        .signDirect(c, s, d, o)
        .catch((e: Error) => wrap("signDirect", e, `chainId: ${c}, signer: ${s}`));
    },
    signArbitrary: (c, s, data) => {
      console.log("[DEBUG] Para signArbitrary method called with params: chainId=", c, ", signer=", s, ", data=", data);
      return getClientOrThrow()
        .signArbitrary(c, s, data)
        .catch((e: Error) => wrap("signArbitrary", e, `chainId: ${c}, signer: ${s}`));
    },
    experimentalSuggestChain: async () => {
      console.log("[DEBUG] Para experimentalSuggestChain method called (not supported).");
      return Promise.reject(
        new Error(
          "Suggest chain is not supported by Para wallet. Consider alternative wallets or check Para documentation for updates.",
        ),
      );
    },
  };
};
