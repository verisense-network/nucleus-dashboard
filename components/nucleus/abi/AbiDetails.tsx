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
import { HttpProvider, WsProvider } from "@polkadot/rpc-provider";
import { ApiPromise } from "@polkadot/api";
import { ENDPOINT } from "@/config/endpoint";

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

  const extractAndDefineConstantTypes = useCallback((jsCode: string) => {
    const typeDefinitions: Array<{
      name: string;
      value: string;
      originalLine: string;
      dependencies: string[];
    }> = [];

    // match export const Name = Type; format
    const constantTypeRegex = /export\s+const\s+([A-Za-z_$][A-Za-z0-9_]*)\s*=\s*([^;]+);/g;
    let match;

    while ((match = constantTypeRegex.exec(jsCode)) !== null) {
      const typeName = match[1];
      const typeValue = match[2].trim();
      const originalLine = match[0];

      // analyze dependencies
      const dependencies: string[] = [];
      const dependencyRegex = /\b([A-Z][A-Za-z0-9_]*)\b/g;
      let depMatch;

      while ((depMatch = dependencyRegex.exec(typeValue)) !== null) {
        const depName = depMatch[1];
        // exclude known base types and keywords
        if (!['U8aFixed', 'U8aBitLength', 'U8', 'U16', 'U32', 'U64', 'U128', 'U256', 'I8', 'I16', 'I32', 'I64', 'I128', 'I256',
          'Bool', 'Text', 'Bytes', 'Null', 'Option', 'Vec', 'Struct', 'Enum', 'Tuple', 'Result', 'with', 'as'].includes(depName)) {
          dependencies.push(depName);
        }
      }

      typeDefinitions.push({
        name: typeName,
        value: typeValue,
        originalLine,
        dependencies
      });
    }

    console.log(`Found ${typeDefinitions.length} constant type definitions`);

    // sort by dependencies, ensure dependent types are defined first
    const sortedDefinitions = [...typeDefinitions];
    const processed = new Set<string>();
    const result: typeof typeDefinitions = [];

    // simple topological sort
    while (result.length < sortedDefinitions.length) {
      let addedInThisRound = false;

      for (const def of sortedDefinitions) {
        if (processed.has(def.name)) continue;

        // check if all dependencies are processed
        const canProcess = def.dependencies.every(dep =>
          processed.has(dep) ||
          !typeDefinitions.some(td => td.name === dep) // dependency not in our definition list (external type)
        );

        if (canProcess) {
          result.push(def);
          processed.add(def.name);
          addedInThisRound = true;
        }
      }

      // if no types are added, there is a circular dependency or other problem, add remaining types in original order
      if (!addedInThisRound) {
        for (const def of sortedDefinitions) {
          if (!processed.has(def.name)) {
            result.push(def);
            processed.add(def.name);
          }
        }
        break;
      }
    }

    // define types to window
    result.forEach(({ name, value, originalLine }) => {
      try {
        console.log(`Defining type: ${name} = ${value}`);

        // handle different type definitions
        if (value.includes('.with(')) {
          // handle factory function calls, e.g. U8aFixed.with(160 as U8aBitLength)
          const factoryFuncCode = `
            try {
              const result = ${value};
              (window).${name} = result;
              console.log('Successfully defined factory type ${name}:', result);
              return result;
            } catch (error) {
              console.error('Error defining factory type ${name}:', error);
              return null;
            }
          `;

          const func = new Function('codecTypes', 'window', factoryFuncCode);
          const typeInstance = func.call(window, codecTypes, window);

          if (typeInstance) {
            (window as any)[name] = typeInstance;
            (window as any).registry.register({
              [name]: typeInstance,
            });
            console.log(`Successfully registered factory type ${name} to window and registry`);
          }
        } else {
          // handle simple type references, e.g. U32, H160
          if (codecTypes[value as keyof typeof codecTypes]) {
            // direct codecTypes reference
            (window as any)[name] = codecTypes[value as keyof typeof codecTypes];
            (window as any).registry.register({
              [name]: codecTypes[value as keyof typeof codecTypes],
            });
            console.log(`Successfully registered base type ${name} = ${value} to window and registry`);
          } else if ((window as any)[value]) {
            // reference already defined in window
            (window as any)[name] = (window as any)[value];
            (window as any).registry.register({
              [name]: (window as any)[value],
            });
            console.log(`Successfully registered reference type ${name} = ${value} to window and registry`);
          } else {
            // try dynamic execution
            try {
              const evalCode = `
                try {
                  const result = ${value};
                  (window).${name} = result;
                  console.log('Successfully defined dynamic type ${name}:', result);
                  return result;
                } catch (error) {
                  console.error('Error defining dynamic type ${name}:', error);
                  return null;
                }
              `;

              const func = new Function('codecTypes', 'window', evalCode);
              const typeInstance = func.call(window, codecTypes, window);

              if (typeInstance) {
                (window as any)[name] = typeInstance;
                (window as any).registry.register({
                  [name]: typeInstance,
                });
                console.log(`Successfully registered dynamic type ${name} to window and registry`);
              }
            } catch (error) {
              console.warn(`Cannot define type ${name} = ${value}:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`Error defining type ${name}:`, error);
      }
    });

    console.log(`Constant type definitions completed, successfully registered ${result.length} types`);
  }, []);

  const extractAndDefineFunctions = useCallback((jsCode: string) => {
    const functionDefinitions: Array<{
      name: string;
      isAsync: boolean;
      parameters: string[];
      body: string;
      fullDefinition: string;
    }> = [];
    const functionPatterns = [
      // Pattern 1: export async function name(...) {  (JavaScript, no types)
      /export\s+async\s+function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(([^)]*)\)\s*\{/g,
      // Pattern 2: export function name(...) {  (JavaScript, no types)
      /export\s+function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(([^)]*)\)\s*\{/g,
      // Pattern 3: More flexible - export (async)? function (JavaScript)
      /export\s+(async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(([^)]*)\)\s*\{/g
    ];

    functionPatterns.forEach((pattern, patternIndex) => {
      pattern.lastIndex = 0; // Reset regex
      let match;
      let patternMatches = 0;

      while ((match = pattern.exec(jsCode)) !== null) {
        const isAsync = patternIndex === 0 || (patternIndex === 2 && !!match[1]);
        const functionName = patternIndex === 2 ? match[2] : match[1];
        const parametersStr = patternIndex === 2 ? match[3] : match[2]; // Updated for new regex groups
        const startIndex = match.index;

        // Re-extract parameters more carefully
        const functionStartMatch = jsCode.substring(startIndex).match(/function\s+[A-Za-z_$][A-Za-z0-9_$]*\s*\(([^)]*)\)/);
        const actualParameters = functionStartMatch ? functionStartMatch[1] : parametersStr;

        // find the complete function body by counting braces
        const openBraceIndex = jsCode.indexOf('{', startIndex);
        if (openBraceIndex === -1) {
          console.log(`No opening brace found for function ${functionName}`);
          continue;
        }

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
          const fullDefinition = jsCode.substring(startIndex, endIndex);
          const functionBody = jsCode.substring(openBraceIndex + 1, endIndex - 1);

          const parameters = actualParameters
            .split(',')
            .map(param => param.trim())
            .filter(param => param)

          functionDefinitions.push({
            name: functionName,
            isAsync,
            parameters,
            body: functionBody,
            fullDefinition
          });

          patternMatches++;
        } else {
          console.log(`Brace mismatch for function ${functionName}, braceCount: ${braceCount}`);
        }
      }
    });

    console.log(`Found ${functionDefinitions.length} function definitions`);

    // If no functions found, let's do a broader search to see what's in the code
    if (functionDefinitions.length === 0) {
      // Look for any function-like patterns
      const broadSearch = /function\s+([A-Za-z_$][A-Za-z0-9_$]*)/g;
      let broadMatch;
      const foundFunctionNames = [];

      while ((broadMatch = broadSearch.exec(jsCode)) !== null) {
        foundFunctionNames.push(broadMatch[1]);
      }

      console.log('Found function names in code:', foundFunctionNames);

      // Look for export patterns
      const exportSearch = /export\s+[^;{]+/g;
      let exportMatch;
      const foundExports = [];

      while ((exportMatch = exportSearch.exec(jsCode)) !== null) {
        foundExports.push(exportMatch[0]);
      }
    }

    // define functions to window
    functionDefinitions.forEach(({ name, isAsync, parameters, body, fullDefinition }) => {
      try {
        console.log(`Defining function: ${name}`);

        // Extract original parameter list with types for the function signature
        const originalParamsMatch = fullDefinition.match(/function\s+[^(]*\(([^)]*)\)/);
        const originalParams = originalParamsMatch ? originalParamsMatch[1] : parameters.join(', ');

        // create function wrapper that has access to required globals
        const functionWrapper = `
          ${isAsync ? 'async ' : ''}function ${name}(${originalParams}) {
              ${body}
            }
        `;

        const func = new Function(`
            ${functionWrapper}
            
            return ${name};
          `);

        const functionInstance = func.call(window, codecTypes, window);

        if (functionInstance) {
          (window as any)[name] = functionInstance;
          console.log(`Successfully registered function ${name} to window`);
        }
      } catch (error) {
        console.error(`Error defining function ${name}:`, error);
      }
    });

    console.log(`Function definitions completed, successfully registered ${functionDefinitions.length} functions`);
  }, []);

  const extractAndDefineHelperFunctions = useCallback((jsCode: string) => {
    const helperFunctions: { name: string; code: string }[] = [];
    
    const functionStartPattern = /function\s+(_[A-Za-z_$][A-Za-z0-9_$]*)\s*\([^)]*\)\s*\{/g;
    let match;
    
    while ((match = functionStartPattern.exec(jsCode)) !== null) {
      const functionName = match[1];
      const startIndex = match.index;
      const openBraceIndex = match.index + match[0].length - 1;
      
      let braceCount = 1;
      let currentIndex = openBraceIndex + 1;
      
      while (currentIndex < jsCode.length && braceCount > 0) {
        const char = jsCode[currentIndex];
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
        }
        currentIndex++;
      }
      
      if (braceCount === 0) {
        const endIndex = currentIndex;
        const functionCode = jsCode.substring(startIndex, endIndex);
        
        helperFunctions.push({
          name: functionName,
          code: functionCode
        });
      } else {
        console.log(`function ${functionName} braceCount: ${braceCount}`);
      }
    }
    
    helperFunctions.forEach(({ name, code }) => {
      try {
        const func = new Function(`
          ${code}
          return ${name};
        `);
        
        const functionInstance = func();
        if (functionInstance) {
          (window as any)[name] = functionInstance;
          console.log(`Successfully registered helper function ${name} to window`);
        }
      } catch (error) {
        console.error(`Error registering helper function ${name}:`, error);
        console.error(`helper function code:`, code);
      }
    });
    
    console.log(`helper functions registered, total ${helperFunctions.length} functions`);
  }, []);

  const defineCodecTypesToWindow = useCallback((tsCode: string) => {
    (window as any).codecTypes = codecTypes;
    const registry = new TypeRegistry() as unknown as Registry;
    (window as any).registry = registry;

    (window as any).HttpProvider = HttpProvider;
    (window as any).WsProvider = WsProvider;
    (window as any).ApiPromise = ApiPromise;
    (window as any).Buffer = Buffer;

    const jsCode = transform(tsCode, { transforms: ['typescript'] }).code;

    extractAndDefineHelperFunctions(jsCode);

    extractAndDefineCodecImports(jsCode);

    extractClasses(jsCode);

    extractAndDefineConstantTypes(jsCode);

    extractAndDefineFunctions(jsCode);

    const api = new ApiPromise({
      provider: new WsProvider(ENDPOINT.replace('http', 'ws')),
    });

    (window as any).api = api;
  }, [extractAndDefineCodecImports, extractClasses, extractAndDefineConstantTypes, extractAndDefineFunctions, extractAndDefineHelperFunctions]);

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
          <Tab key="raw" title="Raw">
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