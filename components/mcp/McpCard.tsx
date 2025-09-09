import { Card, CardBody, CardHeader } from "@heroui/card";
import Link from "next/link";
import { Avatar, Chip } from "@heroui/react";
import { ScrollShadow } from "@heroui/react";
import { McpServer } from "@/types/mcp";
import { Server, Globe, User } from "lucide-react";

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
          <div className="p-2 bg-primary/10 rounded-lg">
            {serverCard.logo ? (
              <Avatar
                src={serverCard.logo}
                alt={`${serverCard.name} logo`}
                className="w-6 h-6"
                fallback={<Server className="w-4 h-4 text-primary" />}
              />
            ) : (
              <Server className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className="flex flex-col">
            <h4 className="text-lg font-semibold">{serverCard.name}</h4>
            {serverCard.providerName && (
              <div className="flex items-center gap-1 text-sm text-default-500">
                <User className="w-3 h-3" />
                <span>{serverCard.providerName}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1 items-end">
          {serverCard.priceRate !== undefined && (
            <Chip size="sm" color="secondary" variant="flat">
              {serverCard.priceRate}x
            </Chip>
          )}
          {serverCard.providerWebsite && (
            <a
              href={serverCard.providerWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              onClick={(e) => e.stopPropagation()}
            >
              <Globe className="w-3 h-3" />
              Website
            </a>
          )}
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
