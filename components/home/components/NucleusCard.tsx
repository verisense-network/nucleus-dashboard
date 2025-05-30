import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { User } from "@heroui/user";
import { Chip } from "@heroui/chip";
import { NucleusInfo } from "@/types/nucleus";
import { AddressViewFormat } from "@/utils/format";
import Link from "next/link";

interface NucleusCardProps {
  nucleus: NucleusInfo;
  showLink?: boolean;
}

export default function NucleusCard({ nucleus, showLink = true }: NucleusCardProps) {
  const details = [
    {
      name: "Manager",
      render: (nucleus: NucleusInfo) => (
        <AddressViewFormat address={nucleus.manager} bracket={false} />
      ),
    },
    {
      name: "Capacity",
      render: (nucleus: NucleusInfo) => (
        <span>{nucleus.capacity}</span>
      ),
    },
    {
      name: "Energy",
      render: (nucleus: NucleusInfo) => (
        <span>{nucleus.energy}</span>
      ),
    },
    {
      name: "Current Event",
      render: (nucleus: NucleusInfo) => (
        <span>{nucleus.currentEvent}</span>
      ),
    },
    {
      name: "WASM Hash",
      render: (nucleus: NucleusInfo) => (
        <AddressViewFormat address={nucleus.wasmHash} bracket={false} />
      ),
    },
    {
      name: "Location",
      render: (nucleus: NucleusInfo) => (
        nucleus.wasmLocation ? <AddressViewFormat address={nucleus.wasmLocation} bracket={false} /> : "-"
      ),
    },
  ];

  const CardContent = () => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-semibold">{nucleus.name}</h4>
            {nucleus.a2aCompatiable && (
              <Chip size="sm" variant="flat" color="success">
                A2A
              </Chip>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">ID: {nucleus.id}</span>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <Chip size="sm" variant="flat" color="primary">
            Version: {nucleus.wasmVersion}
          </Chip>
        </div>
      </CardHeader>
      <Divider />
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {details.map((detail) => (
            <div className="flex justify-between text-sm space-x-2" key={detail.name}>
              <span className="text-default-500">{detail.name}:</span>
              <span>{detail.render(nucleus)}</span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );

  if (showLink) {
    return (
      <Link href={`/${nucleus.id}`} className="block">
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
} 