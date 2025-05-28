import { getNucleusList } from "@/app/actions";
import { Card, CardBody } from "@heroui/card";
import { NucleusInfo } from "@/types/nucleus";
import NucleusCard from "./components/NucleusCard";

export const ListboxWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full px-1 py-2 rounded-small">{children}</div>
);

export default async function NucleusList() {
  const result = await getNucleusList();

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

  const nucleusList = result.data;

  return (
    <>
      <h2 className="text-lg mb-4">Nucleus</h2>
      <div className="w-full mx-auto space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {nucleusList.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-default-500 text-center">No Nucleus data</p>
            </CardBody>
          </Card>
        ) : (
          nucleusList.map((nucleus: NucleusInfo) => (
            <NucleusCard 
              key={`${nucleus.id}-${nucleus.name}`} 
              nucleus={nucleus} 
              showLink={true}
            />
          ))
        )}
      </div>
    </>
  );
}
