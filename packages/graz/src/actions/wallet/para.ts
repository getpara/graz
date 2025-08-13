import { ParaGrazConnector } from "@getpara/graz-connector";
import { useGrazInternalStore, useGrazSessionStore } from "../../store";
import { type Key, type Wallet, WalletType } from "../../types/wallet";

const RECONNECT_SESSION_KEY = "para.reconnect";
let initPromise: Promise<ParaGrazConnector> | null = null;

export const getPara = (): Wallet => {
  const getClientOrThrow = () => {
    const connector = useGrazSessionStore.getState().paraConnector;
    if (!connector) {
      throw new Error("Para connector not initialized. Call connect() first or check paraConfig in GrazProvider.");
    }
    return connector;
  };

  const paraConfig = useGrazInternalStore.getState().paraConfig;

  if (!paraConfig || !paraConfig.paraWeb) {
    throw new Error("Missing Para config. Provide paraConfig with 'paraWeb' to GrazProvider.");
  }

  const init = async () => {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      let connector = useGrazSessionStore.getState().paraConnector;
      if (connector) return connector;
      try {
        let ConnectorClass;
        if (paraConfig.connectorClass) {
          ConnectorClass = paraConfig.connectorClass;
        } else if (!paraConfig.connectorImportPath) {
          const module = await import("@getpara/graz-integration");
          ConnectorClass = module.ParaGrazConnector;
          if (typeof ConnectorClass !== "function") {
            throw new Error("Invalid ParaGrazConnector in @getpara/graz-integration. Check package installation.");
          }
        } else {
          const module = await import(paraConfig.connectorImportPath);
          ConnectorClass = module.ParaGrazConnector;
          if (typeof ConnectorClass !== "function") {
            throw new Error("Invalid ParaGrazConnector at import path. Check module export.");
          }
        }
        const chains = useGrazInternalStore.getState().chains;
        connector = new ConnectorClass(paraConfig, chains);

        useGrazSessionStore.setState((prev) => ({ ...prev, paraConnector: connector }));

        if (!connector) {
          throw new Error("Para connector initialization failed. Check config and dependencies.");
        }
        return connector;
      } catch (err) {
        throw new Error("Para connector init failed. Check @getpara/graz-integration and ParaConfig.");
      } finally {
        initPromise = null;
      }
    })();
    return initPromise;
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
      throw new Error(`Para enable failed${err instanceof Error ? `: ${err.message}` : ""}`);
    }
  };

  // Early check: Use paraWeb directly to detect connection state ASAP
  (async () => {
    try {
      const isLoggedIn = await paraConfig.paraWeb.isFullyLoggedIn();
      const hasWallets = paraConfig.paraWeb.getWalletsByType("COSMOS").length > 0;
      if (isLoggedIn && hasWallets) {
        await init();
        useGrazSessionStore.setState((prev) => ({ ...prev, status: "connected" }));
        console.log("Early detection: Para is already connected with wallets. Connector initialized.");
      }
    } catch (err) {
      console.warn("Early Para check failed:", err);
    }
  })();

  return {
    enable,
    disable: async () => {
      const connector = getClientOrThrow();
      try {
        await connector.disconnect();
      } catch (err) {
        throw new Error("Para disconnect failed. Wallet may already be disconnected.");
      } finally {
        useGrazSessionStore.setState({ paraConnector: null, status: "disconnected" });
      }
    },
    getKey: async (chainId) => {
      try {
        return await getClientOrThrow().getKey(chainId);
      } catch (err) {
        throw new Error(
          "Failed to get key. Check chain connection and Cosmos API key settings at developer.getpara.com.",
        );
      }
    },
    getOfflineSigner: (chainId) => {
      try {
        return getClientOrThrow().getOfflineSigner(chainId);
      } catch (err) {
        throw new Error("Failed to get offline signer. Check Para auth and Cosmos support in developer portal.");
      }
    },
    getOfflineSignerOnlyAmino: (chainId) => {
      try {
        return getClientOrThrow().getOfflineSignerOnlyAmino(chainId);
      } catch (err) {
        throw new Error("Failed to get Amino signer. Check Para auth and Cosmos support in developer portal.");
      }
    },
    getOfflineSignerAuto: (chainId) => {
      try {
        return getClientOrThrow().getOfflineSignerAuto(chainId);
      } catch (err) {
        throw new Error("Failed to get auto signer. Check Para auth and Cosmos support in developer portal.");
      }
    },
    signAmino: async (c, s, d, o) => {
      try {
        return await getClientOrThrow().signAmino(c, s, d, o);
      } catch (err) {
        throw new Error("Amino signing failed. User rejected or invalid transaction/signer.");
      }
    },
    signDirect: async (c, s, d, o) => {
      try {
        return await getClientOrThrow().signDirect(c, s, d, o);
      } catch (err) {
        throw new Error("Direct signing failed. User rejected or invalid transaction/signer.");
      }
    },
    signArbitrary: async (c, s, data) => {
      try {
        return await getClientOrThrow().signArbitrary(c, s, data);
      } catch (err) {
        throw new Error("Arbitrary signing failed. User rejected or feature not supported.");
      }
    },
    experimentalSuggestChain: async () => {
      throw new Error("Chain suggestion not supported. Configure chains in Para wallet settings.");
    },
  };
};
