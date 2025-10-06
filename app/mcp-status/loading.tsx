import { Spinner } from "@heroui/spinner";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" label="Loading MCP status..." />
      </div>
    </div>
  );
}
