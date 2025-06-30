"use client";

import { Card, CardBody } from "@heroui/card";
import AgentCard from "./components/AgentCard";
import { Button } from "@heroui/button";
import Link from "next/link";
import { AgentInfo, getAgentList } from "@/app/actions";
import { useEffect, useState } from "react";
import { useEndpointStore } from "@/stores/endpoint";
import { Spinner } from "@heroui/react";
import { wrapApiRequest } from "@/utils/api";
import { getAgentListAPI } from "@/api/rpc";

export const ListboxWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full px-1 py-2 rounded-small">{children}</div>
);

export default function AgentList() {
  const { endpoint, status: endpointStatus, isLocalNode } = useEndpointStore();
  const [agentList, setAgentList] = useState<AgentInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAgentList = async () => {
      if (endpointStatus !== "connected") {
        return;
      }

      try {
        setIsLoading(true);
        const result = await wrapApiRequest(getAgentList.bind(null, endpoint), getAgentListAPI.bind(null, endpoint), isLocalNode(endpoint));

        if (!result.success) {
          setError(result.message || "Unknown error");
          return;
        }

        if (result.data) {
          setAgentList(result.data);
        }
      } catch (error) {
        console.error(error);
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAgentList();
  }, [endpoint, endpointStatus]);

  if (endpointStatus === "connecting") {
    return (
      <div className="w-full mx-auto">
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full mx-auto">
        <Card>
          <CardBody>
            <p className="text-danger">Load data failed: {error}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-lg mb-4">Agents</h2>
        <Button size="sm" color="primary">
          <Link href="/register/agent">Register Agent</Link>
        </Button>
      </div>
      <div className="w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="w-full mx-auto">
            <Spinner />
          </div>
        ) : agentList.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-default-500 text-center">No Agent data</p>
            </CardBody>
          </Card>
        ) : (
          agentList.map((agent) => (
            <AgentCard key={`${agent.agentId}-${agent.ownerId}`} agent={agent} showLink={true} />
          ))
        )}
      </div>
    </>
  );
}
