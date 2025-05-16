import "./App.css";
import { useAccount, useBalances, useConnect, useDisconnect, WALLET_TYPES, WalletType, checkWallet } from "graz";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AccountInfo } from "./components/AccountInfo";
import { WalletModal } from "./components/WalletModal";

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const chainIds = useMemo(() => ['cosmoshub-4', 'osmosis-1'], []);
  
  const { data: accounts, isConnected, isConnecting, isDisconnected, isReconnecting } = useAccount({
    chainId: chainIds,
    multiChain: true,
  });
  
  const { data: balances, isLoading: isLoadingBalances } = useBalances({
    chainId: chainIds,
    multiChain: true,
  });
  
  const { connect } = useConnect({
    onSuccess: () => setIsModalOpen(false),
  });
  
  const { disconnect } = useDisconnect();
  
  const { installedWallets, notInstalledWallets } = useMemo(() => {
    const installed: WalletType[] = [];
    const notInstalled: WalletType[] = [];

    WALLET_TYPES.forEach((walletType) =>
      checkWallet(walletType) ? installed.push(walletType) : notInstalled.push(walletType),
    );

    return { installedWallets: installed, notInstalledWallets: notInstalled };
  }, []);
  
  const handleWalletSelect = useCallback(
    (walletType: WalletType) => connect({ chainId: chainIds, walletType }),
    [chainIds, connect]
  );
  
  const handleConnectClick = useCallback(() => {
    if (isConnected) {
      disconnect({chainId: chainIds});
    } else {
      setIsModalOpen(true);
    }
  }, [isConnected, disconnect, chainIds]);
  
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);
  
  const truncateAddress = useCallback(
    (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-4)}`,
    []
  );
  
  useEffect(() => {
    if (isModalOpen && isConnected) closeModal();
  }, [isModalOpen, isConnected, closeModal]);

  return (
    <div className="app">
      <main className="app-main">
        {isDisconnected && (
          <div className="banner-card">
            <h1>Graz Wallet Connector</h1>
            <p>Connect your wallet to get started with the Cosmos ecosystem.</p>
          </div>
        )}

        {isConnected && accounts && (
          <AccountInfo 
            accounts={accounts}
            balances={balances}
            isLoadingBalances={isLoadingBalances}
            truncateAddress={truncateAddress}
            chainIds={chainIds}
          />
        )}

        <div className="connect-container">
          <button
            className="connect-button"
            disabled={isConnecting || isReconnecting}
            onClick={handleConnectClick}
            type="button"
          >
            {isConnecting || isReconnecting ? (
              <span className="loading-spinner"></span>
            ) : isConnected ? (
              "Disconnect Wallet"
            ) : (
              "Connect Wallet"
            )}
          </button>
        </div>
      </main>

      <WalletModal
        isOpen={isModalOpen}
        onClose={closeModal}
        installedWallets={installedWallets}
        notInstalledWallets={notInstalledWallets}
        onSelectWallet={handleWalletSelect}
        isConnecting={isConnecting}
      />

      <footer className="app-footer">
        <p>
          Built with <span className="heart">♥</span> using Vite, React, and
          Graz
        </p>
      </footer>
    </div>
  );
}