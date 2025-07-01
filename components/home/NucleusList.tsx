"use client";

import { getNucleusList } from "@/app/actions";
import { Card, CardBody } from "@heroui/card";
import { NucleusInfo } from "@/types/nucleus";
import NucleusCard from "./components/NucleusCard";
import { useEffect, useState } from "react";
import { useEndpointStore } from "@/stores/endpoint";
import { Spinner } from "@heroui/react";
import { wrapApiRequest } from "@/utils/api";
import { getNucleusListAPI } from "@/api/nucleus";

export const ListboxWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full px-1 py-2 rounded-small">{children}</div>
);

export default function NucleusList() {
  const { endpoint, status: endpointStatus, isLocalNode } = useEndpointStore();
  const [nucleusList, setNucleusList] = useState<NucleusInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchNucleusList = async () => {
      if (endpointStatus !== "connected") {
        return;
      }

      try {
        setIsLoading(true);
        const result = await wrapApiRequest(getNucleusList.bind(null, endpoint), getNucleusListAPI.bind(null, endpoint), isLocalNode(endpoint));

        if (!result.success) {
          setError(result.message || "Unknown error");
          return;
        }

        if (result.data) {
          setNucleusList(result.data);
        }
      } catch (error) {
        console.error(error);
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchNucleusList();
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
      <h2 className="text-lg mb-4">Nucleus <span className="text-sm text-default-500">({nucleusList.length})</span></h2>
      <div className="w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="w-full mx-auto">
            <Spinner />
          </div>
        ) : nucleusList.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-default-500 text-center">No Nucleus data</p>
            </CardBody>
          </Card>
        ) : (
          nucleusList.map((nucleus: NucleusInfo) => (
            <NucleusCard 
              key={`${nucleus.id}-${nucleus.name}`} 
              nucleus={nucleus} 
              showLink={true}
            />
          ))
        )}
      </div>
    </>
  );
}
