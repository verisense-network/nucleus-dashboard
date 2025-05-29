"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Chip } from "@heroui/chip";
import { Switch } from "@heroui/switch";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import * as codecTypes from '@polkadot/types-codec';

interface TsFunctionExplorerProps {
  tsCode: string;
  nucleusId: string;
  type: 'type' | 'function' | 'all';
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

interface ExtractedClass {
  name: string;
  type: string;
  definition: string;
  debugMode: boolean;
  fields?: DebugField[];
  variants?: DebugVariant[];
  valueType?: string;
  debugValue?: string;
  selectedVariant?: string;
  debugResult?: string | null;
  baseType?: string;
  itemType?: string;
  length?: number;
  vecValues?: string[];
}

interface DebugField {
  name: string;
  type: string;
  value: any;
  isVec: boolean;
  isTuple: boolean;
  isOption: boolean;
  isStruct: boolean;
  itemType?: string;
  tupleItems?: { type: string; value: any; index: number }[];
  nestedFields?: DebugField[];
  hasValue?: boolean;
  valueType?: string;
  items?: { value: any }[];
  referencedStructName?: string;
}

interface DebugVariant {
  name: string;
  type?: string;
  hasValue: boolean;
  value: any;
}

export default function TsFunctionExplorer({ tsCode, nucleusId, type }: TsFunctionExplorerProps) {
  const [functions, setFunctions] = useState<ParsedFunction[]>([]);
  const [extractedClasses, setExtractedClasses] = useState<ExtractedClass[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<ParsedFunction | null>(null);
  const [functionInputs, setFunctionInputs] = useState<Record<string, any>>({});
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const toggleDebugMode = useCallback((index: number) => {
    setExtractedClasses(prev => prev.map((item, i) => 
      i === index ? { ...item, debugMode: !item.debugMode } : item
    ));
  }, []);

  const updateDebugValue = useCallback((classIndex: number, fieldPath: string, value: any) => {
    setExtractedClasses(prev => prev.map((item, i) => {
      if (i !== classIndex) return item;
      
      const updated = { ...item };
      
      if (fieldPath === 'debugValue') {
        updated.debugValue = value;
      } else if (fieldPath === 'selectedVariant') {
        updated.selectedVariant = value;
      } else if (fieldPath.includes('vecValues')) {
        const vecIndex = parseInt(fieldPath.split('[')[1]?.split(']')[0] || '0');
        if (updated.vecValues) {
          updated.vecValues[vecIndex] = value;
        }
      } else if (updated.fields) {
        const pathParts = fieldPath.split('.');
        updated.fields = updateFieldValue(updated.fields, pathParts, value);
      }
      
      return updated;
    }));
  }, []);

  const updateFieldValue = useCallback((fields: DebugField[], pathParts: string[], value: any): DebugField[] => {
    return fields.map(field => {
      if (field.name === pathParts[0]) {
        if (pathParts.length === 2 && pathParts[1] === 'value') {
          return { ...field, value };
        } else if (pathParts.length > 2 && field.nestedFields) {
          return {
            ...field,
            nestedFields: updateFieldValue(field.nestedFields, pathParts.slice(1), value)
          };
        } else if (pathParts[1]?.includes('[') && field.items) {
          const itemIndex = parseInt(pathParts[1].split('[')[1]?.split(']')[0] || '0');
          const newItems = [...field.items];
          if (newItems[itemIndex]) {
            newItems[itemIndex] = { ...newItems[itemIndex], value };
          }
          return { ...field, items: newItems };
        }
      }
      return field;
    });
  }, []);

  const executeDebug = useCallback(async (classIndex: number) => {
    const codecClass = extractedClasses[classIndex];
    if (!codecClass) return;

    try {
      let result = '';
      
      if (codecClass.type === 'Struct' && codecClass.fields) {
        const structData: any = {};
        codecClass.fields.forEach(field => {
          if (field.value !== '') {
            structData[field.name] = field.value;
          }
        });
        
        const StructType = (window as any)[codecClass.name];
        if (StructType) {
          const instance = new StructType(structData);
          result = `Created ${codecClass.name}: ${instance.toString()}`;
        } else {
          result = `Structure data: ${JSON.stringify(structData, null, 2)}`;
        }
      } else if (codecClass.type === 'Enum' && codecClass.variants && codecClass.selectedVariant) {
        const selectedVariant = codecClass.variants.find(v => v.name === codecClass.selectedVariant);
        if (selectedVariant) {
          const enumData = selectedVariant.hasValue ? 
            { [selectedVariant.name]: selectedVariant.value || '' } :
            selectedVariant.name;
          
          const EnumType = (window as any)[codecClass.name];
          if (EnumType) {
            const instance = new EnumType(enumData);
            result = `Created ${codecClass.name}: ${instance.toString()}`;
          } else {
            result = `Enum data: ${JSON.stringify(enumData, null, 2)}`;
          }
        }
      } else if (codecClass.type === 'VecFixed' && codecClass.vecValues) {
        const VecFixedType = (window as any)[codecClass.name];
        if (VecFixedType) {
          const instance = new VecFixedType(codecClass.vecValues);
          result = `Created ${codecClass.name}: ${instance.toString()}`;
        } else {
          result = `VecFixed data: [${codecClass.vecValues.join(', ')}]`;
        }
      } else if (codecClass.debugValue !== '') {
        const Type = (window as any)[codecClass.name];
        if (Type) {
          const instance = new Type(codecClass.debugValue);
          result = `Created ${codecClass.name}: ${instance.toString()}`;
        } else {
          result = `Value: ${codecClass.debugValue}`;
        }
      }
      
      setExtractedClasses(prev => prev.map((item, i) => 
        i === classIndex ? { ...item, debugResult: result } : item
      ));
    } catch (error) {
      const errorMsg = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setExtractedClasses(prev => prev.map((item, i) => 
        i === classIndex ? { ...item, debugResult: errorMsg } : item
      ));
    }
  }, [extractedClasses]);

  const addVecItem = useCallback((classIndex: number) => {
    setExtractedClasses(prev => prev.map((item, i) => {
      if (i === classIndex && item.vecValues) {
        return { ...item, vecValues: [...item.vecValues, ''] };
      }
      return item;
    }));
  }, []);

  const removeVecItem = useCallback((classIndex: number, itemIndex: number) => {
    setExtractedClasses(prev => prev.map((item, i) => {
      if (i === classIndex && item.vecValues) {
        return { 
          ...item, 
          vecValues: item.vecValues.filter((_, idx) => idx !== itemIndex) 
        };
      }
      return item;
    }));
  }, []);

  const isCustomType = useCallback((type: string): boolean => {
    if (!type) return false;
    return /^[A-Z]/.test(type) && !['String', 'Number', 'Boolean', 'Array'].includes(type);
  }, []);

  const isTupleType = useCallback((type: string): boolean => {
    return type.startsWith('[') && type.endsWith(']') && type.includes(',');
  }, []);

  const isVecType = useCallback((type: string): boolean => {
    return type.includes('Vec<') || type.includes('[]') || type.includes('VecFixed');
  }, []);

  const isOptionType = useCallback((type: string): boolean => {
    return type.includes('Option<');
  }, []);

  const parseStructFields = useCallback((structContent: string): DebugField[] => {
    const fields: DebugField[] = [];
    const fieldRegex = /\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*([^;\n]+)/g;
    let fieldMatch;
    
    while ((fieldMatch = fieldRegex.exec(structContent)) !== null) {
      const fieldName = fieldMatch[1];
      const fieldType = fieldMatch[2].trim();
      
      fields.push({
        name: fieldName,
        type: fieldType,
        value: '',
        isVec: isVecType(fieldType),
        isTuple: isTupleType(fieldType),
        isOption: isOptionType(fieldType),
        isStruct: false
      });
    }
    
    return fields;
  }, [isVecType, isTupleType, isOptionType]);

  const defineStructInGlobalScope = useCallback((structName: string, fields: DebugField[]) => {
    const fieldTypes = fields.reduce((acc: any, field) => {
      acc[field.name] = field.type;
      return acc;
    }, {});
    
    (window as any)[structName] = codecTypes.Struct.with(fieldTypes);
  }, []);

  const extractStructDefinitions = useCallback((code: string, extractedClasses: ExtractedClass[]) => {
    const structRegex = /\bstruct\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*{([^}]*)}/g;
    let structMatch;
    
    while ((structMatch = structRegex.exec(code)) !== null) {
      const structName = structMatch[1];
      const structContent = structMatch[2];
      
      const fields = parseStructFields(structContent);
      
      extractedClasses.push({
        name: structName,
        type: 'Struct',
        definition: `struct ${structName} { ... }`,
        fields: fields,
        debugMode: false,
        debugResult: ''
      });
      
      defineStructInGlobalScope(structName, fields);
    }
  }, [parseStructFields, defineStructInGlobalScope]);

  const extractClassDefinitions = useCallback((code: string, extractedClasses: ExtractedClass[]) => {
    const classRegex = /\bexport\s+class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)(?:\s+extends\s+([a-zA-Z_$][a-zA-Z0-9_$]*))?(?:\s+implements\s+[^<{]+)?\s*{/g;
    let match;

    while ((match = classRegex.exec(code)) !== null) {
      const className = match[1];
      const extendsClass = match[2] || null;
      const startIndex = match.index;
      
      const endIndex = findClassEndIndex(code, startIndex);
      if (endIndex === -1) {
        continue;
      }

      const classTSCode = code.substring(startIndex, endIndex);
      defineClassInGlobalScope(className, classTSCode, extendsClass, extractedClasses);
    }
  }, []);

  const findClassEndIndex = useCallback((code: string, startIndex: number): number => {
    let openBraces = 1;
    let endIndex = -1;
    
    let searchStartIndex = code.indexOf('{', startIndex) + 1;
    if (searchStartIndex === 0) {
      return -1;
    }

    for (let i = searchStartIndex; i < code.length; i++) {
      if (code[i] === '{') {
        openBraces++;
      } else if (code[i] === '}') {
        openBraces--;
        if (openBraces === 0) {
          endIndex = i + 1;
          break;
        }
      }
    }
    
    return endIndex;
  }, []);

  const defineClassInGlobalScope = useCallback((className: string, classTSCode: string, extendsClass: string | null, extractedClasses: ExtractedClass[]) => {
    try {
      const structInfo = extractPolkadotTypeInfo(classTSCode, className, extendsClass);
      if (structInfo) {
        extractedClasses.push(structInfo);
      }
    } catch (error) {
      console.error(`Transform ${className} Error:`, error);
    }
  }, []);

  const extractPolkadotTypeInfo = useCallback((classCode: string, className: string, extendsClass: string | null): ExtractedClass | null => {
    const polkadotTypes = ['Struct', 'Enum', 'Vec', 'Tuple', 'Compact', 'Option'];
    if (!extendsClass || !polkadotTypes.includes(extendsClass)) {
      return null;
    }

    const constructorRegex = /constructor\s*\([^)]*\)\s*{\s*super\s*\([^,]*,\s*({(?:[^{}]*|\{[^{}]*\})*})(?:,\s*[^)]*)\)\s*;/;
    const match = classCode.match(constructorRegex);

    if (!match || !match[1]) {
      
      const relaxedRegex = /super\s*\([^,]*,\s*({[^}]*})/;
      const relaxedMatch = classCode.match(relaxedRegex);
      
      if (!relaxedMatch || !relaxedMatch[1]) {
        return null;
      }
      
      const typeDefObj = relaxedMatch[1];
      
      let formattedTypeDef = '';
      let debugFields: DebugField[] = [];
      let debugVariants: DebugVariant[] = [];
      let valueType = null;

      if (extendsClass === 'Enum') {
        const result = formatEnumTypeDef(typeDefObj, className);
        formattedTypeDef = result.formattedTypeDef;
        debugVariants = result.variants;
      } else {
        formattedTypeDef = `${extendsClass}<${className}> ${typeDefObj.replace(/[{\s}]/g, ' ').trim()}`;
      }

      return {
        name: className,
        type: extendsClass,
        definition: formattedTypeDef,
        debugMode: false,
        fields: debugFields,
        variants: debugVariants,
        valueType: valueType || undefined,
        debugValue: '',
        selectedVariant: debugVariants.length > 0 ? debugVariants[0].name : undefined,
        debugResult: null
      };
    }

    const typeDefObj = match[1];

    let formattedTypeDef = '';
    let debugFields: DebugField[] = [];
    let debugVariants: DebugVariant[] = [];
    let valueType = null;

    if (extendsClass === 'Struct') {
      const result = formatStructTypeDef(typeDefObj, className);
      formattedTypeDef = result.formattedTypeDef;
      debugFields = result.fields;
    } else if (extendsClass === 'Enum') {
      const result = formatEnumTypeDef(typeDefObj, className);
      formattedTypeDef = result.formattedTypeDef;
      debugVariants = result.variants;
    } else if (extendsClass === 'Vec') {
      const vecTypeMatch = typeDefObj.match(/([A-Za-z0-9_]+)/);
      if (vecTypeMatch) {
        valueType = vecTypeMatch[1];
        formattedTypeDef = `Vec<${valueType}>`;
      } else {
        formattedTypeDef = `Vec<${className}>`;
      }
    } else if (extendsClass === 'Option') {
      const optionTypeMatch = typeDefObj.match(/([A-Za-z0-9_]+)/);
      if (optionTypeMatch) {
        valueType = optionTypeMatch[1];
        formattedTypeDef = `Option<${valueType}>`;
      } else {
        formattedTypeDef = `Option<${className}>`;
      }
    } else {
      formattedTypeDef = `${extendsClass}<${className}> ${typeDefObj.replace(/[{\s}]/g, ' ').trim()}`;
    }

    return {
      name: className,
      type: extendsClass,
      definition: formattedTypeDef,
      debugMode: false,
      fields: debugFields,
      variants: debugVariants,
      valueType: valueType || undefined,
      debugValue: '',
      selectedVariant: debugVariants.length > 0 ? debugVariants[0].name : undefined,
      debugResult: null
    };
  }, []);

  const formatStructTypeDef = useCallback((typeDefObj: string, className: string) => {
    const cleanedObj = typeDefObj.replace(/[\s\n]+/g, ' ').trim();
    const fields = parseObjectFields(cleanedObj);
    const formattedFields: string[] = [];
    const debugFields: DebugField[] = [];

    for (const field of fields) {
      let fieldName = field.name;
      let fieldType = field.value;
      let itemType = null;
      let tupleTypes: { type: string; value: any; index: number }[] = [];
      let isVec = false;
      let isTuple = false;
      let isOption = false;
      let isStruct = false;
      let nestedFields: DebugField[] = [];

      if (fieldType.includes('Vec.with')) {
        isVec = true;
        const vecTypeMatch = fieldType.match(/Vec\.with\(([^)]+)\)/);
        if (vecTypeMatch && vecTypeMatch[1]) {
          itemType = vecTypeMatch[1].trim();
        }
        fieldType = fieldType.replace(/Vec\.with\(([^)]+)\)/, 'Vec<$1>');
      }

      if (fieldType.includes('Option<') || fieldType.includes('Option.with')) {
        isOption = true;
        if (fieldType.includes('Option<')) {
          const optionMatch = fieldType.match(/Option<([^>]+)>/);
          if (optionMatch && optionMatch[1]) {
            // here can store option value type
          }
        }
      }

      formattedFields.push(`  ${fieldName}: ${fieldType}`);

      const debugField: DebugField = {
        name: fieldName,
        type: fieldType,
        value: '',
        isVec,
        isTuple,
        isOption,
        isStruct,
        itemType: itemType || undefined,
        tupleItems: tupleTypes,
        nestedFields,
        hasValue: false,
        items: isVec ? [{ value: '' }] : [],
      };

      debugFields.push(debugField);
    }

    return {
      formattedTypeDef: `struct ${className} {
${formattedFields.join('\n')}
}`,
      fields: debugFields
    };
  }, []);

  const parseObjectFields = useCallback((objStr: string) => {
    const content = objStr.trim();
    const innerContent = content.startsWith('{') && content.endsWith('}')
      ? content.slice(1, -1).trim()
      : content;

    const fields: { name: string; value: string }[] = [];
    let currentPos = 0;
    let currentField: { name: string; valueStart: number } | null = null;
    let bracketDepth = 0;
    let parenDepth = 0;
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < innerContent.length; i++) {
      const char = innerContent[i];

      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true;
        quoteChar = char;
      } else if (inQuotes && char === quoteChar && innerContent[i-1] !== '\\') {
        inQuotes = false;
        quoteChar = '';
      }

      if (inQuotes) continue;

      if (char === '[' || char === '{') {
        bracketDepth++;
      } else if (char === ']' || char === '}') {
        bracketDepth--;
      } else if (char === '(') {
        parenDepth++;
      } else if (char === ')') {
        parenDepth--;
      }

      const isTopLevel = bracketDepth === 0 && parenDepth === 0;

      if (isTopLevel) {
        if (char === ':' && !currentField) {
          const fieldName = innerContent.substring(currentPos, i).trim();
          currentField = { name: fieldName, valueStart: i + 1 };
        } else if (char === ',' && currentField) {
          const fieldValue = innerContent.substring(currentField.valueStart, i).trim();
          fields.push({ name: currentField.name, value: fieldValue });
          currentField = null;
          currentPos = i + 1;
        }
      }
    }

    if (currentField) {
      const fieldValue = innerContent.substring(currentField.valueStart).trim();
      fields.push({ name: currentField.name, value: fieldValue });
    }

    return fields;
  }, []);

  const formatEnumTypeDef = useCallback((typeDefObj: string, className: string) => {
    const cleanedObj = typeDefObj.replace(/[\s\n]+/g, ' ').trim();

    const isObjectFormat = cleanedObj.startsWith('{') && cleanedObj.endsWith('}');
    
    if (isObjectFormat) {
      const innerContent = cleanedObj.slice(1, -1).trim();
      
      const parseVariants = (content: string) => {
        const variants: { name: string; type: string }[] = [];
        let current = '';
        let variantName = '';
        let inValue = false;
        let parenDepth = 0;
        let braceDepth = 0;
        let inQuotes = false;
        let quoteChar = '';
        
        for (let i = 0; i < content.length; i++) {
          const char = content[i];
          
          if (!inQuotes && (char === '"' || char === "'")) {
            inQuotes = true;
            quoteChar = char;
          } else if (inQuotes && char === quoteChar && content[i-1] !== '\\') {
            inQuotes = false;
            quoteChar = '';
          }
          
          if (!inQuotes) {
            if (char === '(') {
              parenDepth++;
            } else if (char === ')') {
              parenDepth--;
            } else if (char === '{') {
              braceDepth++;
            } else if (char === '}') {
              braceDepth--;
            }
            
            if (char === ':' && !inValue && parenDepth === 0 && braceDepth === 0) {
              variantName = current.trim();
              current = '';
              inValue = true;
              continue;
            }
            
            if (char === ',' && parenDepth === 0 && braceDepth === 0) {
              if (variantName && current.trim()) {
                variants.push({ name: variantName, type: current.trim() });
              } else if (current.trim() && !inValue) {
                variants.push({ name: current.trim(), type: '' });
              }
              current = '';
              variantName = '';
              inValue = false;
              continue;
            }
          }
          
          current += char;
        }
        
        if (variantName && current.trim()) {
          variants.push({ name: variantName, type: current.trim() });
        } else if (current.trim() && !inValue) {
          variants.push({ name: current.trim(), type: '' });
        }
        
        return variants;
      };

      const variantData = parseVariants(innerContent);
      const formattedVariants: string[] = [];
      const debugVariants: DebugVariant[] = [];

      for (const variant of variantData) {
        const variantName = variant.name;
        const variantType = variant.type;
        
        let isNullType = false;
        let processedType = variantType;
        
        if (!variantType || variantType === 'null' || variantType === 'Null' || variantType === '()') {
          isNullType = true;
          processedType = '';
        } else {
          processedType = variantType;
        }
        
        formattedVariants.push(`  ${variantName}${!isNullType ? `: ${processedType}` : ''}`);

        debugVariants.push({
          name: variantName,
          type: !isNullType ? processedType : undefined,
          hasValue: !isNullType,
          value: ''
        });
      }

      if (debugVariants.length > 0) {
        return {
          formattedTypeDef: `enum ${className} {
${formattedVariants.join(',\n')}
}`,
          variants: debugVariants
        };
      }
    }

    const simpleVariantRegex = /([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    let simpleMatch;
    const foundVariants = new Set<string>();
    const formattedVariants: string[] = [];
    const debugVariants: DebugVariant[] = [];
    
    while ((simpleMatch = simpleVariantRegex.exec(cleanedObj)) !== null) {
      const variantName = simpleMatch[1].trim();
      
      if (!['null', 'Null', 'true', 'false', 'String', 'Number', 'Boolean', 'Object', 'Array', 'with', 'Struct', 'Text'].includes(variantName) &&
          !foundVariants.has(variantName)) {
        foundVariants.add(variantName);
        formattedVariants.push(`  ${variantName}`);
        debugVariants.push({
          name: variantName,
          type: undefined,
          hasValue: false,
          value: ''
        });
      }
    }

    if (debugVariants.length === 0) {
      return {
        formattedTypeDef: `enum ${className} ${cleanedObj}`,
        variants: []
      };
    }

    return {
      formattedTypeDef: `enum ${className} {
${formattedVariants.join(',\n')}
}`,
      variants: debugVariants
    };
  }, []);

  const extractTypeAliasesAndConstants = useCallback((code: string, extractedClasses: ExtractedClass[]) => {
    const u8aFixedRegex = /export\s+const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*U8aFixed\.with\s*\(\s*(\d+)\s*(?:as\s+U8aBitLength)?\s*\)\s*;/g;
    let match;
    
    while ((match = u8aFixedRegex.exec(code)) !== null) {
      const typeName = match[1];
      const bitLength = parseInt(match[2]);
      const byteLength = Math.ceil(bitLength / 8);
      
      (window as any)[typeName] = codecTypes.U8aFixed.with(bitLength as any);
      
      extractedClasses.push({
        name: typeName,
        type: 'U8aFixed',
        definition: `[u8; ${byteLength}] // ${bitLength} bits`,
        debugMode: false,
        valueType: 'u8',
        debugValue: '',
        debugResult: null
      });
    }
    
    const typeAliasRegex = /export\s+const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*;/g;
    
    while ((match = typeAliasRegex.exec(code)) !== null) {
      const aliasName = match[1];
      const baseTypeName = match[2];
      
      if ((window as any)[baseTypeName]) {
        (window as any)[aliasName] = (window as any)[baseTypeName];
        
        extractedClasses.push({
          name: aliasName,
          type: 'TypeAlias',
          definition: `type ${aliasName} = ${baseTypeName}`,
          debugMode: false,
          baseType: baseTypeName,
          debugValue: '',
          debugResult: null
        });
      } else {
        let resolvedType = null;
        
        switch (baseTypeName) {
          case 'U32': resolvedType = codecTypes.U32; break;
          case 'U64': resolvedType = codecTypes.U64; break;
          case 'U128': resolvedType = codecTypes.U128; break;
          case 'U16': resolvedType = codecTypes.U16; break;
          case 'U8': resolvedType = codecTypes.U8; break;
          case 'I32': resolvedType = codecTypes.I32; break;
          case 'I64': resolvedType = codecTypes.I64; break;
          case 'I128': resolvedType = codecTypes.I128; break;
          case 'Bool': resolvedType = codecTypes.Bool; break;
          case 'Text': resolvedType = codecTypes.Text; break;
          default:
            console.warn(`unknown base type: ${baseTypeName} as alias ${aliasName}`);
        }
        
        if (resolvedType) {
          (window as any)[aliasName] = resolvedType;
          
          extractedClasses.push({
            name: aliasName,
            type: 'TypeAlias',
            definition: `type ${aliasName} = ${baseTypeName}`,
            debugMode: false,
            baseType: baseTypeName,
            debugValue: '',
            debugResult: null
          });
        }
      }
    }
    
    // Pattern 3: export const TypeName = VecFixed.with(Type, length);
    const vecFixedRegex = /export\s+const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*VecFixed\.with\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*;/g;
    
    while ((match = vecFixedRegex.exec(code)) !== null) {
      const typeName = match[1];
      const itemType = match[2].trim();
      const length = match[3].trim();
      
      let resolvedItemType = (window as any)[itemType];
      if (!resolvedItemType) {
        switch (itemType) {
          case 'u8': resolvedItemType = codecTypes.u8; break;
          case 'u16': resolvedItemType = codecTypes.u16; break;
          case 'u32': resolvedItemType = codecTypes.u32; break;
          case 'u64': resolvedItemType = codecTypes.u64; break;
          default: resolvedItemType = codecTypes.u8;
        }
      }
      
      if (resolvedItemType) {
        (window as any)[typeName] = codecTypes.VecFixed.with(resolvedItemType, parseInt(length) || 1);
        
        extractedClasses.push({
          name: typeName,
          type: 'VecFixed',
          definition: `[${itemType}; ${length}]`,
          debugMode: false,
          itemType: itemType,
          length: parseInt(length) || 1,
          vecValues: new Array(parseInt(length) || 1).fill(''),
          debugValue: '',
          debugResult: null
        });
      }
    }
  }, []);

  const extractEnumDefinitions = useCallback((code: string, extractedClasses: ExtractedClass[]) => {
    const enumRegex = /\benum\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*{([^}]*)}/g;
    let enumMatch;
    
    while ((enumMatch = enumRegex.exec(code)) !== null) {
      const enumName = enumMatch[1];
      const enumContent = enumMatch[2];
      
      const variants = parseEnumMembers(enumContent);
      
      extractedClasses.push({
        name: enumName,
        type: 'Enum',
        definition: `enum ${enumName} { ... }`,
        variants: variants,
        debugMode: false,
        debugResult: ''
      });
      
      try {
        const enumObj: any = {};
        variants.forEach((variant, index) => {
          if (variant.hasValue && variant.value !== '') {
            enumObj[variant.name] = variant.value;
          } else {
            enumObj[variant.name] = index;
          }
        });
        (window as any)[enumName] = enumObj;
      } catch (error) {
        console.warn(`define enum ${enumName} error:`, error);
      }
    }
  }, []);

  const parseEnumMembers = useCallback((enumContent: string): DebugVariant[] => {
    const variants: DebugVariant[] = [];
    
    const cleanContent = enumContent.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').trim();
    
    const members = splitEnumMembers(cleanContent);
    
    for (const member of members) {
      const trimmed = member.trim();
      if (!trimmed) continue;
      
      const valueMatch = trimmed.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(.+)$/);
      
      if (valueMatch) {
        const name = valueMatch[1].trim();
        const value = valueMatch[2].trim();
        
        let hasValue = true;
        let processedValue = value;
        
        if (value === 'null' || value === 'undefined') {
          hasValue = false;
          processedValue = '';
        } else if (value.match(/^["'].*["']$/)) {
          processedValue = value.slice(1, -1);
        } else if (value.match(/^\d+$/)) {
          processedValue = value;
        }
        
        variants.push({
          name,
          type: hasValue ? (value.match(/^["'].*["']$/) ? 'string' : 'number') : undefined,
          hasValue,
          value: processedValue
        });
      } else {
        const name = trimmed.replace(/[,;]$/, '').trim();
        if (name) {
          variants.push({
            name,
            type: undefined,
            hasValue: false,
            value: ''
          });
        }
      }
    }
    
    return variants;
  }, []);

  const splitEnumMembers = useCallback((content: string): string[] => {
    const members: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let parenDepth = 0;
    let braceDepth = 0;
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      
      if (!inQuotes) {
        if (char === '"' || char === "'") {
          inQuotes = true;
          quoteChar = char;
        } else if (char === '(') {
          parenDepth++;
        } else if (char === ')') {
          parenDepth--;
        } else if (char === '{') {
          braceDepth++;
        } else if (char === '}') {
          braceDepth--;
        } else if (char === ',' && parenDepth === 0 && braceDepth === 0) {
          members.push(current.trim());
          current = '';
          continue;
        }
      } else {
        if (char === quoteChar && content[i-1] !== '\\') {
          inQuotes = false;
          quoteChar = '';
        }
      }
      
      current += char;
    }
    
    if (current.trim()) {
      members.push(current.trim());
    }
    
    return members;
  }, []);

  const extractAndDefineClasses = useCallback((code: string): ExtractedClass[] => {
    if (!code || typeof code !== 'string') return [];

    const extractedClasses: ExtractedClass[] = [];
    
    // extract type aliases and constants (export const H160 = U8aFixed.with(...))
    extractTypeAliasesAndConstants(code, extractedClasses);
    
    // extract struct definitions (struct A { ... })
    extractStructDefinitions(code, extractedClasses);
    
    // extract class definitions (export class A extends Struct { ... })
    extractClassDefinitions(code, extractedClasses);
    
    // extract enum definitions
    extractEnumDefinitions(code, extractedClasses);
    
    return extractedClasses;
  }, [extractTypeAliasesAndConstants, extractStructDefinitions, extractClassDefinitions, extractEnumDefinitions]);

  const handleFunctionSelect = useCallback((func: ParsedFunction) => {
    setSelectedFunction(func);
    setFunctionInputs({});
    setResult("");
  }, []);

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

  const extractAndDefineFunctions = useCallback((code: string) => {
    if (!code || typeof code !== 'string') return;
    const parsedFunctions: ParsedFunction[] = [];

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
    setFunctions(parsedFunctions);
  }, []);

  const parseTsCode = useCallback(async () => {
    if (!tsCode) return;

    if (type === 'type') {
      const extractedPolkadotTypes = extractAndDefineClasses(tsCode);
      setExtractedClasses(extractedPolkadotTypes);
    } else if (type === 'function') {
      extractAndDefineFunctions(tsCode);
    } else {
      extractAndDefineClasses(tsCode);
      extractAndDefineFunctions(tsCode);
    }
  }, [tsCode, parseParameters, extractAndDefineClasses, extractAndDefineFunctions, type]);

  useEffect(() => {
    parseTsCode();
  }, [tsCode, parseTsCode]);

  const renderFieldInput = useCallback((
    field: DebugField, 
    classIndex: number, 
    fieldPath: string, 
    level: number = 0
  ) => {
    const indent = level * 20;
    
    if (field.isVec && field.items) {
      return (
        <div key={fieldPath} className="space-y-2" style={{ marginLeft: `${indent}px` }}>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-primary">{field.name}</span>
            <Chip size="sm" variant="flat" color="secondary">Vec&lt;{field.itemType}&gt;</Chip>
            <Button
              size="sm"
              variant="flat"
              color="primary"
              onPress={() => {
                const newItems = [...(field.items || []), { value: '' }];
                updateDebugValue(classIndex, `${fieldPath}.items`, newItems);
              }}
            >
              Add Item
            </Button>
          </div>
          {field.items.map((item, itemIndex) => (
            <div key={`${fieldPath}[${itemIndex}]`} className="flex items-center gap-2" style={{ marginLeft: `${indent + 20}px` }}>
              <Input
                size="sm"
                placeholder={getPlaceholder(field.itemType || 'any')}
                value={item.value || ''}
                onChange={(e) => updateDebugValue(classIndex, `${fieldPath}[${itemIndex}].value`, e.target.value)}
              />
              <Button
                size="sm"
                variant="flat"
                color="danger"
                onPress={() => {
                  const newItems = field.items?.filter((_, idx) => idx !== itemIndex) || [];
                  updateDebugValue(classIndex, `${fieldPath}.items`, newItems);
                }}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      );
    }

    if (field.isTuple && field.tupleItems) {
      return (
        <div key={fieldPath} className="space-y-2" style={{ marginLeft: `${indent}px` }}>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-primary">{field.name}</span>
            <Chip size="sm" variant="flat" color="secondary">Tuple</Chip>
          </div>
          {field.tupleItems.map((tupleItem, tupleIndex) => (
            <div key={`${fieldPath}_tuple_${tupleIndex}`} className="flex items-center gap-2" style={{ marginLeft: `${indent + 20}px` }}>
              <span className="text-xs text-default-500">[{tupleIndex}]</span>
              <Input
                size="sm"
                placeholder={getPlaceholder(tupleItem.type)}
                value={tupleItem.value || ''}
                onChange={(e) => {
                  const newTupleItems = [...field.tupleItems!];
                  newTupleItems[tupleIndex] = { ...tupleItem, value: e.target.value };
                  updateDebugValue(classIndex, `${fieldPath}.tupleItems`, newTupleItems);
                }}
              />
              <Chip size="sm" variant="flat">{tupleItem.type}</Chip>
            </div>
          ))}
        </div>
      );
    }

    if (field.nestedFields && field.nestedFields.length > 0) {
      return (
        <div key={fieldPath} className="space-y-2" style={{ marginLeft: `${indent}px` }}>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-primary">{field.name}</span>
            <Chip size="sm" variant="flat" color="secondary">Struct</Chip>
          </div>
          {field.nestedFields.map((nestedField, nestedIndex) => 
            renderFieldInput(nestedField, classIndex, `${fieldPath}.${nestedField.name}`, level + 1)
          )}
        </div>
      );
    }

    return (
      <div key={fieldPath} className="flex items-center gap-2" style={{ marginLeft: `${indent}px` }}>
        <span className="font-mono text-sm text-primary w-24">{field.name}</span>
        <Input
          size="sm"
          placeholder={getPlaceholder(field.type)}
          value={field.value || ''}
          onChange={(e) => updateDebugValue(classIndex, `${fieldPath}.value`, e.target.value)}
        />
        <Chip size="sm" variant="flat">{field.type}</Chip>
        {field.isOption && (
          <Chip size="sm" variant="flat" color="warning">Optional</Chip>
        )}
      </div>
    );
  }, [updateDebugValue]);

  const renderDebugInterface = useCallback((codecClass: ExtractedClass, classIndex: number) => {
    if (!codecClass.debugMode) return null;

    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <h5 className="font-semibold text-blue-800">Debug Type</h5>
          <Button
            size="sm"
            color="primary"
            onPress={() => executeDebug(classIndex)}
          >
            Debug
          </Button>
        </div>

        {/* Struct debug */}
        {codecClass.type === 'Struct' && codecClass.fields && codecClass.fields.length > 0 && (
          <div className="space-y-3">
            <h6 className="text-sm font-medium text-blue-700">Structure Fields:</h6>
            {codecClass.fields.map((field, fieldIndex) => 
              renderFieldInput(field, classIndex, field.name, 0)
            )}
          </div>
        )}

        {/* Enum debug */}
        {codecClass.type === 'Enum' && codecClass.variants && codecClass.variants.length > 0 && (
          <div className="space-y-3">
            <h6 className="text-sm font-medium text-blue-700">Enum Variant:</h6>
            <Select
              size="sm"
              label="Select Variant"
              placeholder="Choose a variant"
              selectedKeys={codecClass.selectedVariant ? [codecClass.selectedVariant] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                updateDebugValue(classIndex, 'selectedVariant', selected);
              }}
            >
              {codecClass.variants.map((variant) => (
                <SelectItem key={variant.name}>
                  {variant.name}
                </SelectItem>
              ))}
            </Select>
            {codecClass.selectedVariant && (
              <div className="mt-2">
                {(() => {
                  const selectedVariant = codecClass.variants?.find(v => v.name === codecClass.selectedVariant);
                  if (selectedVariant?.hasValue) {
                    return (
                      <Input
                        size="sm"
                        label={`Value for ${selectedVariant.name}`}
                        placeholder={getPlaceholder(selectedVariant.type || 'any')}
                        value={selectedVariant.value || ''}
                        onChange={(e) => {
                          const updatedVariants = codecClass.variants?.map(v => 
                            v.name === selectedVariant.name ? { ...v, value: e.target.value } : v
                          );
                          setExtractedClasses(prev => prev.map((item, i) => 
                            i === classIndex ? { ...item, variants: updatedVariants } : item
                          ));
                        }}
                      />
                    );
                  }
                  return <p className="text-sm text-gray-600">No value required for this variant.</p>;
                })()}
              </div>
            )}
          </div>
        )}

        {/* VecFixed debug */}
        {codecClass.type === 'VecFixed' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h6 className="text-sm font-medium text-blue-700">
                VecFixed Values (Length: {codecClass.length})
              </h6>
              <Button
                size="sm"
                variant="flat"
                onPress={() => addVecItem(classIndex)}
                isDisabled={(codecClass.vecValues?.length || 0) >= (codecClass.length || 0)}
              >
                Add
              </Button>
            </div>
            {codecClass.vecValues?.map((value, valueIndex) => (
              <div key={valueIndex} className="flex items-center gap-2">
                <span className="text-xs text-default-500 w-8">[{valueIndex}]</span>
                <Input
                  size="sm"
                  placeholder={getPlaceholder(codecClass.itemType || 'any')}
                  value={value}
                  onChange={(e) => updateDebugValue(classIndex, `vecValues[${valueIndex}]`, e.target.value)}
                />
                <Button
                  size="sm"
                  variant="flat"
                  color="danger"
                  onPress={() => removeVecItem(classIndex, valueIndex)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Common value debug */}
        {!['Struct', 'Enum', 'VecFixed'].includes(codecClass.type) && (
          <div className="space-y-3">
            <h6 className="text-sm font-medium text-blue-700">Value:</h6>
            <Input
              size="sm"
              label={`${codecClass.type} Value`}
              placeholder={getPlaceholder(codecClass.valueType || codecClass.type)}
              value={codecClass.debugValue || ''}
              onChange={(e) => updateDebugValue(classIndex, 'debugValue', e.target.value)}
            />
          </div>
        )}

        {/* Debug result */}
        {codecClass.debugResult && (
          <div className="space-y-2">
            <h6 className="text-sm font-medium text-blue-700">Result:</h6>
            <pre className="text-xs bg-gray-100 p-2 rounded border overflow-auto max-h-40">
              {codecClass.debugResult}
            </pre>
          </div>
        )}
      </div>
    );
  }, [updateDebugValue, executeDebug, addVecItem, removeVecItem, renderFieldInput]);

  return (
    <div className="space-y-6">
      {extractedClasses.length > 0 && (
        <Card>
          <CardHeader>
            <h4 className="text-md font-semibold">Polkadot Codec Types</h4>
          </CardHeader>
          <CardBody>
            <Accordion selectionMode="multiple">
              {extractedClasses.map((codecClass, index) => (
                <AccordionItem
                  key={index}
                  aria-label={codecClass.name}
                  title={
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Chip size="sm" variant="flat" color="secondary">
                          {codecClass.type}
                        </Chip>
                        <span className="font-mono">{codecClass.name}</span>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs text-default-500">Debug</span>
                        <Switch
                          size="sm"
                          isSelected={codecClass.debugMode}
                          onValueChange={() => toggleDebugMode(index)}
                          color="primary"
                        />
                      </div>
                    </div>
                  }
                >
                  <div className="space-y-2">
                    {(!codecClass.fields || codecClass.fields.length === 0) && 
                     (!codecClass.variants || codecClass.variants.length === 0) && 
                     codecClass.definition && (
                      <pre className="font-mono text-sm bg-gray-100 p-2 rounded">
                        {codecClass.definition}
                      </pre>
                    )}
                    {codecClass.fields && codecClass.fields.length > 0 && (
                      <div className="space-y-1">
                        {codecClass.fields.map((field, fieldIndex) => (
                          <div key={fieldIndex} className="flex items-center gap-2 text-sm ml-4">
                            <span className="font-mono text-primary">{field.name}</span>
                            <span>:</span>
                            <span className="font-mono text-secondary">{field.type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {codecClass.variants && codecClass.variants.length > 0 && (
                      <div className="space-y-1">
                        {codecClass.variants.map((variant, variantIndex) => (
                          <div key={variantIndex} className="flex items-center gap-2 text-sm ml-4">
                            <span className="font-mono text-primary">{variant.name}</span>
                            {variant.type && (
                              <>
                                <span>:</span>
                                <span className="font-mono text-secondary">{variant.type}</span>
                              </>
                            )}
                            {!variant.hasValue && (
                              <Chip size="sm" variant="flat" color="default">Null</Chip>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {renderDebugInterface(codecClass, index)}
                  </div>
                </AccordionItem>
              ))}
            </Accordion>
          </CardBody>
        </Card>
      )}

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

      {functions.length === 0 && extractedClasses.length === 0 && (
        <Card>
          <CardBody>
            <p className="text-default-500 text-center">No functions, interfaces, or Polkadot codec types found in the provided code.</p>
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