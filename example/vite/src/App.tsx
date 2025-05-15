import "./App.css";
import { useAccount, getChainInfos } from "graz";
import { useMemo } from "react";
import { AccountInfo } from "./components/AccountInfo";
import { WalletConnectButton } from "./components/WalletConnectButton";


export default function App() {
  const { isConnected, isDisconnected } = useAccount();
  const chainIds = useMemo(
    () => ['cosmoshub-4','osmosis-1'],
    []
  );

  return (
    <div className="app">
      <main className="app-main">
        {isDisconnected && (
          <div className="banner-card">
            <h1>Graz Wallet Connector</h1>
            <p>Connect your wallet to get started with the Cosmos ecosystem.</p>
          </div>
        )}

        {isConnected && <AccountInfo />}

        <div className="connect-container">
          <WalletConnectButton chainIds={chainIds} />
        </div>
      </main>

      <footer className="app-footer">
        <p>
          Built with <span className="heart">♥</span> using Vite, React, and
          Graz
        </p>
      </footer>
    </div>
  );
}
