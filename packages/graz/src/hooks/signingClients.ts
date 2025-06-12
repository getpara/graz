import type { SigningCosmWasmClientOptions } from "@cosmjs/cosmwasm-stargate";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import type { HttpEndpoint, SigningStargateClientOptions } from "@cosmjs/stargate";
import { GasPrice, SigningStargateClient } from "@cosmjs/stargate";
import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { checkWallet, getWallet } from "../actions/wallet";
import { useGrazInternalStore, useGrazSessionStore } from "../store";
import type { QueryConfig } from "../types/hooks";
import { isEmpty } from "../utils/isEmpty";
import { type ChainId, createMultiChainAsyncFunction, useChainsFromArgs } from "../utils/multi-chain";

interface SiginingClientSinglechainArgs<T> {
  multiChain?: false;
  opts?: T;
}

interface SiginingClientMultichainArgs<T> {
  multiChain?: true;
  opts?: Record<string, T>;
}

type Args<T> = SiginingClientSinglechainArgs<T> | SiginingClientMultichainArgs<T>;

interface BaseSigningClientArgs extends QueryConfig {
  chainId?: ChainId;
  offlineSigner?: "offlineSigner" | "offlineSignerAuto" | "offlineSignerOnlyAmino";
}
export function useStargateSigningClient(
  args?: BaseSigningClientArgs & SiginingClientSinglechainArgs<SigningStargateClientOptions>,
): UseQueryResult<SigningStargateClient | null>;
export function useStargateSigningClient(
  args?: BaseSigningClientArgs & SiginingClientMultichainArgs<SigningStargateClientOptions>,
): UseQueryResult<Record<string, SigningStargateClient | null>>;
/**
 * graz query hook to retrieve a SigningStargateClient.
 *
 * @example
 * ```ts
 * import { useStargateSigningClient } from "graz";
 *
 * // single chain
 * const { data:signingClient, isFetching, refetch, ... } = useStargateSigningClient();
 * await signingClient.getAccount("address")
 *
 * // multi chain
 * const { data:signingClients, isFetching, refetch, ... } = useStargateSigningClient({multiChain: true, chainId: ["cosmoshub-4", "sommelier-3"]});
 * await signingClients["cosmoshub-4"].getAccount("address")
 *
 * ```
 */
// eslint-disable-next-line prefer-arrow-functions/prefer-arrow-functions
export function useStargateSigningClient(
  args?: BaseSigningClientArgs & Args<SigningStargateClientOptions>,
): UseQueryResult<SigningStargateClient | null | Record<string, SigningStargateClient | null>> {
  const chains = useChainsFromArgs({ chainId: args?.chainId, multiChain: args?.multiChain });
  const wallet = useGrazInternalStore((x) => x.walletType);
  const activeChainIds = useGrazSessionStore((x) => x.activeChainIds);
  const queryKey = useMemo(
    () => ["USE_STARGATE_SIGNING_CLIENT", chains, wallet, args, activeChainIds] as const,
    [activeChainIds, args, chains, wallet],
  );
  return useQuery({
    queryKey,
    queryFn: async ({ queryKey: [, _chains, _wallet] }) => {
      if (_chains.length < 1) throw new Error("No chains found");
      const res = await createMultiChainAsyncFunction(Boolean(args?.multiChain), _chains, async (_chain) => {
        // Chain is not connected return undefined
        if (!activeChainIds?.includes(_chain.chainId)) return null;
        const isWalletAvailable = checkWallet(_wallet);
        if (!isWalletAvailable) {
          throw new Error(`${_wallet} is not available`);
        }
        const offlineSigner = await (async () => {
          switch (args?.offlineSigner) {
            case "offlineSigner":
              return getWallet(_wallet).getOfflineSigner(_chain.chainId);
            case "offlineSignerAuto":
              return getWallet(_wallet).getOfflineSignerAuto(_chain.chainId);
            case "offlineSignerOnlyAmino":
              return getWallet(_wallet).getOfflineSignerOnlyAmino(_chain.chainId);
            default:
              return getWallet(_wallet).getOfflineSignerAuto(_chain.chainId);
          }
        })();
        const chainConfig = useGrazInternalStore.getState().chainsConfig?.[_chain.chainId];
        const endpoint: HttpEndpoint = { url: _chain.rpc, headers: { ...(chainConfig?.rpcHeaders || {}) } };
        if (args?.multiChain === true) {
          args.opts;
        }
        const signingClient = await SigningStargateClient.connectWithSigner(
          endpoint,
          offlineSigner,
          args?.multiChain ? args.opts?.[_chain.chainId] : args?.opts,
        );
        return signingClient;
      });
      return res;
    },
    enabled:
      Boolean(chains) &&
      chains.length > 0 &&
      Boolean(wallet) &&
      (args?.enabled !== undefined ? Boolean(args.enabled) : true),
    refetchOnWindowFocus: false,
  });
}

export function useCosmWasmSigningClient(
  args?: BaseSigningClientArgs & SiginingClientSinglechainArgs<SigningCosmWasmClientOptions>,
): UseQueryResult<SigningCosmWasmClient | null>;
export function useCosmWasmSigningClient(
  args?: BaseSigningClientArgs & SiginingClientMultichainArgs<SigningCosmWasmClientOptions>,
): UseQueryResult<Record<string, SigningCosmWasmClient | null>>;
/**
 * graz query hook to retrieve a SigningCosmWasmClient.
 *
 * @example
 * ```ts
 * import { useCosmWasmSigningClient } from "graz";
 * // single chain
 * const { data:signingClient, isFetching, refetch, ... } = useCosmWasmSigningClient();
 * await signingClient.getAccount("address")
 *
 * // multi chain
 * const { data:signingClients, isFetching, refetch, ... } = useCosmWasmSigningClient({multiChain: true, chainId: ["cosmoshub-4", "sommelier-3"]});
 * await signingClients["cosmoshub-4"].getAccount("address")
 * ```
 */
// eslint-disable-next-line prefer-arrow-functions/prefer-arrow-functions
export function useCosmWasmSigningClient(
  args?: BaseSigningClientArgs & Args<SigningStargateClientOptions>,
): UseQueryResult<SigningCosmWasmClient | null | Record<string, SigningCosmWasmClient | null>> {
  const chains = useChainsFromArgs({ chainId: args?.chainId, multiChain: args?.multiChain });
  const wallet = useGrazInternalStore((x) => x.walletType);
  const activeChainIds = useGrazSessionStore((x) => x.activeChainIds);
  const queryKey = useMemo(
    () => ["USE_COSMWASM_SIGNING_CLIENT", chains, wallet, args, activeChainIds] as const,
    [activeChainIds, args, chains, wallet],
  );

  return useQuery({
    queryKey,
    queryFn: async ({ queryKey: [, _chains, _wallet] }) => {
      if (_chains.length < 1) throw new Error("No chains found");
      const res = await createMultiChainAsyncFunction(Boolean(args?.multiChain), _chains, async (_chain) => {
        // Chain is not connected return undefined
        if (!activeChainIds?.includes(_chain.chainId)) return null;
        const isWalletAvailable = checkWallet(_wallet);
        if (!isWalletAvailable) {
          throw new Error(`${_wallet} is not available`);
        }
        const offlineSigner = await (async () => {
          switch (args?.offlineSigner) {
            case "offlineSigner":
              return getWallet(_wallet).getOfflineSigner(_chain.chainId);
            case "offlineSignerAuto":
              return getWallet(_wallet).getOfflineSignerAuto(_chain.chainId);
            case "offlineSignerOnlyAmino":
              return getWallet(_wallet).getOfflineSignerOnlyAmino(_chain.chainId);
            default:
              return getWallet(_wallet).getOfflineSignerAuto(_chain.chainId);
          }
        })();
        const chainConfig = useGrazInternalStore.getState().chainsConfig?.[_chain.chainId];
        const endpoint: HttpEndpoint = { url: _chain.rpc, headers: { ...(chainConfig?.rpcHeaders || {}) } };
        const gasPrice = chainConfig?.gas
          ? GasPrice.fromString(`${chainConfig.gas.price}${chainConfig.gas.denom}`)
          : undefined;
        const signingClient = await SigningCosmWasmClient.connectWithSigner(endpoint, offlineSigner, {
          gasPrice,
          ...(args?.multiChain ? args.opts?.[_chain.chainId] : args?.opts || {}),
        });
        return signingClient;
      });
      return res;
    },
    enabled:
      Boolean(chains) &&
      chains.length > 0 &&
      Boolean(wallet) &&
      (args?.enabled !== undefined ? Boolean(args.enabled) : true),
    refetchOnWindowFocus: false,
  });
}
