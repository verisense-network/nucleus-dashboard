import { getNucleusDetail } from "@/app/actions";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import NucleusCard from "@/components/home/components/NucleusCard";
import AbiDetails from "@/components/nucleus/abi/AbiDetails";
import OpenLogs from "@/components/nucleus/OpenLogs";

interface NucleusDetailPageProps {
  params: Promise<{
    nucleusId: string;
  }>;
}

export async function generateMetadata({ params }: NucleusDetailPageProps): Promise<Metadata> {
  const { nucleusId } = await params;

  const result = await getNucleusDetail(nucleusId);

  if (!result.success || !result.data) {
    return {
      title: "Nucleus Not Found",
      description: "The requested Nucleus does not exist or has been deleted",
    };
  }

  const nucleus = result.data;

  return {
    title: `${nucleus.name} - Nucleus Detail`,
    description: `View the detailed information of ${nucleus.name}, including manager, capacity, energy, and other core data.`,
    openGraph: {
      title: `${nucleus.name} - Nucleus Detail`,
      description: `View the detailed information of ${nucleus.name}, including manager, capacity, energy, and other core data.`,
      type: "website",
    },
  };
}

export default async function NucleusDetailPage({ params }: NucleusDetailPageProps) {
  const { nucleusId } = await params;

  const result = await getNucleusDetail(nucleusId);

  if (!result.success || !result.data) {
    if (result.message?.includes("404") || result.message?.includes("not found")) {
      notFound();
    }

    return (
      <div className="w-full mx-auto py-4">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" startContent={<ArrowLeft size={16} />}>
              Back to Home
            </Button>
          </Link>
        </div>

        <Card>
          <CardBody>
            <p className="text-danger">Load data failed: {result.message || "Unknown error"}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const nucleus = result.data;

  return (
    <div className="w-full mx-auto py-4 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <Link href="/">
          <Button variant="ghost" startContent={<ArrowLeft size={16} />}>
            Back to Home
          </Button>
        </Link>
        <OpenLogs nucleusId={nucleusId} />
      </div>

      <NucleusCard nucleus={nucleus} showLink={false} />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Detailed Information</h2>
        <Card>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-default-500 mb-1">Root State</h3>
                  <p className="text-sm font-mono break-all">{nucleus.rootState}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-default-500 mb-1">ID</h3>
                  <p className="text-sm font-mono break-all">{nucleus.id}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-default-500 mb-1">WASM Hash</h3>
                  <p className="text-sm font-mono break-all">{nucleus.wasmHash}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-default-500 mb-1">Manager</h3>
                  <p className="text-sm font-mono break-all">{nucleus.manager}</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">ABI Explorer</h2>
        <AbiDetails nucleus={nucleus} />
      </div>
    </div>
  );
}
