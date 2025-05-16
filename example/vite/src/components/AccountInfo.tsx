import { Key } from "graz";
import { FC } from "react";

interface AccountInfoProps {
  accounts: Record<string, Key | undefined>;
  balances?: Record<string, any[]>;
  isLoadingBalances: boolean;
  truncateAddress: (addr: string) => string;
  chainIds: string[];
}

export const AccountInfo: FC<AccountInfoProps> = ({
  accounts,
  balances,
  isLoadingBalances,
  truncateAddress,
  chainIds,
}) => {
  return (
    <div className="account-info">
      <div className="multi-chain-grid">
        {chainIds.map((chainId) => {
          const account = accounts[chainId];
          const address = account?.bech32Address ?? "";
          const coins = balances?.[chainId] ?? [];
          return (
            <div className="account-card" key={chainId}>
              <div className="account-header">
                <h4 className="chain-name">{chainId.split('-')[0]}</h4>
              </div>
              <div className="account-details">
                <div className="info-row">
                  <span className="info-label">Address:</span>
                  <span className="info-value address">
                    {address ? (
                      <>
                        <code>{truncateAddress(address)}</code>
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