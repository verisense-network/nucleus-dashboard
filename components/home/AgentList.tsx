import { Card, CardBody } from "@heroui/card";
import AgentCard from "./components/AgentCard";
import { Button } from "@heroui/button";
import Link from "next/link";
import { getAgentList } from "@/app/actions";

export const ListboxWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full px-1 py-2 rounded-small">{children}</div>
);

export default async function AgentList() {
  const result = await getAgentList();

  if (!result.success || !result.data) {
    return (
      <div className="w-full mx-auto">
        <Card>
          <CardBody>
            <p className="text-danger">Load data failed: {result.message || "Unknown error"}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const agentList = result.data;

  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-lg mb-4">Agents</h2>
        <Button size="sm" color="primary">
          <Link href="/register/agent">Register Agent</Link>
        </Button>
      </div>
      <div className="w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        {agentList.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-default-500 text-center">No Agent data</p>
            </CardBody>
          </Card>
        ) : (
          agentList.map((agent) => (
            <AgentCard key={`${agent.agentId}-${agent.ownerId}`} agent={agent} showLink={true} />
          ))
        )}
      </div>
    </>
  );
}
