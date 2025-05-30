"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, Tab, Card, CardBody, Spinner, Button } from "@heroui/react";
import { NucleusInfo } from "@/types/nucleus";
import { getNucleusAbi } from "@/app/actions";
import TsFunctionExplorer from "./TsFunctionExplorer";
import { transform } from 'sucrase';
import { generateCode } from "./generator";
import * as codecTypes from '@polkadot/types-codec';
import { TypeRegistry } from '@polkadot/types';
import { Registry } from "@polkadot/types/types";

interface AbiDetailsProps {
  nucleus: NucleusInfo;
}

export default function AbiDetails({ nucleus }: AbiDetailsProps) {
  const [loading, setLoading] = useState(false);
  const [abiData, setAbiData] = useState<any[]>([]);
  const [tsCode, setTsCode] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("types");


  const loadAbiData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { success, data } = await getNucleusAbi(nucleus.id);
      if (!success) {
        throw new Error(data || "Failed to load ABI");
      }
      setAbiData(data);

      const tsCode = await generateCode(data);

      setTsCode(tsCode);

      defineCodecTypesToWindow(tsCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ABI");
    } finally {
      setLoading(false);
    }
  }, [nucleus.id]);

  const extractAndDefineCodecImports = useCallback((jsCode: string) => {
    const importRegex = /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@polkadot\/types-codec['"];?/gs;
    let match;
    const windowDeclarations: string[] = [];

    while ((match = importRegex.exec(jsCode)) !== null) {
      const importedItems = match[1];

      const items = importedItems
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .split(',')
        .map(item => item.trim())
        .filter(item => item && item !== '')
        .map(item => {
          const aliasMatch = item.match(/^\s*(\w+)\s+as\s+(\w+)\s*$/);
          if (aliasMatch) {
            return { original: aliasMatch[1], alias: aliasMatch[2] };
          }
          const normalMatch = item.match(/^\s*(\w+)\s*$/);
          if (normalMatch) {
            return { original: normalMatch[1], alias: normalMatch[1] };
          }
          return null;
        })
        .filter(item => item !== null) as { original: string; alias: string }[];

      items.forEach(({ original, alias }) => {
        if (codecTypes[original as keyof typeof codecTypes]) {
          (window as any)[alias] = codecTypes[original as keyof typeof codecTypes];
          console.log(`Registered ${alias} to window`);
        }

        windowDeclarations.push(`(window).${alias} = codecTypes.${original};`);
        (window as any).registry.register({
          [alias]: codecTypes[original as keyof typeof codecTypes] as any,
        });
      });
    }

    if (windowDeclarations.length > 0) {
      console.log('Found @polkadot/types-codec imports, added window declarations:', windowDeclarations);
    }
  }, []);

  const extractClasses = useCallback((jsCode: string) => {
    const classStartRegex = /export\s+class\s+(\w+)\s+extends\s+(\w+)\s*\{/g;
    const foundClasses: string[] = [];
    let match;
    const classDefinitions: string[] = [];

    while ((match = classStartRegex.exec(jsCode)) !== null) {
      const className = match[1];
      const baseClass = match[2];
      const startIndex = match.index;
      const openBraceIndex = match.index + match[0].length - 1;

      let braceCount = 1;
      let endIndex = openBraceIndex + 1;

      while (endIndex < jsCode.length && braceCount > 0) {
        if (jsCode[endIndex] === '{') {
          braceCount++;
        } else if (jsCode[endIndex] === '}') {
          braceCount--;
        }
        endIndex++;
      }

      if (braceCount === 0) {
        foundClasses.push(className);

        const fullClassDef = jsCode.substring(startIndex, endIndex);
        const classDefWithoutExport = fullClassDef.replace(/^export\s+/, '');
        classDefinitions.push(classDefWithoutExport);
      }
    }

    if (classDefinitions.length > 0) {
      try {
        for (const classDef of classDefinitions) {
          const classNameMatch = classDef.match(/class\s+(\w+)\s+extends/);
          if (classNameMatch) {
            const className = classNameMatch[1];

            const funcCode = `
              ${classDef}
              return ${className};
            `;

            const func = new Function(funcCode);
            const ClassConstructor = func.call(
              window,
            );

            (window as any)[className] = ClassConstructor;
            console.log(`Successfully registered class ${className} to window`);
          }
        }

        foundClasses.forEach(className => {
          if ((window as any)[className]) {
            (window as any).registry.register({
              [className]: (window as any)[className],
            });
          }
        });

      } catch (error) {
        console.error("Error executing class definitions:", error);
      }
    }

    return foundClasses;
  }, []);

  const defineCodecTypesToWindow = useCallback((tsCode: string) => {
    (window as any).codecTypes = codecTypes;
    const registry = new TypeRegistry() as unknown as Registry;
    (window as any).registry = registry;

    let jsCode = transform(tsCode, { transforms: ['typescript'] }).code;

    jsCode = jsCode.replace(/^\s*export\s+/g, '');

    extractAndDefineCodecImports(jsCode);

    extractClasses(jsCode);
  }, []);

  useEffect(() => {
    loadAbiData();
  }, [loadAbiData, nucleus.id]);

  if (loading) {
    return (
      <Card>
        <CardBody className="flex items-center justify-center py-12">
          <Spinner size="lg" />
          <p className="mt-4 text-default-500">Loading ABI...</p>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardBody>
          <p className="text-danger">Error: {error}</p>
          <Button
            color="primary"
            variant="flat"
            className="mt-4"
            onPress={loadAbiData}
          >
            Retry
          </Button>
        </CardBody>
      </Card>
    );
  }

  if (!abiData) {
    return (
      <Card>
        <CardBody>
          <p className="text-default-500">No ABI data available</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
          aria-label="ABI tabs"
        >
          <Tab key="types" title="Types & Interfaces">
            <div className="py-4">
              <TsFunctionExplorer
                tsCode={tsCode}
                nucleusId={nucleus.id}
                type="type"
              />
            </div>
          </Tab>
          <Tab key="functions" title="Functions">
            <div className="py-4">
              <TsFunctionExplorer
                tsCode={tsCode}
                nucleusId={nucleus.id}
                type="function"
              />
            </div>
          </Tab>
          <Tab key="ts" title="TS Code">
            <div className="py-4">
              <pre className="bg-default-100 p-4 rounded-lg overflow-auto text-xs">
                {tsCode}
              </pre>
            </div>
          </Tab>
          <Tab key="raw" title="Raw ABI">
            <div className="py-4">
              <pre className="bg-default-100 p-4 rounded-lg overflow-auto text-xs">
                {JSON.stringify(abiData, null, 2)}
              </pre>
            </div>
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  );
} 