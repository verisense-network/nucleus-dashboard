"use client";

import { getNodeDetail } from "@/app/actions";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { NetworkStats, NodeInfo } from "@/types/node";
import { formatReadableAmount } from "@/utils/format";
import { useEndpointStore } from "@/stores/endpoint";
import { useEffect, useMemo, useState } from "react";
import { Spinner } from "@heroui/react";
import { getNodeDetailAPI } from "@/api/node";
import { wrapApiRequest } from "@/utils/api";

export default function NodeDetail() {
  const { endpoint, status, isLocalNode } = useEndpointStore();

  const [nodeInfo, setNodeInfo] = useState<NodeInfo | null>(null);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setError(null)
    const fetchNodeDetail = async () => {
      try {
        if (!endpoint) {
          setError("Endpoint is required");
          return;
        }

        setIsLoading(true);

        const result = await wrapApiRequest(getNodeDetail.bind(null, endpoint), getNodeDetailAPI.bind(null, endpoint), isLocalNode(endpoint));

        if (!result.success) {
          setError(result.message || "Unknown error");
          return;
        }

        if (result.data) {
          setNodeInfo(result.data.nodeInfo);
          setNetworkStats(result.data.networkStats);
        }

      } catch (error) {
        console.error(error);
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchNodeDetail();
  }, [endpoint]);

  const nodeDetails = useMemo(() => {
    if (!nodeInfo) return [];

    return [
      {
        name: "Spec Name",
        render: (nodeInfo: NodeInfo) => (
          <Chip size="sm" variant="flat" color="primary">
            {nodeInfo.specName}
          </Chip>
        ),
      },
      {
        name: "Spec Version",
        render: (nodeInfo: NodeInfo) => (
          <span>{nodeInfo.specVersion}</span>
        ),
      },
      {
        name: "Best Block",
        render: (nodeInfo: NodeInfo) => (
          <span>{nodeInfo.bestNumber.toLocaleString()}</span>
        ),
      },
      {
        name: "Finalized Block",
        render: (nodeInfo: NodeInfo) => (
          <span>{nodeInfo.finalizedNumber.toLocaleString()}</span>
        ),
      },
      {
        name: "Endpoint",
        render: () => (
          <span className="flex items-center gap-2">
            {endpoint}
          </span>
        ),
      },
    ]
  }, [endpoint, nodeInfo]);

  const networkDetails = useMemo(() => {
    if (!networkStats) return [];

    return [
      {
        name: "Total Accounts",
        render: (networkStats: NetworkStats) => (
          <span>{networkStats.totalAccounts.toLocaleString()}</span>
        ),
      },
      {
        name: "Total Nucleus",
        render: (networkStats: NetworkStats) => (
          <span>{networkStats.totalNucleus.toLocaleString()}</span>
        ),
      },
      {
        name: "Total Validators",
        render: (networkStats: NetworkStats) => (
          <span>{networkStats.totalValidators.toLocaleString()}</span>
        ),
      },
      {
        name: "Total Issuance",
        render: (networkStats: NetworkStats) => (
          <span>{formatReadableAmount(networkStats.totalIssuance, 0)}</span>
        ),
      },
    ];
  }, [networkStats]);

  if (error) {
    return (
      <div className="w-full">
        <Card>
          <CardBody>
            <p>rpc url: {endpoint}</p>
            <p className="text-danger">Load node detail failed: {error}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (status === "connecting") {
    return (
      <div className="w-full">
        <Card>
          <CardBody>
            <div className="flex flex-col items-center gap-2">
              <Spinner size="lg" />
              <p>connecting to: {endpoint}</p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full">
        <Card>
          <CardBody>
            <Spinner size="lg" />
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-lg mb-4">Node Information</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <h3 className="text-md font-semibold">Node Status</h3>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="space-y-3">
              {nodeDetails.map((detail) => (
                <div className="flex justify-between items-center" key={detail.name}>
                  <span className="text-default-500">{detail.name}:</span>
                  <span>{detail.render(nodeInfo!)}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-md font-semibold">Network Statistics</h3>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="space-y-3">
              {networkDetails.map((detail) => (
                <div className="flex justify-between items-center" key={detail.name}>
                  <span className="text-default-500">{detail.name}:</span>
                  <span>{detail.render(networkStats!)}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
} 