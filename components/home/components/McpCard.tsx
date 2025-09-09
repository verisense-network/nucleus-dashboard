import { Card, CardBody, CardHeader } from "@heroui/card";
import Link from "next/link";
import { Avatar } from "@heroui/avatar";
import { ScrollShadow, Chip } from "@heroui/react";
import { McpServer } from "@/types/mcp";
import { CheckCircle, XCircle } from "lucide-react";

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
            src={serverCard.logo}
          />
          <div className="flex flex-col">
            <h4 className="text-lg font-semibold">{serverCard.name}</h4>
            {serverCard.providerName && (
              <span className="text-xs text-default-500">{serverCard.providerName}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Chip
            size="sm"
            variant="flat"
            color={serverCard.urlVerified ? "success" : "danger"}
            startContent={serverCard.urlVerified ? <CheckCircle size={14} /> : <XCircle size={14} />}
          >
            {serverCard.urlVerified ? "Verified" : "Unverified"}
          </Chip>
          {serverCard.priceRate && (
            <Chip size="sm" variant="flat" color="secondary">
              {serverCard.priceRate}x
            </Chip>
          )}
        </div>
      </CardHeader>
      <CardBody className="flex justify-between pt-0">
        <div className="flex flex-col gap-3 h-full">
          <ScrollShadow className="flex-1 text-sm text-default-500 whitespace-break-spaces">
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
