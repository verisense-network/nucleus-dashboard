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

  const extractAndDefineConstantTypes = useCallback((jsCode: string) => {
    // 存储类型定义以处理依赖关系
    const typeDefinitions: Array<{
      name: string;
      value: string;
      originalLine: string;
      dependencies: string[];
    }> = [];
    
    // 匹配 export const Name = Type; 格式
    const constantTypeRegex = /export\s+const\s+([A-Za-z_$][A-Za-z0-9_]*)\s*=\s*([^;]+);/g;
    let match;
    
    while ((match = constantTypeRegex.exec(jsCode)) !== null) {
      const typeName = match[1];
      const typeValue = match[2].trim();
      const originalLine = match[0];
      
      console.log(`找到常量类型定义: ${typeName} = ${typeValue}`);
      
      // 分析依赖关系
      const dependencies: string[] = [];
      const dependencyRegex = /\b([A-Z][A-Za-z0-9_]*)\b/g;
      let depMatch;
      
      while ((depMatch = dependencyRegex.exec(typeValue)) !== null) {
        const depName = depMatch[1];
        // 排除已知的基础类型和关键字
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
    
    console.log(`总共找到 ${typeDefinitions.length} 个常量类型定义`);
    
    // 按依赖关系排序，确保依赖的类型先被定义
    const sortedDefinitions = [...typeDefinitions];
    const processed = new Set<string>();
    const result: typeof typeDefinitions = [];
    
    // 简单的拓扑排序
    while (result.length < sortedDefinitions.length) {
      let addedInThisRound = false;
      
      for (const def of sortedDefinitions) {
        if (processed.has(def.name)) continue;
        
        // 检查所有依赖是否已处理
        const canProcess = def.dependencies.every(dep => 
          processed.has(dep) || 
          !typeDefinitions.some(td => td.name === dep) // 依赖不在我们的定义列表中（外部类型）
        );
        
        if (canProcess) {
          result.push(def);
          processed.add(def.name);
          addedInThisRound = true;
        }
      }
      
      // 如果没有任何类型被添加，说明存在循环依赖或其他问题，按原序列添加剩余类型
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
    
    console.log('按依赖关系排序后的类型定义:', result.map(d => d.name).join(', '));
    
    // 定义类型到 window
    result.forEach(({ name, value, originalLine }) => {
      try {
        console.log(`正在定义类型: ${name} = ${value}`);
        
        // 处理不同类型的定义
        if (value.includes('.with(')) {
          // 处理工厂函数调用，如 U8aFixed.with(160 as U8aBitLength)
          const factoryFuncCode = `
            try {
              const result = ${value};
              (window).${name} = result;
              console.log('成功定义工厂类型 ${name}:', result);
              return result;
            } catch (error) {
              console.error('定义工厂类型 ${name} 时出错:', error);
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
            console.log(`成功注册工厂类型 ${name} 到 window 和 registry`);
          }
        } else {
          // 处理简单的类型引用，如 U32, H160
          if (codecTypes[value as keyof typeof codecTypes]) {
            // 直接的 codecTypes 引用
            (window as any)[name] = codecTypes[value as keyof typeof codecTypes];
            (window as any).registry.register({
              [name]: codecTypes[value as keyof typeof codecTypes],
            });
            console.log(`成功注册基础类型 ${name} = ${value} 到 window 和 registry`);
          } else if ((window as any)[value]) {
            // 引用已经在 window 中定义的类型
            (window as any)[name] = (window as any)[value];
            (window as any).registry.register({
              [name]: (window as any)[value],
            });
            console.log(`成功注册引用类型 ${name} = ${value} 到 window 和 registry`);
          } else {
            // 尝试动态执行
            try {
              const evalCode = `
                try {
                  const result = ${value};
                  (window).${name} = result;
                  console.log('成功定义动态类型 ${name}:', result);
                  return result;
                } catch (error) {
                  console.error('定义动态类型 ${name} 时出错:', error);
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
                console.log(`成功注册动态类型 ${name} 到 window 和 registry`);
              }
            } catch (error) {
              console.warn(`无法定义类型 ${name} = ${value}:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`定义类型 ${name} 时出错:`, error);
      }
    });
    
    console.log(`常量类型定义完成，成功注册 ${result.length} 个类型`);
  }, []);

  const defineCodecTypesToWindow = useCallback((tsCode: string) => {
    (window as any).codecTypes = codecTypes;
    const registry = new TypeRegistry() as unknown as Registry;
    (window as any).registry = registry;

    let jsCode = transform(tsCode, { transforms: ['typescript'] }).code;

    jsCode = jsCode.replace(/^\s*export\s+/g, '');

    extractAndDefineCodecImports(jsCode);

    extractClasses(jsCode);
    
    // 添加常量类型提取
    extractAndDefineConstantTypes(jsCode);
  }, [extractAndDefineCodecImports, extractClasses, extractAndDefineConstantTypes]);

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