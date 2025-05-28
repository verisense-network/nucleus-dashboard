"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Chip } from "@heroui/chip";
import ComplexTypeInputField from "./ComplexTypeInputField";
import { generateCode } from "./generator";

interface TsFunctionExplorerProps {
  codeString: string;
  nucleusId: string;
}

interface ParsedFunction {
  name: string;
  parameters: Parameter[];
  returnType: string;
  description?: string;
}

interface Parameter {
  name: string;
  type: string;
  optional?: boolean;
  customTypeName?: string;
}

interface ParsedInterface {
  name: string;
  fields: InterfaceField[];
}

interface InterfaceField {
  name: string;
  type: string;
  optional?: boolean;
  customTypeName?: string;
  isArray?: boolean;
  isTuple?: boolean;
  itemType?: string;
  tupleItems?: string[];
}

export default function TsFunctionExplorer({ codeString, nucleusId }: TsFunctionExplorerProps) {
  const [functions, setFunctions] = useState<ParsedFunction[]>([]);
  const [interfaces, setInterfaces] = useState<ParsedInterface[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<ParsedFunction | null>(null);
  const [functionInputs, setFunctionInputs] = useState<Record<string, any>>({});
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const isCustomType = useCallback((type: string): boolean => {
    if (!type) return false;
    return /^[A-Z]/.test(type) && !['String', 'Number', 'Boolean', 'Array'].includes(type);
  }, []);

  const isArrayType = useCallback((type: string): boolean => {
    return type.includes('[]') || type.includes('Array<');
  }, []);

  const isTupleType = useCallback((type: string): boolean => {
    return type.startsWith('[') && type.endsWith(']') && type.includes(',');
  }, []);

  const getArrayItemType = useCallback((type: string): string | undefined => {
    if (type.includes('Array<')) {
      const match = type.match(/Array<(.+)>/);
      return match ? match[1] : undefined;
    }
    if (type.includes('[]')) {
      return type.replace('[]', '');
    }
    return undefined;
  }, []);

  const getTupleItems = useCallback((type: string): string[] | undefined => {
    if (isTupleType(type)) {
      const content = type.slice(1, -1);
      return content.split(',').map(item => item.trim());
    }
    return undefined;
  }, []);

  const handleFunctionSelect = useCallback((func: ParsedFunction) => {
    setSelectedFunction(func);
    setFunctionInputs({});
    setResult("");
  }, []);

  const handleInputChange = useCallback((paramName: string, value: any) => {
    setFunctionInputs(prev => ({
      ...prev,
      [paramName]: value,
    }));
  }, []);

  const executeFunction = useCallback(async () => {
    if (!selectedFunction) return;

    setLoading(true);
    try {
      // 这里应该调用实际的函数执行逻辑
      // 目前只是模拟
      const mockResult = {
        function: selectedFunction.name,
        inputs: functionInputs,
        result: "Function executed successfully",
        timestamp: new Date().toISOString(),
      };
      
      setResult(JSON.stringify(mockResult, null, 2));
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [selectedFunction, functionInputs]);

  const parseParameters = useCallback((paramString: string): Parameter[] => {
    if (!paramString.trim()) return [];

    return paramString.split(',').map(param => {
      const trimmed = param.trim();
      const [nameWithOptional, type] = trimmed.split(':').map(s => s.trim());
      const optional = nameWithOptional.includes('?');
      const name = nameWithOptional.replace('?', '');
      
      return {
        name,
        type: type || 'any',
        optional,
        customTypeName: isCustomType(type) ? type : undefined,
      };
    });
  }, [isCustomType]);

  const parseInterfaceFields = useCallback((body: string): InterfaceField[] => {
    const fields: InterfaceField[] = [];
    const lines = body.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) continue;

      const match = trimmed.match(/(\w+)(\?)?:\s*(.+);?/);
      if (match) {
        const [, name, optional, type] = match;
        const cleanType = type.replace(/;$/, '').trim();
        
        fields.push({
          name,
          type: cleanType,
          optional: !!optional,
          customTypeName: isCustomType(cleanType) ? cleanType : undefined,
          isArray: isArrayType(cleanType),
          isTuple: isTupleType(cleanType),
          itemType: getArrayItemType(cleanType),
          tupleItems: getTupleItems(cleanType),
        });
      }
    }

    return fields;
  }, [getArrayItemType, getTupleItems, isArrayType, isCustomType, isTupleType]);

  const parseCodeString = useCallback(async () => {
    if (!codeString) return;

    const entries = JSON.parse(codeString);
    const tsCode = await generateCode(entries);

    const parsedFunctions: ParsedFunction[] = [];
    const parsedInterfaces: ParsedInterface[] = [];

    const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*:\s*([^{;]+)/g;
    let match;

    while ((match = functionRegex.exec(tsCode)) !== null) {
      const [, name, params, returnType] = match;
      const parameters = parseParameters(params);
      
      parsedFunctions.push({
        name,
        parameters,
        returnType: returnType.trim(),
      });
    }

    const interfaceRegex = /interface\s+(\w+)\s*\{([^}]+)\}/g;
    while ((match = interfaceRegex.exec(tsCode)) !== null) {
      const [, name, body] = match;
      const fields = parseInterfaceFields(body);
      
      parsedInterfaces.push({
        name,
        fields,
      });
    }

    console.log("parsedFunctions", JSON.stringify(parsedFunctions, null, 2));
    console.log("parsedInterfaces", JSON.stringify(parsedInterfaces, null, 2));

    setFunctions(parsedFunctions);
    setInterfaces(parsedInterfaces);
  }, [codeString, parseInterfaceFields, parseParameters]);

  useEffect(() => {
    parseCodeString();
  }, [codeString, parseCodeString]);

  return (
    <div className="space-y-6">
      {/* 接口列表 */}
      {interfaces.length > 0 && (
        <Card>
          <CardHeader>
            <h4 className="text-md font-semibold">Interfaces & Types</h4>
          </CardHeader>
          <CardBody>
            <Accordion>
              {interfaces.map((iface, index) => (
                <AccordionItem
                  key={index}
                  aria-label={iface.name}
                  title={
                    <div className="flex items-center gap-2">
                      <Chip size="sm" variant="flat" color="secondary">
                        Interface
                      </Chip>
                      <span className="font-mono">{iface.name}</span>
                    </div>
                  }
                >
                  <div className="space-y-2">
                    {iface.fields.map((field, fieldIndex) => (
                      <div key={fieldIndex} className="flex items-center gap-2 text-sm">
                        <span className="font-mono text-primary">{field.name}</span>
                        {field.optional && <span className="text-warning">?</span>}
                        <span>:</span>
                        <span className="font-mono text-secondary">{field.type}</span>
                        {field.isArray && <Chip size="sm" variant="flat" color="primary">Array</Chip>}
                        {field.isTuple && <Chip size="sm" variant="flat" color="warning">Tuple</Chip>}
                        {field.customTypeName && <Chip size="sm" variant="flat" color="success">Custom</Chip>}
                      </div>
                    ))}
                  </div>
                </AccordionItem>
              ))}
            </Accordion>
          </CardBody>
        </Card>
      )}

      {/* 函数列表 */}
      {functions.length > 0 && (
        <Card>
          <CardHeader>
            <h4 className="text-md font-semibold">Functions</h4>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {functions.map((func, index) => (
                <Card
                  key={index}
                  isPressable
                  isHoverable
                  className={`cursor-pointer ${selectedFunction?.name === func.name ? 'ring-2 ring-primary' : ''}`}
                  onPress={() => handleFunctionSelect(func)}
                >
                  <CardBody>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Chip size="sm" variant="flat" color="primary">Function</Chip>
                        <span className="font-mono font-semibold">{func.name}</span>
                      </div>
                      <div className="text-sm text-default-500">
                        Parameters: {func.parameters.length}
                      </div>
                      <div className="text-sm">
                        Returns: <span className="font-mono">{func.returnType}</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* 函数执行器 */}
      {selectedFunction && (
        <Card>
          <CardHeader>
            <h4 className="text-md font-semibold">Execute: {selectedFunction.name}</h4>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {selectedFunction.parameters.map((param, index) => (
                <div key={index} className="space-y-2">
                  <label className="text-sm font-medium">
                    {param.name}
                    {param.optional && <span className="text-warning ml-1">?</span>}
                    <span className="text-default-500 ml-2">({param.type})</span>
                  </label>
                  
                  {param.customTypeName ? (
                    <ComplexTypeInputField
                      field={{
                        name: param.name,
                        type: param.type,
                        customTypeName: param.customTypeName,
                        value: functionInputs[param.name] || {},
                      }}
                      registry={interfaces}
                      onChange={(value: any) => handleInputChange(param.name, value)}
                    />
                  ) : (
                    <Input
                      placeholder={getPlaceholder(param.type)}
                      value={functionInputs[param.name] || ''}
                      onChange={(e) => handleInputChange(param.name, e.target.value)}
                    />
                  )}
                </div>
              ))}
              
              <Button
                color="primary"
                onPress={executeFunction}
                isLoading={loading}
                className="w-full"
              >
                Execute Function
              </Button>
              
              {result && (
                <div className="mt-4">
                  <label className="text-sm font-medium">Result:</label>
                  <Textarea
                    value={result}
                    readOnly
                    className="mt-2"
                    minRows={5}
                  />
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {functions.length === 0 && interfaces.length === 0 && (
        <Card>
          <CardBody>
            <p className="text-default-500 text-center">No functions or interfaces found in the provided code.</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function getPlaceholder(type: string): string {
  if (type.includes('number') || type.includes('bigint') || /u\d+|i\d+/.test(type)) {
    return '0';
  } else if (type.includes('string') || type.includes('String')) {
    return 'Enter text...';
  } else if (type.includes('boolean')) {
    return 'true/false';
  } else if (type.includes('[]') || type.includes('Array')) {
    return '[]';
  } else {
    return 'Enter value...';
  }
} 