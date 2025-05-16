import { WalletType } from "graz";
import { FC } from "react";
import { WalletOption } from "./WalletOption";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  installedWallets: WalletType[];
  notInstalledWallets: WalletType[];
  onSelectWallet: (walletType: WalletType) => void;
  isConnecting: boolean;
}

export const WalletModal: FC<WalletModalProps> = ({
  isOpen,
  onClose,
  installedWallets,
  notInstalledWallets,
  onSelectWallet,
  isConnecting,
}) => {
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
                      onSelect={onSelectWallet}
                      isConnecting={isConnecting}
                      isSupported={true}
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
                      onSelect={onSelectWallet}
                      isConnecting={isConnecting}
                      isSupported={false}
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