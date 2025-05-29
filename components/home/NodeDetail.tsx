import { getNodeDetail } from "@/app/actions";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { NetworkStats, NodeInfo } from "@/types/node";
import { formatReadableAmount } from "@/utils/format";

export default async function NodeDetail() {
  const result = await getNodeDetail();

  if (!result.success || !result.data) {
    return (
      <div className="w-full">
        <Card>
          <CardBody>
            <p>rpc url: {process.env.NEXT_PUBLIC_API_URL}</p>
            <p className="text-danger">Load node detail failed: {result.message || "Unknown error"}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const { nodeInfo, networkStats, endpoint } = result.data;

  const nodeDetails = [
    {
      name: "Spec Name",
      render: (nodeInfo: NodeInfo) => (
        <Chip size="sm" variant="flat" color="primary">
          {nodeInfo.specName}
        </Chip>
      ),
    },
    {
      name: "Spec Version",
      render: (nodeInfo: NodeInfo) => (
        <span>{nodeInfo.specVersion}</span>
      ),
    },
    {
      name: "Best Block",
      render: (nodeInfo: NodeInfo) => (
        <span>{nodeInfo.bestNumber.toLocaleString()}</span>
      ),
    },
    {
      name: "Finalized Block",
      render: (nodeInfo: NodeInfo) => (
        <span>{nodeInfo.finalizedNumber.toLocaleString()}</span>
      ),
    },
    {
      name: "Endpoint",
      render: () => (
        <span>{endpoint}</span>
      ),
    },
  ]

  const networkDetails = [
    {
      name: "Total Accounts",
      render: (networkStats: NetworkStats) => (
        <span>{networkStats.totalAccounts.toLocaleString()}</span>
      ),
    },
    {
      name: "Total Nucleus",
      render: (networkStats: NetworkStats) => (
        <span>{networkStats.totalNucleus.toLocaleString()}</span>
      ),
    },
    {
      name: "Total Validators",
      render: (networkStats: NetworkStats) => (
        <span>{networkStats.totalValidators.toLocaleString()}</span>
      ),
    },
    {
      name: "Total Issuance",
      render: (networkStats: NetworkStats) => (
        <span>{formatReadableAmount(networkStats.totalIssuance, 0)}</span>
      ),
    },
  ]

  return (
    <>
      <h2 className="text-lg mb-4">Node Information</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <h3 className="text-md font-semibold">Node Status</h3>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="space-y-3">
              {nodeDetails.map((detail) => (
                <div className="flex justify-between items-center" key={detail.name}>
                  <span className="text-default-500">{detail.name}:</span>
                  <span>{detail.render(nodeInfo)}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-md font-semibold">Network Statistics</h3>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="space-y-3">
              {networkDetails.map((detail) => (
                <div className="flex justify-between items-center" key={detail.name}>
                  <span className="text-default-500">{detail.name}:</span>
                  <span>{detail.render(networkStats)}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
} 