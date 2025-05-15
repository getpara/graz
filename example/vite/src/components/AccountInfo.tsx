import { useAccount, useActiveChains, useBalances } from "graz";
import { useCallback } from "react";

export const AccountInfo: React.FC = () => {
  const activeChains = useActiveChains();
  const activeChainIds = activeChains?.map((c) => c.chainId);

  const { data: accounts, isConnected } = useAccount({
    chainId: activeChainIds,
    multiChain: true,
  });

  const { data: balances, isLoading: isLoadingBalances } = useBalances({
    chainId: activeChainIds,
    multiChain: true,
  });

  const truncate = useCallback(
    (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-4)}`,
    [],
  );

  if (!isConnected || !activeChains || !accounts) return null;

  return (
    <div className="account-info">
      <div className="multi-chain-grid">
        {activeChains.map((chain) => {
          const account = accounts[chain.chainId];
          const address = account?.bech32Address ?? "";
          const coins = balances?.[chain.chainId] ?? [];
          return (
            <div className="account-card" key={chain.chainId}>
              <div className="account-header">
                <h4 className="chain-name">{chain.chainName}</h4>
              </div>
              <div className="account-details">
                <div className="info-row">
                  <span className="info-label">Address:</span>
                  <span className="info-value address">
                    {address ? (
                      <>
                        <code>{truncate(address)}</code>
                        <button
                          className="copy-button"
                          onClick={() => navigator.clipboard.writeText(address)}
                        >
                          Copy
                        </button>
                      </>
                    ) : (
                      "N/A"
                    )}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Balances:</span>
                  <span className="info-value">
                    {isLoadingBalances
                      ? "Loading..."
                      : coins.length > 0
                      ? coins
                          .map((coin) => `${coin.amount} ${coin.denom}`)
                          .join(", ")
                      : "0"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
