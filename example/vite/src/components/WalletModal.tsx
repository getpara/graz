import {
  WALLET_TYPES,
  WalletType,
  useConnect,
  checkWallet,
  useAccount,
} from "graz";
import { useEffect, useMemo } from "react";
import { WalletOption } from "./WalletOption";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  chainIds: string[];
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  chainIds,
}) => {
  const { connect, isLoading, isSuccess } = useConnect({
    onSuccess: () => onClose(),
  });
  const { isConnected } = useAccount();

  const { installedWallets, notInstalledWallets } = useMemo(() => {
    const installed: WalletType[] = [];
    const notInstalled: WalletType[] = [];

    WALLET_TYPES.forEach((walletType) =>
      checkWallet(walletType) ? installed.push(walletType) : notInstalled.push(walletType),
    );

    return { installedWallets: installed, notInstalledWallets: notInstalled };
  }, []);

  useEffect(() => {
    if (isOpen && isSuccess && isConnected) onClose();
  }, [isOpen, isSuccess, isConnected, onClose]);

  const handleWalletSelect = (walletType: WalletType) =>
    connect({ chainId: chainIds, walletType });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-wrapper">
        <button className="modal-close-button" onClick={onClose}>
          ×
        </button>

        <div className="modal-container">
          <div className="modal-header">
            <h3>Connect Wallet</h3>
          </div>

          <div className="modal-body">
            <p className="modal-description">
              Connect your Cosmos wallet to continue
            </p>

            {installedWallets.length > 0 && (
              <div className="wallet-section">
                <h4 className="wallet-section-title">Available Wallets</h4>
                <div className="wallet-options-list">
                  {installedWallets.map((walletType) => (
                    <WalletOption
                      key={walletType}
                      walletType={walletType}
                      onSelect={handleWalletSelect}
                      isConnecting={isLoading}
                    />
                  ))}
                </div>
              </div>
            )}

            {notInstalledWallets.length > 0 && (
              <div className="wallet-section">
                <h4 className="wallet-section-title">Not Installed</h4>
                <div className="wallet-options-list">
                  {notInstalledWallets.map((walletType) => (
                    <WalletOption
                      key={walletType}
                      walletType={walletType}
                      onSelect={handleWalletSelect}
                      isConnecting={isLoading}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <p className="modal-footer-text">
              Don't have a wallet?{" "}
              <a
                href="https://cosmos.network/wallets"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
