import { useUserStore } from "@/stores/user";
import {
  Button,
  Card,
  CardBody,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@heroui/react";
import { useCallback, useMemo, useState } from "react";
import { Id, toast } from "react-toastify";
import { formatReadableAmount, VIEW_UNIT } from "@/utils/format";
import { CHAIN } from "@/utils/chain";
import { isDev } from "@/utils/tools";
import { sendTransaction } from "@wagmi/core";
import { wagmiConfig } from "@/config/wagmi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  toAddress: string;
  amount: string;
  onSuccess: (tx: string, toastId: Id) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  toAddress,
  amount,
  onSuccess,
}: Props) {
  const { address } = useUserStore();
  const fromAddress = address;
  const [isLoading, setIsLoading] = useState(false);

  const toPay = useCallback(async () => {
    if (!amount || Number.isNaN(Number(amount))) {
      toast.error("Invalid amount");
      return;
    }

    const toastId = toast.loading(
      "Posting continue to complete in your wallet"
    );
    try {
      setIsLoading(true);
      const readableAmount = formatReadableAmount(amount);
      console.log("toAddress", toAddress);
      console.log("readableAmount", readableAmount);

      const signTx = await sendTransaction(wagmiConfig, {
        to: toAddress as `0x${string}`,
        value: BigInt(amount),
      });

      console.log("signTx", signTx);

      const signatureHex = CHAIN === "SOL" ? "" : signTx;
      onSuccess(signatureHex, toastId);
      setIsLoading(false);
    } catch (e: any) {
      console.error("Error paying", e);
      setIsLoading(false);
      toast.update(toastId, {
        render: `Error paying: ${e.message}`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  }, [toAddress, amount, onSuccess]);

  const mockPayment = useCallback(() => {
    const signatureHex = `0xc712feacbd7672e3d8f4b2ff4d8c4484747e9fa2730614ddc97dc2ce9870538a`;
    onSuccess(signatureHex, 1);
  }, [onSuccess]);

  const listData = useMemo(() => {
    return [
      {
        label: "From Address",
        value: fromAddress,
      },
      {
        label: "To Address",
        value: toAddress,
      },
      {
        label: "Amount",
        value: `${amount ? formatReadableAmount(amount) : ""} ${VIEW_UNIT}`,
      },
    ];
  }, [fromAddress, toAddress, amount]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      classNames={{
        body: "max-h-[85vh] overflow-y-auto md:max-h-[95vh]",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>Transaction</ModalHeader>
            <ModalBody>
              <Card>
                <CardBody>
                  <div className="space-y-2">
                    {listData.map((item) => (
                      <div key={item.label}>
                        <span className="text-sm font-bold">
                          {item.label}:{" "}
                        </span>
                        <span className="text-sm">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
              <Button
                onPress={toPay}
                disabled={isLoading}
                isLoading={isLoading}
              >
                Payment
              </Button>
              {isDev && <Button onPress={mockPayment}>Mock</Button>}
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
