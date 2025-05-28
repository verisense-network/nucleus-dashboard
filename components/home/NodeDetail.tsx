import { getNodeDetail } from "@/app/actions";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import TooltipTime from "../formatTime/TooltipTime";
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

  const { node_info, network_stats, endpoint } = result.data;

  const nodeDetails = [
    {
      name: "Spec Name",
      render: (node_info: NodeInfo) => (
        <Chip size="sm" variant="flat" color="primary">
          {node_info.spec_name}
        </Chip>
      ),
    },
    {
      name: "Spec Version",
      render: (node_info: NodeInfo) => (
        <span>{node_info.spec_version}</span>
      ),
    },
    {
      name: "Best Block",
      render: (node_info: NodeInfo) => (
        <span>{node_info.best_block.toLocaleString()}</span>
      ),
    },
    {
      name: "Finalized Block",
      render: (node_info: NodeInfo) => (
        <span>{node_info.finalized_block.toLocaleString()}</span>
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
      render: (network_stats: NetworkStats) => (
        <span>{network_stats.total_accounts.toLocaleString()}</span>
      ),
    },
    {
      name: "Total Nucleus",
      render: (network_stats: NetworkStats) => (
        <span>{network_stats.total_nucleus.toLocaleString()}</span>
      ),
    },
    {
      name: "Total Validators",
      render: (network_stats: NetworkStats) => (
        <span>{network_stats.total_validators.toLocaleString()}</span>
      ),
    },
    {   
      name: "Active Validators",
      render: (network_stats: NetworkStats) => (
        <Chip size="sm" variant="flat" color="success">
          {network_stats.active_validators.toLocaleString()}
        </Chip>
      ),
    },  
    {
      name: "Total Issuance",
      render: (network_stats: NetworkStats) => (
        <span>{formatReadableAmount(network_stats.total_issuance, 0)}</span>
      ),
    },
    {
      name: "Staking Ratio",
      render: (network_stats: NetworkStats) => (
        <Chip size="sm" variant="flat" color="warning">
          {(network_stats.staking_ratio * 100).toFixed(2)}%
        </Chip>
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
                  <span>{detail.render(node_info)}</span>
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
                  <span>{detail.render(network_stats)}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
} 