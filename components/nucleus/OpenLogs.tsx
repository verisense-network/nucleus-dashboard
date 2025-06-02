import { ENDPOINT } from "@/config/endpoint";
import { Button } from "@heroui/button";
import Link from "next/link";

export default function OpenLogs({ nucleusId }: { nucleusId: string }) {
  return <Link href={`${ENDPOINT.replace(/^ws/, "http")}/${nucleusId}/logs`} target="_blank">
    <Button variant="ghost">Logs</Button>
  </Link>;
}