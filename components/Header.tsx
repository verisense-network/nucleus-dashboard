"use client";

import { WalletStatus } from "@/components/connectWallet";
import Logo from "./icon/Logo";
import { Divider } from "@heroui/divider";
import Link from "next/link";
import { useEndpointStore } from "@/stores/endpoint";
import { Button, Modal, ModalBody, ModalContent, ModalHeader, Spinner } from "@heroui/react";
import { CheckCircle, Settings, XCircle } from "lucide-react";
import SetEndpoint from "./endpoint/SetEndpoint";
import { useEffect, useState } from "react";
import { getNodeDetail } from "@/app/actions";
import { AddressViewFormat } from "@/utils/format";

export default function Header() {
  const [isOpenSetEndpoint, setIsOpenSetEndpoint] = useState(false);
  const { endpoint, status, setStatus, setEndpoint, endpoints } = useEndpointStore();

  useEffect(() => {
    const fetchNodeDetail = async () => {
      if (!endpoint) {
        setStatus("disconnected");
        if (endpoints.length > 0) {
          setEndpoint(endpoints[0]);
        } else {
          setIsOpenSetEndpoint(true);
        }
        return;
      } else {
        setIsOpenSetEndpoint(false)
      }

      setStatus("connecting");
      try {
        const result = await getNodeDetail(endpoint);
        if (!result.success) {
          setStatus("disconnected");
        } else {
          setStatus("connected");
        }
      } catch (error) {
        console.error(error);
        setStatus("disconnected");
      }
    };
    fetchNodeDetail();

    return () => {
      setStatus("disconnected");
    }
  }, [endpoint, endpoints, setEndpoint, setStatus]);

  return (
    <header className="fixed top-0 left-0 w-full h-16 border-b bg-white border-zinc-200 dark:bg-black dark:border-zinc-800 z-50">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
        <div className="flex-shrink-0 cursor-pointer flex items-center gap-2">
          <Link href="https://verisense.network">
            <Logo />
          </Link>
          <Divider orientation="vertical" className="h-6 text-foreground" />
          <Link href="/">
            <span className="text-xs md:text-base font-bold">Dashboard</span>
          </Link>
        </div>
        <div className="flex-shrink-0 flex space-x-1 md:space-x-5 items-center">
          <div className="flex flex-col items-end mx-4">
            <span className="text-sm text-foreground flex items-center gap-2">
              {
                {
                  "connecting": <Spinner size="sm" />,
                  "connected": <CheckCircle size="14" className="text-success" />,
                  "disconnected": <XCircle size="14" className="text-danger" />
                }[status]
              }
              <Button size="sm" color="primary" variant="faded" isIconOnly onPress={() => setIsOpenSetEndpoint(true)}>
                <Settings className="w-4 h-4" />
              </Button>
            </span>
            <span className="text-xs hidden md:block text-foreground">
              {endpoint || "No endpoint"}
            </span>
          </div>
          <WalletStatus />
        </div>
      </div>
      <Modal isOpen={isOpenSetEndpoint} onOpenChange={setIsOpenSetEndpoint}>
        <ModalContent>
          <ModalHeader>
            <h3 className="text-md font-semibold">Set Endpoint</h3>
          </ModalHeader>
          <ModalBody>
            <SetEndpoint onClose={() => setIsOpenSetEndpoint(false)} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </header>
  );
}
