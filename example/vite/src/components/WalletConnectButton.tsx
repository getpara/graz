import { useAccount, useDisconnect } from "graz";
import { useState } from "react";
import { WalletModal } from "./WalletModal";

interface WalletConnectButtonProps {
  chainIds: string[];
}

export const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({
  chainIds,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected, isConnecting, isReconnecting } = useAccount();
  const { disconnect } = useDisconnect();

  const handleButtonClick = () => {
    if (isConnected) {
      disconnect({chainId: chainIds});
    } else {
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    console.log("Modal closed");
    setIsModalOpen(false);
  };

  return (
    <>
      <button
        className="connect-button"
        disabled={isConnecting || isReconnecting}
        onClick={handleButtonClick}
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
      
      <WalletModal
        isOpen={isModalOpen}
        onClose={closeModal}
        chainIds={chainIds}
      />
    </>
  );
};