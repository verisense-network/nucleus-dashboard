"use client";

import { getNucleusDetail } from "@/app/actions";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import NucleusCard from "@/components/home/components/NucleusCard";
import AbiDetails from "@/components/nucleus/abi/AbiDetails";
import OpenLogs from "@/components/nucleus/OpenLogs";
import { use, useEffect, useState } from "react";
import { NucleusInfo } from "@/types/nucleus";
import { Spinner } from "@heroui/react";
import { wrapApiRequest } from "@/utils/api";
import { getNucleusByIdAPI } from "@/api/nucleus";
import { useHydrationEndpointStore } from "@/stores/endpoint";

interface NucleusDetailPageProps {
  params: Promise<{
    nucleusId: string;
  }>;
}

export default function NucleusDetailPage({ params }: NucleusDetailPageProps) {
  const { nucleusId } = use(params);

  const [{ endpoint, isLocalNode }, hydrated] = useHydrationEndpointStore(state => state);

  const [nuclei, setNuclei] = useState<NucleusInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    const fetchNucleusDetail = async () => {

      setIsLoading(true);
      const result = await wrapApiRequest(getNucleusDetail.bind(null, endpoint, nucleusId), getNucleusByIdAPI.bind(null, endpoint, nucleusId), isLocalNode(endpoint));
      if (!result.success || !result.data) {
        setError(result.message || "Unknown error");
      } else {
        setNuclei(result.data);
      }
      setIsLoading(false);
    };

    fetchNucleusDetail();
  }, [endpoint, nucleusId, hydrated, isLocalNode]);


  if (error?.includes("404") || error?.includes("not found")) {
    notFound();
  }

  if (error) {
    return (
      <div className="w-full mx-auto py-4">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" startContent={<ArrowLeft size={16} />}>
              Back to Home
            </Button>
          </Link>
        </div>

        <Card>
          <CardBody>
            <p className="text-danger">Load data failed: {error}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto py-4 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <Link href="/">
          <Button variant="ghost" startContent={<ArrowLeft size={16} />}>
            Back to Home
          </Button>
        </Link>
        <OpenLogs nucleusId={nucleusId} />
      </div>

      {isLoading && (
        <div className="w-full mx-auto py-4">
          <div className="flex justify-center items-center h-full">
            <Spinner size="lg" />
          </div>
        </div>
      )}

      {nuclei && <NucleusCard nucleus={nuclei} showLink={false} />}

      {nuclei && <div className="space-y-4">
        <h2 className="text-xl font-semibold">Detailed Information</h2>
        <Card>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-default-500 mb-1">Root State</h3>
                  <p className="text-sm font-mono break-all">{nuclei?.rootState}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-default-500 mb-1">ID</h3>
                  <p className="text-sm font-mono break-all">{nuclei?.id}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-default-500 mb-1">WASM Hash</h3>
                  <p className="text-sm font-mono break-all">{nuclei?.wasmHash}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-default-500 mb-1">Manager</h3>
                  <p className="text-sm font-mono break-all">{nuclei?.manager}</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>}
      {nuclei && <div className="space-y-4">
        <h2 className="text-xl font-semibold">ABI Explorer</h2>
        <AbiDetails nucleus={nuclei} />
      </div>}
    </div>
  );
}
