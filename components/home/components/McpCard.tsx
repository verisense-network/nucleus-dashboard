import { Card, CardBody, CardHeader } from "@heroui/card";
import Link from "next/link";
import { Avatar } from "@heroui/avatar";
import { ScrollShadow } from "@heroui/react";
import { McpServer } from "@/types/mcp";

interface McpCardProps {
  mcpServer: McpServer;
  showLink?: boolean;
}

export default function McpCard({ mcpServer, showLink = true }: McpCardProps) {
  const serverCard = mcpServer;
  const CardContent = () => (
    <Card className="hover:shadow-lg transition-shadow h-full">
      <CardHeader className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <Avatar
            alt={serverCard.name}
            size="sm"
          />
          <h4 className="text-lg font-semibold">{serverCard.name}</h4>
        </div>
      </CardHeader>
      <CardBody className="flex justify-between pt-0">
        <div className="flex flex-col gap-1 h-full">
          <ScrollShadow className="h-full text-sm text-default-500 whitespace-break-spaces">
            {serverCard.description}
          </ScrollShadow>
        </div>
      </CardBody>
    </Card>
  );

  if (showLink) {
    return (
      <Link href={`/mcp/${mcpServer.id}`}>
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
}
