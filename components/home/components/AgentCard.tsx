import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import Link from "next/link";
import { AgentInfo } from "@/app/actions";
import { Avatar } from "@heroui/avatar";
import { ScrollShadow } from "@heroui/react";
import { CheckCircle, XCircle } from "lucide-react";

interface AgentCardProps {
  agent: AgentInfo;
  showLink?: boolean;
}

export default function AgentCard({ agent, showLink = true }: AgentCardProps) {
  const agentCard = agent.agentCard;
  const CardContent = () => (
    <Card className="hover:shadow-lg transition-shadow h-full">
      <CardHeader className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <Avatar
            src={agentCard.iconUrl}
            alt={agentCard.name}
            size="sm"
          />
          <h4 className="text-lg font-semibold">{agentCard.name}</h4>
        </div>
        <div className="flex items-center gap-2">
          <Chip
            size="sm"
            variant="flat"
            color={agent.urlVerified ? "success" : "danger"}
            startContent={agent.urlVerified ? <CheckCircle size={14} /> : <XCircle size={14} />}
          >
            {agent.urlVerified ? "Verified" : "Unverified"}
          </Chip>
          {agent.priceRate && (
            <Chip size="sm" variant="flat" color="secondary">
              {agent.priceRate}x
            </Chip>
          )}
          <Chip size="sm" variant="flat" color="primary">
            v{agentCard.version}
          </Chip>
        </div>
      </CardHeader>
      <CardBody className="flex justify-between pt-0">
        <div className="flex flex-col gap-1 h-full">
          <ScrollShadow className="h-full text-sm text-default-500">
            {agentCard.description}
          </ScrollShadow>
        </div>
      </CardBody>
    </Card>
  );

  if (showLink) {
    return (
      <Link href={`/agent/${agent.agentId}`}>
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
} 