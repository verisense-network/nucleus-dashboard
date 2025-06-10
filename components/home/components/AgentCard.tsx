import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import Link from "next/link";
import { AgentInfo } from "@/app/actions";
import { Avatar } from "@heroui/avatar";

interface AgentCardProps {
  agent: AgentInfo;
  showLink?: boolean;
}

export default function AgentCard({ agent, showLink = true }: AgentCardProps) {
  const agentCard = agent.agentCard;
  const CardContent = () => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardBody className="flex justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <Avatar
                src={agentCard.iconUrl}
                alt={agentCard.name}
                size="sm"
              />
              <h4 className="text-lg font-semibold">{agentCard.name}</h4>
            </div>
            <div className="flex items-end gap-2">
              <Chip size="sm" variant="flat" color="primary">
                Version: {agentCard.version}
              </Chip>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-default-500">
              {agentCard.description}
            </p>
          </div>
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