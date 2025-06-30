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
      <div className="flex flex-col gap-2 mb-2">
        <form onSubmit={(e) => {
          e.preventDefault();
          setEndpointStore(newEndpoint);
          setNewEndpoint("");
          onClose();
        }}>
          <Input
            label="Endpoint"
            value={newEndpoint}
            validate={(value) => {
              if (!value) {
                return "Endpoint is required";
              }
              if (!value.startsWith("ws") && !value.startsWith("wss")) {
                return "Endpoint must start with ws or wss";
              }
              if (endpoints.includes(value)) {
                return "Endpoint already exists";
              }
              return true;
            }}
            placeholder="wss://rpc.beta.verisense.network"
            onChange={(e) => setNewEndpoint(e.target.value)}
          />
          <Button type="submit" size="sm" color="primary" className="w-full mt-2">
            Connect
          </Button>
        </form>
      </div>
      <ScrollShadow className="w-full max-h-[200px] mt-4 space-y-1">
        {endpoints.map((endpoint) => (
          <div key={endpoint} className="flex items-center gap-2 justify-between">
            <Button size="sm" className="w-full" onPress={() => setNewEndpoint(endpoint)}>
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