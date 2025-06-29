import NucleusList from "@/components/home/NucleusList";
import AgentList from "@/components/home/AgentList";
import NodeDetail from "@/components/home/NodeDetail";

export default function Home() {
  return (
    <div className="w-full mx-auto py-4 space-y-8">
      <div className="w-full">
        <NodeDetail />
      </div>
      <div className="w-full">
        <AgentList />
      </div>
      <div className="w-full">
        <NucleusList />
      </div>
    </div>
  );
}
