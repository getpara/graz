import { WalletType } from "graz";
import { FC } from "react";

interface WalletOptionProps {
  walletType: WalletType;
  onSelect: (walletType: WalletType) => void;
  isConnecting: boolean;
  isSupported: boolean;
}

export const WalletOption: FC<WalletOptionProps> = ({
  walletType,
  onSelect,
  isConnecting,
  isSupported,
}) => {
  const formatWalletName = (type: WalletType) => {
    return type.charAt(0) + type.slice(1).toLowerCase();
  };

  return (
    <button
      className={`wallet-option ${!isSupported ? "wallet-option-disabled" : ""}`}
      onClick={() => isSupported && onSelect(walletType)}
      disabled={!isSupported || isConnecting}
    >
      <div className="wallet-option-content">
        <span className="wallet-name">{formatWalletName(walletType)}</span>
      </div>
      {!isSupported && <span className="wallet-status">Not installed</span>}
    </button>
  );
};