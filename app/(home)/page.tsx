import NucleusList from "@/components/home/NucleusList";
import AgentList from "@/components/home/AgentList";
import NodeDetail from "@/components/home/NodeDetail";
import { MetaData } from "@/config/website";

export const dynamic = 'force-dynamic';

export const revalidate = 0;

export async function generateMetadata() {
  return {
    title: MetaData.title,
    description: MetaData.description,
  };
}

export default async function Home() {
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
