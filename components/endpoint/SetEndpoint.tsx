"use client";

import { useEndpointStore } from "@/stores/endpoint";
import { Button, Input, ScrollShadow } from "@heroui/react";
import { Trash } from "lucide-react";
import { useState } from "react";

export default function SetEndpoint({ onClose }: { onClose: () => void }) {
  const [newEndpoint, setNewEndpoint] = useState("");
  const { endpoints, setEndpoint: setEndpointStore, removeEndpoint } = useEndpointStore();

  return (
    <div className="w-full mx-auto">
      <div className="flex flex-col gap-2">
        <Input
          label="Endpoint"
          value={newEndpoint}
          validate={(value) => {
            if (!value) {
              return "Endpoint is required";
            }
            if (!value.endsWith("ws") && !value.endsWith("wss")) {
              return "Endpoint must end with ws or wss";
            }
            if (endpoints.includes(value)) {
              return "Endpoint already exists";
            }
            return true;
          }}
          placeholder="wss://rpc.beta.verisense.network"
          onChange={(e) => setNewEndpoint(e.target.value)}
        />
        <Button size="sm" color="primary" className="w-full" onPress={() => {
          setEndpointStore(newEndpoint);
          setNewEndpoint("");
          onClose();
        }}>
          Connect
        </Button>
      </div>
      <ScrollShadow className="w-full h-full mt-4">
        {endpoints.map((endpoint) => (
          <div key={endpoint} className="flex items-center gap-2 justify-between">
            <Button size="sm" color="primary" className="w-full" onPress={() => setNewEndpoint(endpoint)}>
              {endpoint}
            </Button>
            <Button size="sm" color="danger" isIconOnly onPress={() => removeEndpoint(endpoint)}>
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </ScrollShadow>
    </div>
  );
}