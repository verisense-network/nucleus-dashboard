"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, Tab, Card, CardBody, Spinner, Button } from "@heroui/react";
import { NucleusInfo } from "@/types/nucleus";
import { getNucleusAbi } from "@/app/actions";
import TsFunctionExplorer from "./TsFunctionExplorer";
import CodeBlock from "@/components/CodeBlock";
import { transform } from 'sucrase';
import { generatePolkadotCode } from '@verisense-network/typeinfo-ts'
import * as codecTypes from '@polkadot/types-codec';
import { TypeRegistry } from '@polkadot/types';
import { Registry } from "@polkadot/types/types";
import { HttpProvider, WsProvider } from "@polkadot/rpc-provider";
import { ApiPromise } from "@polkadot/api";
import { u8aToHex } from "@polkadot/util";
import { generateCode } from "./generator";
import { useHydrationEndpointStore } from "@/stores/endpoint";

interface AbiDetailsProps {
  nucleus: NucleusInfo;
}

export default function AbiDetails({ nucleus }: AbiDetailsProps) {
  const [loading, setLoading] = useState(false);
  const [abiData, setAbiData] = useState<any[]>([]);
  const [tsCode, setTsCode] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("types");
  const [{ endpoint }, hydrated] = useHydrationEndpointStore(state => state);


  const loadAbiData = useCallback(async () => {
    if (!hydrated) return;

    setLoading(true);
    setError(null);
    try {
      const rpcUrl = `${endpoint}/${nucleus.id}`;
      const { success, data } = await getNucleusAbi(rpcUrl);
      if (!success) {
        throw new Error(data || "Failed to load ABI");
      }
      setAbiData(data);

      const tsCode = data?.functions ? generatePolkadotCode(data) : await generateCode(data);

      setTsCode(tsCode);

      defineCodecTypesToWindow(tsCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ABI");
    } finally {
      setLoading(false);
    }
  }, [nucleus.id, hydrated]);

  const extractAndExecuteCodeAfterInitApi = useCallback((jsCode: string) => {
    const initApiFunctionStart = jsCode.indexOf('export async function initApi(endpoint)');
    if (initApiFunctionStart === -1) {
      console.log('not found initApi function');
      return;
    }

    let braceCount = 0;
    let functionStart = jsCode.indexOf('{', initApiFunctionStart);
    let currentIndex = functionStart;
    
    if (functionStart === -1) {
      console.log('not found initApi function start brace');
      return;
    }

    braceCount = 1;
    currentIndex = functionStart + 1;
    
    while (currentIndex < jsCode.length && braceCount > 0) {
      if (jsCode[currentIndex] === '{') {
        braceCount++;
      } else if (jsCode[currentIndex] === '}') {
        braceCount--;
      }
      currentIndex++;
    }
    
    if (braceCount !== 0) {
      console.log('initApi function brace not match');
      return;
    }

    const codeAfterInitApi = jsCode.substring(currentIndex).trim();
    
    const processedCode = codeAfterInitApi
      .replace(/export\s+const\s+/g, 'const ')
      .replace(/export\s+let\s+/g, 'let ')
      .replace(/export\s+var\s+/g, 'var ')
      .replace(/export\s+function\s+/g, 'function ')
      .replace(/export\s+async\s+function\s+/g, 'async function ')
      .replace(/export\s+class\s+/g, 'class ')
      .replace(/export\s+default\s+/g, '')
      .replace(/export\s*\{[^}]*\}\s*;?\s*/g, '');

    try {
      const executeCode = `
        function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

        window._optionalChain = _optionalChain;

        ${processedCode}
        
        const definedItems = {};
        
        const codeLines = \`${processedCode}\`.split('\\n');
        codeLines.forEach(line => {
          const trimmed = line.trim();
          
          // check class definition
          const classMatch = trimmed.match(/^class\\s+([A-Za-z_$][A-Za-z0-9_$]*)\\s+extends/);
          if (classMatch) {
            const className = classMatch[1];
            try {
              if (typeof eval(className) !== 'undefined') {
                definedItems[className] = eval(className);
                console.log('found class definition:', className);
              }
            } catch (e) {}
          }
          
          // check function definition
          const funcMatch = trimmed.match(/^(async\\s+)?function\\s+([A-Za-z_$][A-Za-z0-9_$]*)\\s*\\(/);
          if (funcMatch) {
            const funcName = funcMatch[2];
            try {
              if (typeof eval(funcName) === 'function') {
                definedItems[funcName] = eval(funcName);
                console.log('found function definition:', funcName);
              }
            } catch (e) {}
          }
          
          // check const definition
          const constMatch = trimmed.match(/^const\\s+([A-Za-z_$][A-Za-z0-9_$]*)\\s*=/);
          if (constMatch) {
            const constName = constMatch[1];
            try {
              if (typeof eval(constName) !== 'undefined') {
                definedItems[constName] = eval(constName);
                console.log('found constant definition:', constName);
              }
            } catch (e) {}
          }
          
          // check window variable declaration
          const windowAssignMatch = trimmed.match(/\\(window\\)\\.([A-Za-z_$][A-Za-z0-9_$]*)\\s*=/);
          if (windowAssignMatch) {
            const varName = windowAssignMatch[1];
            try {
              if (window[varName]) {
                definedItems[varName] = window[varName];
                console.log('found window variable declaration:', varName);
              }
            } catch (e) {}
          }
        });
        
        // register all defined items to window
        Object.keys(definedItems).forEach(name => {
          try {
            window[name] = definedItems[name];
            if (window.registry && typeof window.registry.register === 'function') {
              window.registry.register({ [name]: definedItems[name] });
            }
            console.log('registered to window and registry:', name);
          } catch (e) {
            console.warn('register failed:', name, e);
          }
        });
      `;
      
      const func = new Function('return (async function() {' + executeCode + '})();');
      func.call(window);
      
      console.log('success execute and process code after initApi function');
    } catch (error) {
      console.error('error execute code after initApi function:', error);
      console.error('error details:', error instanceof Error ? error.stack : String(error));
    }
  }, []);

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

  const defineCodecTypesToWindow = useCallback((tsCode: string) => {
    (window as any).u8aToHex = u8aToHex;
    (window as any).codecTypes = codecTypes;
    const registry = new TypeRegistry() as unknown as Registry;
    (window as any).registry = registry;

    (window as any).HttpProvider = HttpProvider;
    (window as any).WsProvider = WsProvider;
    (window as any).ApiPromise = ApiPromise;
    (window as any).Buffer = Buffer;

    const jsCode = transform(tsCode, { transforms: ['typescript'] }).code;

    const api = new ApiPromise({
      provider: new WsProvider(endpoint.replace('http', 'ws')),
    });

    (window as any).api = api;

    extractAndDefineCodecImports(jsCode);

    extractAndExecuteCodeAfterInitApi(jsCode);
  }, [endpoint, extractAndDefineCodecImports, extractAndExecuteCodeAfterInitApi]);

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
              <CodeBlock
                code={tsCode}
                language="typescript"
                title="TypeScript Code"
              />
            </div>
          </Tab>
          <Tab key="raw" title="Raw">
            <div className="py-4">
              <CodeBlock
                code={JSON.stringify(abiData, null, 2)}
                language="json"
                title="Raw ABI Data"
              />
            </div>
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  );
} 