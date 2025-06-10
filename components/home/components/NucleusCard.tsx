import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { NucleusInfo } from "@/types/nucleus";
import Link from "next/link";

interface NucleusCardProps {
  nucleus: NucleusInfo;
  showLink?: boolean;
}

export default function NucleusCard({ nucleus, showLink = true }: NucleusCardProps) {
  const CardContent = () => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardBody className="flex justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-semibold">{nucleus.name}</h4>
            {nucleus.a2aCompatiable && (
              <Chip size="sm" variant="flat" color="success">
                Agent
              </Chip>
            )}
            <div className="flex items-end gap-2">
              <Chip size="sm" variant="flat" color="primary">
                Version: {nucleus.wasmVersion}
              </Chip>
            </div>
          </div>
          <div className="flex items-center gap-2 text-default-500">
            <span className="text-sm">ID: {nucleus.id}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );

  if (showLink) {
    return (
      <Link href={`/nuclei/${nucleus.id}`} className="block">
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
} 