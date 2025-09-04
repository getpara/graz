import {
  Button,
  Heading,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Stack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import type { ChainInfo } from "@graz-sh/types";
import { getAvailableWallets, useAccount } from "graz";
import { useConnect, WalletType } from "graz";
import { mainnetChains } from "src/utils/graz";

const WalletModal = ({
  modal,
  onClick,
}: {
  modal: ReturnType<typeof useDisclosure>;
  onClick: (walletType: WalletType) => void;
}) => {
  const availableWallets = getAvailableWallets();
  const wallets = Object.entries(availableWallets)
    .filter(([_, isAvailable]) => isAvailable)
    .map(([walletType]) => ({
      walletType: walletType as WalletType,
      name: walletType
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
    }));

  const paraWallet = wallets.find((wallet) => wallet.walletType === WalletType.PARA);
  const otherWallets = wallets.filter((wallet) => wallet.walletType !== WalletType.PARA);
  return (
    <Modal isCentered isOpen={modal.isOpen} onClose={modal.onClose} size="xs">
      <ModalOverlay bgColor="blackAlpha.800" />
      <ModalContent bgColor="baseBg" borderRadius="2xl" py={4}>
        <ModalBody>
          <Stack spacing={4}>
            <Heading fontSize="28px" fontWeight="semibold" textAlign="center">
              Choose wallet
            </Heading>
            <Stack>
              <Stack spacing={3}>
                {paraWallet && (
                  <>
                    <Stack spacing={2}>
                      <strong>Social Login</strong>
                      <Button onClick={() => onClick(paraWallet.walletType)} colorScheme="blue" width="100%">
                        Connect with {paraWallet.name}
                      </Button>
                    </Stack>
                  </>
                )}

                {otherWallets.length > 0 && (
                  <>
                    {paraWallet && <hr style={{ margin: "16px 0" }} />}
                    <Stack spacing={2}>
                      <strong>Other Wallets</strong>
                      {otherWallets.map((wallet) => (
                        <Button key={wallet.walletType} onClick={() => onClick(wallet.walletType)} width="100%">
                          {wallet.name}
                        </Button>
                      ))}
                    </Stack>
                  </>
                )}
              </Stack>
            </Stack>
          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export const ConnectAllChainsWallet = () => {
  const toast = useToast();
  const modal = useDisclosure();
  const { connect } = useConnect({
    onSuccess: (args) => {
      toast({
        description: `Successfully connected to ${args.chains.map((chain) => chain.chainName).join("; ")}`,
        duration: 3000,
        isClosable: true,
        status: "success",
      });
    },
    onError: (error) => {
      toast({
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        description: error?.message || "Error connecting to wallet",
        duration: 3000,
        isClosable: true,
        status: "error",
      });
    },
  });
  return (
    <>
      <Button
        colorScheme="green"
        onClick={() => {
          modal.onOpen();
        }}
        size="sm"
      >
        Connect all
      </Button>
      <WalletModal
        modal={modal}
        onClick={(wallet) => {
          connect({
            chainId: mainnetChains.map((item) => item.chainId),
            walletType: wallet,
          });
        }}
      />
    </>
  );
};

export const ConnectWalletModal = ({ chain }: { chain: ChainInfo }) => {
  const toast = useToast();
  const modal = useDisclosure();
  const { connect } = useConnect({
    onSuccess: () => {
      toast({
        description: `Successfully connected to ${chain.chainName}`,
        duration: 3000,
        isClosable: true,
        status: "success",
      });
    },
    onError: (error) => {
      toast({
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        description: error?.message || "Error connecting to wallet",
        duration: 3000,
        isClosable: true,
        status: "error",
      });
    },
  });
  const { walletType } = useAccount();
  return (
    <>
      <Button
        colorScheme="green"
        onClick={() => {
          walletType ? connect({ chainId: chain.chainId, walletType }) : modal.onOpen();
        }}
        size="sm"
      >
        Connect
      </Button>
      <WalletModal
        modal={modal}
        onClick={(wallet) => {
          connect({
            chainId: chain.chainId,
            walletType: wallet,
          });
        }}
      />
    </>
  );
};
