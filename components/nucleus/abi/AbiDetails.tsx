"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, Tab, Card, CardBody, CardHeader, Spinner, Button } from "@heroui/react";
import { NucleusInfo } from "@/types/nucleus";
import { getNucleusAbi } from "@/app/actions";
import TsFunctionExplorer from "./TsFunctionExplorer";

interface AbiDetailsProps {
  nucleus: NucleusInfo;
}

export default function AbiDetails({ nucleus }: AbiDetailsProps) {
  const [loading, setLoading] = useState(false);
  const [abiData, setAbiData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("types");


  const loadAbiData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { success, data } = await getNucleusAbi(nucleus.id);
      if (!success) {
        throw new Error(data || "Failed to load ABI");
      }
      setAbiData(JSON.stringify(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ABI");
    } finally {
      setLoading(false);
    }
  }, [nucleus.id]);
  
  useEffect(() => {
    loadAbiData();
  }, [loadAbiData, nucleus.id]);

  if (loading) {
    return (
      <Card>
        <CardBody className="flex items-center justify-center py-12">
          <Spinner size="lg" />
          <p className="mt-4 text-default-500">Loading ABI...</p>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardBody>
          <p className="text-danger">Error: {error}</p>
          <Button 
            color="primary" 
            variant="flat" 
            className="mt-4"
            onPress={loadAbiData}
          >
            Retry
          </Button>
        </CardBody>
      </Card>
    );
  }

  if (!abiData) {
    return (
      <Card>
        <CardBody>
          <p className="text-default-500">No ABI data available</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">ABI Explorer</h3>
      </CardHeader>
      <CardBody>
        <Tabs 
          selectedKey={activeTab} 
          onSelectionChange={(key) => setActiveTab(key as string)}
          aria-label="ABI tabs"
        >
          <Tab key="types" title="Types & Interfaces">
            <div className="py-4">
              <TsFunctionExplorer 
                codeString={abiData || ""} 
                nucleusId={nucleus.id}
              />
            </div>
          </Tab>
          <Tab key="functions" title="Functions">
            <div className="py-4">
              <TsFunctionExplorer 
                codeString={abiData || ""} 
                nucleusId={nucleus.id}
              />
            </div>
          </Tab>
          <Tab key="raw" title="Raw ABI">
            <div className="py-4">
              <pre className="bg-default-100 p-4 rounded-lg overflow-auto text-xs">
                {JSON.stringify(abiData, null, 2)}
              </pre>
            </div>
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  );
} 