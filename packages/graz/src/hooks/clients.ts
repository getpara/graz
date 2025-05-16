import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import type { HttpEndpoint } from "@cosmjs/stargate";
import { StargateClient } from "@cosmjs/stargate";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useGrazInternalStore } from "../store";
import type { QueryConfig, UseMultiChainQueryResult } from "../types/hooks";
import type { MultiChainHookArgs } from "../utils/multi-chain";
import { createMultiChainAsyncFunction, useChainsFromArgs } from "../utils/multi-chain";

/**
 * graz query hook to retrieve a StargateClient.
 *
 * @example
 * ```ts
 * import { useStargateClient } from "graz";
 *
 * // single chain
 * const { data:client, isFetching, refetch, ... } = useStargateClient();
 * await client.getAccount("address")
 *
 * // multi chain
 * const { data:clients, isFetching, refetch, ... } = useStargateClient({multiChain: true, chainId: ["cosmoshub-4", "sommelier-3"]});
 * await clients["cosmoshub-4"].getAccount("address")
 *
 * ```
 */
export const useStargateClient = <TMulti extends MultiChainHookArgs>(
  args?: TMulti & QueryConfig,
): UseMultiChainQueryResult<TMulti, StargateClient> => {
  const chains = useChainsFromArgs({ chainId: args?.chainId, multiChain: args?.multiChain });
  const queryKey = useMemo(() => ["USE_STARGATE_CLIENT", chains] as const, [chains]);

  return useQuery({
    queryKey,
    queryFn: async ({ queryKey: [, _chains] }) => {
      if (_chains.length < 1) throw new Error("No chains found");
      const res = await createMultiChainAsyncFunction(Boolean(args?.multiChain), _chains, async (_chain) => {
        const chainConfig = useGrazInternalStore.getState().chainsConfig?.[_chain.chainId];
        const endpoint: HttpEndpoint = { url: _chain.rpc, headers: { ...(chainConfig?.rpcHeaders || {}) } };
        const client = await StargateClient.connect(endpoint);
        return client;
      });
      return res;
    },
    enabled: Boolean(chains) && chains.length > 0 && (args?.enabled !== undefined ? Boolean(args.enabled) : true),
    refetchOnWindowFocus: false,
  });
};

/**
 * graz query hook to retrieve a CosmWasmClient.
 *
 * @example
 * ```ts
 * import { useCosmWasmClient } from "graz";
 *
 * //single chain
 * const { data:client, isFetching, refetch, ... } = useCosmWasmClient();
 * await client.getAccount("address")
 *
 * // multi chain
 * const { data:clients, isFetching, refetch, ... } = useCosmWasmClient({multiChain: true, chainId: ["cosmoshub-4", "sommelier-3"]});
 * await clients["cosmoshub-4"].getAccount("address")
 *
 * ```
 */
export const useCosmWasmClient = <TMulti extends MultiChainHookArgs>(
  args?: TMulti & QueryConfig,
): UseMultiChainQueryResult<TMulti, CosmWasmClient> => {
  const chains = useChainsFromArgs({ chainId: args?.chainId, multiChain: args?.multiChain });
  const queryKey = useMemo(() => ["USE_COSMWASM_CLIENT", chains] as const, [chains]);

  return useQuery({
    queryKey,
    queryFn: async ({ queryKey: [, _chains] }) => {
      if (_chains.length < 1) throw new Error("No chains found");
      const res = await createMultiChainAsyncFunction(Boolean(args?.multiChain), _chains, async (_chain) => {
        const chainConfig = useGrazInternalStore.getState().chainsConfig?.[_chain.chainId];
        const endpoint: HttpEndpoint = { url: _chain.rpc, headers: { ...(chainConfig?.rpcHeaders || {}) } };
        const client = await CosmWasmClient.connect(endpoint);
        return client;
      });
      return res;
    },
    enabled: Boolean(chains) && chains.length > 0 && (args?.enabled !== undefined ? Boolean(args.enabled) : true),
    refetchOnWindowFocus: false,
  });
};
