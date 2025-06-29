import { useEndpointStore } from "@/stores/endpoint";
import { Button } from "@heroui/button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export default function OpenLogs({ nucleusId }: { nucleusId: string }) {
  const { endpoint } = useEndpointStore();
  return <Link href={`${endpoint.replace(/^ws/, "http")}/${nucleusId}/logs`} target="_blank">
    <Button variant="ghost" startContent={<ExternalLink size={16} />}>Open Logs</Button>
  </Link>;
}