"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Chip } from "@heroui/chip";
import { Switch } from "@heroui/switch";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";

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
  debugMode?: boolean;
  debugInputs?: DebugField[];
  debugResult?: string | null;
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
  constructorParams?: {
    original: string;
    T: string;
    S: string;
    value?: string;
    argsFieldsCount: number;
    parseStatus: 'success' | 'failed';
  };
}

interface DebugField {
  name: string;
  type: string;
  value: any;
  isVec: boolean;
  isTuple: boolean;
  isOption: boolean;
  isStruct: boolean;
  isEnum: boolean;
  itemType?: string;
  tupleItems?: { type: string; value: any; index: number }[];
  nestedFields?: DebugField[];
  enumVariants?: DebugVariant[];
  selectedVariant?: string;
  hasValue?: boolean;
  valueType?: string;
  items?: { value: any }[];
  referencedStructName?: string;
  referencedEnumName?: string;
}

interface DebugVariant {
  name: string;
  type?: string;
  hasValue: boolean;
  value: any;
  nestedFields?: DebugField[]; // Add support for nested fields
}

export default function TsFunctionExplorer({ tsCode, nucleusId, type }: TsFunctionExplorerProps) {
  const [functions, setFunctions] = useState<ParsedFunction[]>([]);
  const [extractedClasses, setExtractedClasses] = useState<ExtractedClass[]>([]);
  const [currentCode, setCurrentCode] = useState<string>(tsCode);

  const toggleDebugMode = useCallback((index: number) => {
    setExtractedClasses(prev => prev.map((item, i) =>
      i === index ? { ...item, debugMode: !item.debugMode } : item
    ));
  }, []);

  const toggleFunctionDebugMode = useCallback((functionIndex: number) => {
    setFunctions(prev => prev.map((func, i) => {
      if (i === functionIndex) {
        const debugMode = !func.debugMode;
        if (debugMode && !func.debugInputs) {
          
          console.log(`🔍 为函数 ${func.name} 创建调试输入，参数数量: ${func.parameters.length}`);
          console.log(`  可用的 extractedClasses: [${extractedClasses.map(c => `${c.name}(${c.type})`).join(', ')}]`);
          
          const debugInputs = func.parameters.map(param => {
            console.log(`  📝 处理参数: ${param.name} : ${param.type}`);
            
            console.log(`    🔍 查找参数类型 ${param.type} 在 extractedClasses 中的定义...`);
            
            const referencedStruct = extractedClasses.find(c => c.name === param.type && c.type === 'Struct');
            const referencedEnum = extractedClasses.find(c => c.name === param.type && c.type === 'Enum');
            
            console.log(`    查找结果: referencedStruct=${referencedStruct?.name || 'null'}, referencedEnum=${referencedEnum?.name || 'null'}`);
            console.log(`    详细查找结果: referencedStruct=`, referencedStruct);
            
            // 检查是否是自定义类型
            const isCustom = /^[A-Z]/.test(param.type) && !['String', 'Number', 'Boolean', 'Array'].includes(param.type);
            console.log(`    isCustom=${isCustom}, param.type=${param.type}`);
            
            const baseField: DebugField = {
              name: param.name,
              type: param.type,
              value: '',
              isVec: param.type.includes('Vec<') || param.type.includes('[]'),
              isTuple: param.type.startsWith('[') && param.type.endsWith(']') && param.type.includes(','),
              isOption: param.type.includes('Option<'),
              isStruct: !!referencedStruct,
              isEnum: !!referencedEnum,
              itemType: undefined,
              tupleItems: [],
              nestedFields: [],
              enumVariants: [],
              hasValue: false,
              items: (param.type.includes('Vec<') || param.type.includes('[]')) ? [{ value: '' }] : [],
              referencedStructName: referencedStruct?.name,
              referencedEnumName: referencedEnum?.name
            };

            console.log(`    baseField 初始化完成: isStruct=${baseField.isStruct}, referencedStructName=${baseField.referencedStructName}`);

            // Struct type, copy its field structure
            if (referencedStruct && referencedStruct.fields) {
              console.log(`    ✓ 复制 Struct ${referencedStruct.name} 的字段结构，字段数: ${referencedStruct.fields.length}`);
              baseField.nestedFields = JSON.parse(JSON.stringify(referencedStruct.fields));
              console.log(`    ✓ 字段复制完成，baseField.nestedFields 长度: ${baseField.nestedFields?.length || 0}`);
              
              // 特殊处理：如果这是通过类型推断得到的容器类型，使用缓存的类型信息替换参数
              const typeCache = (window as any).__typeInferenceCache;
              const innerTypeKey = `${func.name}_${param.name}_${param.type}_innerType`;
              if (typeCache && typeCache[innerTypeKey]) {
                const innerType = typeCache[innerTypeKey];
                console.log(`    🔧 发现类型推断缓存，替换 T 参数: ${innerType}`);
                
                // 对于 Args 类型，替换字段类型中的 T 和 S 参数
                if (baseField.nestedFields && referencedStruct.baseType === 'Args') {
                  console.log(`    🔧 这是 Args 继承类型，开始替换字段类型参数...`);
                  baseField.nestedFields = baseField.nestedFields.map(field => {
                    let newType = field.type;
                    if (field.type === 'T') {
                      newType = innerType;
                      console.log(`      ✓ 替换字段 ${field.name} 类型: T -> ${innerType}`);
                    }
                    // S 参数应该已经在解析时被替换了，但以防万一
                    if (field.type === 'S' && referencedStruct.constructorParams?.S) {
                      newType = referencedStruct.constructorParams.S;
                      console.log(`      ✓ 替换字段 ${field.name} 类型: S -> ${referencedStruct.constructorParams.S}`);
                    }
                    
                    // 类型替换后，检查新类型是否是结构体或枚举
                    let updatedField = {
                      ...field,
                      type: newType
                    };
                    
                    // 如果新类型是结构体类型，设置嵌套字段
                    if (newType !== field.type) {
                      console.log(`      🔍 检查替换后的类型 ${newType} 是否是结构体/枚举...`);
                      const newTypeStruct = extractedClasses.find(c => c.name === newType && c.type === 'Struct');
                      const newTypeEnum = extractedClasses.find(c => c.name === newType && c.type === 'Enum');
                      
                      if (newTypeStruct && newTypeStruct.fields) {
                        console.log(`      ✓ ${newType} 是结构体类型，设置嵌套字段 (${newTypeStruct.fields.length} 个字段)`);
                        updatedField.isStruct = true;
                        updatedField.referencedStructName = newType;
                        updatedField.nestedFields = JSON.parse(JSON.stringify(newTypeStruct.fields));
                      } else if (newTypeEnum && newTypeEnum.variants) {
                        console.log(`      ✓ ${newType} 是枚举类型，设置变体 (${newTypeEnum.variants.length} 个变体)`);
                        updatedField.isEnum = true;
                        updatedField.referencedEnumName = newType;
                        updatedField.enumVariants = JSON.parse(JSON.stringify(newTypeEnum.variants));
                      } else {
                        console.log(`      ℹ️ ${newType} 不是结构体或枚举类型`);
                      }
                    }
                    
                    return updatedField;
                  });
                  console.log(`    ✅ 字段类型替换完成`);
                }
              } else {
                console.log(`    ℹ️ 未找到类型推断缓存信息 (键: ${innerTypeKey})`);
              }
            } else if (referencedStruct && !referencedStruct.fields) {
              console.log(`    ⚠️ 找到 Struct ${referencedStruct.name} 但没有字段定义`);
            }

            // Enum type, copy its variant structure
            if (referencedEnum && referencedEnum.variants) {
              console.log(`    ✓ 复制 Enum ${referencedEnum.name} 的变体结构，变体数: ${referencedEnum.variants.length}`);
              baseField.enumVariants = JSON.parse(JSON.stringify(referencedEnum.variants));
            }

            // 添加诊断信息
            if (isCustom && !referencedStruct && !referencedEnum) {
              console.log(`    ⚠️ 诊断: 参数 ${param.name} 的类型 ${param.type} 是自定义类型但在 extractedClasses 中找不到定义`);
              console.log(`    建议检查:`);
              console.log(`    1. 代码中是否包含 ${param.type} 的定义 (class/interface/type)`);
              console.log(`    2. 类型定义的格式是否符合解析器的要求`);
              console.log(`    3. 可用的类型列表: [${extractedClasses.map(c => c.name).join(', ')}]`);
              
              // 特殊处理：检查是否是 SignedArgs 类型的容器类型
              const typeCache = (window as any).__typeInferenceCache;
              const innerTypeKey = `${func.name}_${param.name}_${param.type}_innerType`;
              if (typeCache && typeCache[innerTypeKey]) {
                const innerType = typeCache[innerTypeKey];
                console.log(`    ✓ 发现容器类型 ${param.type}，内部类型: ${innerType} (缓存键: ${innerTypeKey})`);
                
                // 直接查找容器类型的定义（如 SignedArgs）
                const containerStruct = extractedClasses.find(c => c.name === param.type && c.type === 'Struct');
                if (containerStruct && containerStruct.fields) {
                  console.log(`    ✓ 找到容器类型 ${param.type} 的完整定义，使用其完整结构`);
                  
                  // 使用完整的 SignedArgs 结构，而不是创建包装
                  baseField.isStruct = true;
                  baseField.referencedStructName = param.type;
                  baseField.nestedFields = JSON.parse(JSON.stringify(containerStruct.fields));
                  
                  console.log(`    ✓ 为参数 ${param.name} 使用 ${param.type} 的完整结构，字段数: ${baseField.nestedFields?.length || 0}`);
                } else {
                  console.log(`    ⚠️ 未找到容器类型 ${param.type} 的完整定义，回退到简单包装`);
                  
                  // 查找内部类型的定义
                  const innerStruct = extractedClasses.find(c => c.name === innerType && c.type === 'Struct');
                  const innerEnum = extractedClasses.find(c => c.name === innerType && c.type === 'Enum');
                  
                  if (innerStruct || innerEnum) {
                    console.log(`    ✓ 找到内部类型 ${innerType} 的定义，创建简单包装结构`);
                    
                    // 为容器类型创建特殊的字段结构
                    baseField.isStruct = true;
                    baseField.referencedStructName = param.type;
                    
                    // 创建包含内部类型的嵌套字段
                    baseField.nestedFields = [{
                      name: 'value',
                      type: innerType,
                      value: '',
                      isVec: false,
                      isTuple: false,
                      isOption: false,
                      isStruct: !!innerStruct,
                      isEnum: !!innerEnum,
                      nestedFields: innerStruct?.fields ? JSON.parse(JSON.stringify(innerStruct.fields)) : [],
                      enumVariants: innerEnum?.variants ? JSON.parse(JSON.stringify(innerEnum.variants)) : [],
                      referencedStructName: innerStruct?.name,
                      referencedEnumName: innerEnum?.name,
                      hasValue: false,
                      items: []
                    }];
                    
                    console.log(`    ✓ 为容器类型 ${param.type} 创建了简单包装结构`);
                  }
                }
              }
            }

            return baseField;
          });
          
          return { ...func, debugMode, debugInputs };
        }
        return { ...func, debugMode };
      }
      return func;
    }));
  }, [extractedClasses]);

  const updateFunctionInput = useCallback((functionIndex: number, fieldPath: string, value: any) => {
    setFunctions(prev => prev.map((func, i) => {
      if (i !== functionIndex || !func.debugInputs) return func;

      const pathParts = fieldPath.split('.');
      const updated = { ...func };
      updated.debugInputs = updateFieldValue(updated.debugInputs || [], pathParts, value);

      return updated;
    }));
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
      } else if (fieldPath.startsWith('variants.')) {
        // Handle nested field paths in Enum variants, such as "variants.OpenAI.key.value"
        const pathParts = fieldPath.split('.');
        if (pathParts.length >= 4 && updated.variants) { // variants.VariantName.fieldName.value
          const variantName = pathParts[1];
          const fieldName = pathParts[2];
          const property = pathParts[3]; // Usually 'value'

          updated.variants = updated.variants.map(variant => {
            if (variant.name === variantName && variant.nestedFields) {
              const updatedNestedFields = variant.nestedFields.map(field => {
                if (field.name === fieldName && property === 'value') {
                  return { ...field, value };
                }
                return field;
              });
              return { ...variant, nestedFields: updatedNestedFields };
            }
            return variant;
          });
        }
      } else if (updated.fields) {
        // Handle paths with array indices, such as "a[0].value"
        if (fieldPath.includes('[') && fieldPath.includes('].value')) {
          const fieldName = fieldPath.split('[')[0];
          const itemIndex = parseInt(fieldPath.split('[')[1]?.split(']')[0] || '0');

          updated.fields = updated.fields.map(field => {
            if (field.name === fieldName && field.items) {
              const newItems = [...field.items];
              if (newItems[itemIndex]) {
                newItems[itemIndex] = { ...newItems[itemIndex], value };
              }
              return { ...field, items: newItems };
            }
            return field;
          });
        } else if (fieldPath.includes('.tupleItems')) {
          // Handle tupleItems updates for Tuple fields
          const pathParts = fieldPath.split('.');
          const fieldName = pathParts[0];

          updated.fields = updated.fields.map(field => {
            if (field.name === fieldName) {
              return { ...field, tupleItems: value };
            }
            return field;
          });
        } else {
          const pathParts = fieldPath.split('.');
          updated.fields = updateFieldValue(updated.fields, pathParts, value);
        }
      }

      return updated;
    }));
  }, []);

  const updateFieldValue = useCallback((fields: DebugField[], pathParts: string[], value: any): DebugField[] => {
    return fields.map(field => {
      if (field.name === pathParts[0]) {
        if (pathParts.length === 2 && pathParts[1] === 'value') {
          return { ...field, value };
        } else if (pathParts.length === 2 && pathParts[1] === 'selectedVariant') {
          return { ...field, selectedVariant: value };
        } else if (pathParts.length === 2 && pathParts[1] === 'enumVariants') {
          return { ...field, enumVariants: value };
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
        } else if (pathParts[1] === 'items' && pathParts.length === 2) {
          // Handle direct setting of items array
          return { ...field, items: value };
        }
      }
      return field;
    });
  }, []);

  const isCustomType = useCallback((type: string): boolean => {
    if (!type) return false;
    return /^[A-Z]/.test(type) && !['String', 'Number', 'Boolean', 'Array'].includes(type);
  }, []);

  const isTupleType = useCallback((type: string): boolean => {
    return type.startsWith('[') && type.endsWith(']') && type.includes(',');
  }, []);

  const isVecType = useCallback((type: string): boolean => {
    return type.includes('Vec<') || type.includes('[]') || type.includes('VecFixed') || type.includes('Vec.with');
  }, []);

  const isOptionType = useCallback((type: string): boolean => {
    return type.includes('Option<');
  }, []);

  const extractVecItemType = useCallback((vecType: string): string | undefined => {
    if (vecType.includes('Vec<')) {
      const match = vecType.match(/Vec<([^>]+)>/);
      return match ? match[1].trim() : undefined;
    }
    if (vecType.includes('Vec.with')) {
      const match = vecType.match(/Vec\.with\s*\(\s*([^)]+)\s*\)/);
      return match ? match[1].trim() : undefined;
    }
    if (vecType.includes('[]')) {
      return vecType.replace('[]', '').trim();
    }
    return undefined;
  }, []);

  const parseTupleTypes = useCallback((tupleType: string): { type: string; value: any; index: number }[] => {
    if (tupleType.startsWith('[') && tupleType.endsWith(']')) {
      const innerTypes = tupleType.slice(1, -1);
      return innerTypes.split(',').map((type, index) => ({
        type: type.trim(),
        value: '',
        index: index
      }));
    }
    return [];
  }, []);

  const getPlaceholder = useCallback((type: string): string => {
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
  }, []);

  const parseStructFields = useCallback((structContent: string): DebugField[] => {
    const fields: DebugField[] = [];
    const fieldRegex = /\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*([^;\n]+)/g;
    let fieldMatch;

    console.log('Parsing struct content:', structContent);

    while ((fieldMatch = fieldRegex.exec(structContent)) !== null) {
      const fieldName = fieldMatch[1];
      const fieldType = fieldMatch[2].trim();

      console.log(`Parsing field: ${fieldName} : ${fieldType}`);
      console.log(`Is Vec type: ${isVecType(fieldType)}`);

      if (isVecType(fieldType)) {
        const itemType = extractVecItemType(fieldType);
        console.log(`Vec field ${fieldName} item type: ${itemType}`);
      }

      fields.push({
        name: fieldName,
        type: fieldType,
        value: '',
        isVec: isVecType(fieldType),
        isTuple: isTupleType(fieldType),
        isOption: isOptionType(fieldType),
        isStruct: false, // Will be parsed in subsequent steps
        isEnum: false, // Will be parsed in subsequent steps
        itemType: isVecType(fieldType) ? extractVecItemType(fieldType) : undefined,
        tupleItems: isTupleType(fieldType) ? parseTupleTypes(fieldType) : [],
        nestedFields: [],
        enumVariants: [],
        hasValue: false,
        items: isVecType(fieldType) ? [{ value: '' }] : [],
        referencedStructName: undefined,
        referencedEnumName: undefined
      });
    }

    console.log(`Total parsed ${fields.length} fields, including Vec fields: ${fields.filter(f => f.isVec).length}`);

    return fields;
  }, [isVecType, isTupleType, isOptionType, extractVecItemType, parseTupleTypes]);

  const collectNestedStructData = useCallback((fields: DebugField[]): any => {
    const data: any = {};

    fields.forEach(field => {
      
      if (field.isVec && field.items && field.items.length > 0) {
        // Handle Vec type fields
        const vecValues = field.items
          .map(item => item.value)
          .filter(val => val !== '' && val !== undefined && val !== null);
        if (vecValues.length > 0) {
          data[field.name] = vecValues;
        }
      } else if (field.isTuple && field.tupleItems && field.tupleItems.length > 0) {
        // Handle Tuple type fields
        const tupleValues = field.tupleItems.map(item => item.value);
        if (tupleValues.some(val => val !== '' && val !== undefined && val !== null)) {
          data[field.name] = tupleValues;
        }
      } else if (field.isStruct && field.nestedFields && field.nestedFields.length > 0) {
        // Handle nested struct fields
        const nestedData = collectNestedStructData(field.nestedFields);
        if (Object.keys(nestedData).length > 0) {
          data[field.name] = nestedData;
        } else {
        }
      } else if (field.isEnum && field.selectedVariant) {
        // Handle Enum fields
        const selectedVariant = field.enumVariants?.find(v => v.name === field.selectedVariant);
        if (selectedVariant) {
          if (selectedVariant.hasValue && selectedVariant.value) {
            data[field.name] = { [selectedVariant.name]: selectedVariant.value };
          } else {
            data[field.name] = selectedVariant.name;
          }
        }
      } else if (field.value !== '') {
        // Handle normal fields
        data[field.name] = field.value;
        
        // 特殊处理：如果这是一个应该是 Struct 的字段但没有被正确识别
        if (!field.isStruct && !field.isEnum && !field.isVec && field.type && /^[A-Z]/.test(field.type)) {
          console.log(`  ⚠️ warning: field ${field.name} type is ${field.type}, maybe should be complex type but treated as simple type`);
          console.log(`  check if ${field.type} is defined in extractedClasses`);
        }
      } else {
        console.log(`  - skip empty value field ${field.name}`);
      }
    });

    console.log('final collected data:', data);
    return data;
  }, []);

  const parseObjectFieldsToDebugFields = useCallback((objStr: string): DebugField[] => {
    const fields: DebugField[] = [];
    const cleanedObj = objStr.replace(/[\s\n]+/g, ' ').trim();
    const innerContent = cleanedObj.slice(1, -1);

    const fieldRegex = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*([^,}]+)/g;
    let match;

    while ((match = fieldRegex.exec(innerContent)) !== null) {
      const fieldName = match[1].trim();
      const fieldType = match[2].trim();

      fields.push({
        name: fieldName,
        type: fieldType,
        value: '',
        isVec: isVecType(fieldType),
        isTuple: isTupleType(fieldType),
        isOption: isOptionType(fieldType),
        isStruct: false,
        isEnum: false,
        itemType: isVecType(fieldType) ? extractVecItemType(fieldType) : undefined,
        tupleItems: isTupleType(fieldType) ? parseTupleTypes(fieldType) : [],
        nestedFields: [],
        enumVariants: [],
        hasValue: false,
        items: isVecType(fieldType) ? [{ value: '' }] : [],
        referencedStructName: undefined,
        referencedEnumName: undefined
      });
    }

    return fields;
  }, [isVecType, isTupleType, isOptionType, extractVecItemType, parseTupleTypes]);

  const parseEnumMembers = useCallback((enumContent: string): DebugVariant[] => {
    const variants: DebugVariant[] = [];
    const members = enumContent.split(',').map(m => m.trim()).filter(m => m);

    for (const member of members) {
      const [name, value] = member.split('=').map(p => p.trim());

      variants.push({
        name: name,
        type: value ? (isNaN(Number(value)) ? 'string' : 'number') : undefined,
        hasValue: !!value,
        value: value || ''
      });
    }

    return variants;
  }, []);

  const parseEnumVariantsFromClassDef = useCallback((objStr: string): DebugVariant[] => {
    const variants: DebugVariant[] = [];

    // Clean the string, remove extra whitespace but preserve structure
    const cleanedObj = objStr.replace(/\s+/g, ' ').trim();
    const innerContent = cleanedObj.slice(1, -1);

    // More precise parsing method: split by comma, then parse each variant
    const variantEntries = [];
    let currentEntry = '';
    let braceCount = 0;
    let parenCount = 0;

    for (let i = 0; i < innerContent.length; i++) {
      const char = innerContent[i];

      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
      else if (char === '(') parenCount++;
      else if (char === ')') parenCount--;
      else if (char === ',' && braceCount === 0 && parenCount === 0) {
        if (currentEntry.trim()) {
          variantEntries.push(currentEntry.trim());
        }
        currentEntry = '';
        continue;
      }

      currentEntry += char;
    }

    if (currentEntry.trim()) {
      variantEntries.push(currentEntry.trim());
    }

    const parseStructWithFields = (structWithStr: string): { type: string; fields?: DebugField[] } => {

      const withMatch = structWithStr.match(/Struct\.with\s*\(\s*\{/);
      if (!withMatch) {
        console.log('not match Struct.with format');
        return { type: 'Struct<...>' };
      }

      const startIndex = withMatch.index! + withMatch[0].length - 1; // Locate to the starting {
      let braceCount = 1;
      let endIndex = startIndex + 1;

      console.log('start parse brace, start index:', startIndex);

      while (endIndex < structWithStr.length && braceCount > 0) {
        if (structWithStr[endIndex] === '{') {
          braceCount++;
        } else if (structWithStr[endIndex] === '}') {
          braceCount--;
        }
        endIndex++;
      }

      if (braceCount === 0) {
        const fieldsContent = structWithStr.substring(startIndex + 1, endIndex - 1);
        console.log('extract fields content:', `"${fieldsContent}"`);

        // Parse fields
        const fields = parseStructFieldsFromString(fieldsContent);
        console.log('parse fields number:', fields.length, fields);

        return {
          type: `Struct<{${fieldsContent.trim()}}>`,
          fields: fields
        };
      }

      console.log('braceCount not match:', braceCount);
      return { type: 'Struct<...>' };
    };

    const parseStructFieldsFromString = (fieldsStr: string): DebugField[] => {
      console.log('parse fields string:', `"${fieldsStr}"`);

      const fields: DebugField[] = [];

      const fieldRegex = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*([^,\n\r}]+)/g;
      let fieldMatch;

      while ((fieldMatch = fieldRegex.exec(fieldsStr)) !== null) {
        const fieldName = fieldMatch[1].trim();
        const fieldType = fieldMatch[2].trim();

        console.log(`parse field: ${fieldName} : ${fieldType}`);

        fields.push({
          name: fieldName,
          type: fieldType,
          value: '',
          isVec: isVecType(fieldType),
          isTuple: isTupleType(fieldType),
          isOption: isOptionType(fieldType),
          isStruct: false, // will be parsed in higher level
          isEnum: false,
          itemType: isVecType(fieldType) ? extractVecItemType(fieldType) : undefined,
          tupleItems: isTupleType(fieldType) ? parseTupleTypes(fieldType) : [],
          nestedFields: [],
          enumVariants: [],
          hasValue: false,
          items: isVecType(fieldType) ? [{ value: '' }] : [],
          referencedStructName: undefined,
          referencedEnumName: undefined
        });
      }

      console.log(`parse fields number: ${fields.length}`);
      return fields;
    };

    const parseVecWith = (vecWithStr: string): string => {
      const vecMatch = vecWithStr.match(/Vec\.with\s*\(\s*([^)]+)\s*\)/);
      if (vecMatch) {
        return `Vec<${vecMatch[1].trim()}>`;
      }
      return 'Vec<...>';
    };

    const parseOptionWith = (optionWithStr: string): string => {
      const optionMatch = optionWithStr.match(/Option\.with\s*\(\s*([^)]+)\s*\)/);
      if (optionMatch) {
        return `Option<${optionMatch[1].trim()}>`;
      }
      return 'Option<...>';
    };

    variantEntries.forEach((entry, index) => {
      const colonIndex = entry.indexOf(':');
      if (colonIndex === -1) return;

      const variantName = entry.substring(0, colonIndex).trim();
      const variantTypeStr = entry.substring(colonIndex + 1).trim();

      console.log(`parse variant ${index + 1}:`, variantName, '->', variantTypeStr);

      let hasValue = true;
      let finalType: string | undefined = variantTypeStr;

      if (variantTypeStr === 'Null') {
        hasValue = false;
        finalType = undefined;
      } else if (variantTypeStr.includes('Struct.with')) {
        console.log('detect Struct.with format, start parse...');
        const structInfo = parseStructWithFields(variantTypeStr);
        finalType = structInfo.type;
        console.log(`Struct.with parse result:`, finalType, 'fields number:', structInfo.fields?.length || 0);

        variants.push({
          name: variantName,
          type: finalType,
          hasValue: hasValue,
          value: '',
          nestedFields: structInfo.fields || []
        });

        console.log(`add variant with nested fields:`, variantName, hasValue ? `(has value: ${finalType}, fields number: ${structInfo.fields?.length || 0})` : '(no value)');
        return; // return early to avoid duplicate addition
      } else if (variantTypeStr.includes('Vec.with')) {
        // Parse Vec.with(Type) format
        finalType = parseVecWith(variantTypeStr);
        console.log(`Vec.with parse result:`, finalType);
      } else if (variantTypeStr.includes('Option.with')) {
        // Parse Option.with(Type) format
        finalType = parseOptionWith(variantTypeStr);
        console.log(`Option.with parse result:`, finalType);
      } else {
        // other cases keep original
        finalType = variantTypeStr;
      }

      variants.push({
        name: variantName,
        type: finalType,
        hasValue: hasValue,
        value: ''
      });

      console.log(`add variant:`, variantName, hasValue ? `(has value: ${finalType})` : '(no value)');
    });

    console.log(`parse enum variants number: ${variants.length}, variants:`, variants.map(v => `${v.name}${v.hasValue ? `(${v.type})` : '(Null)'}`).join(', '));

    return variants;
  }, []);

  const extractAndDefineClasses = useCallback((code: string): ExtractedClass[] => {
    if (!code || typeof code !== 'string') return [];

    console.log(`🏗️ 开始解析类定义，代码长度: ${code.length}`);
    console.log(`🏗️ 代码内容预览: ${code.substring(0, 500)}...`);

    const extractedClasses: ExtractedClass[] = [];

    // Parse TypeScript struct type definition - enhanced regex
    const structTypeDefRegex = /type\s+([A-Za-z_$][A-Za-z0-9_]*)\s*=\s*\{([^}]*)\}/gi;
    let structMatch;
    let structCount = 0;

    while ((structMatch = structTypeDefRegex.exec(code)) !== null) {
      const structName = structMatch[1];
      const structContent = structMatch[2];
      structCount++;

      console.log(`find type definition ${structCount}:`, structName);

      const fields = parseStructFields(structContent);

      extractedClasses.push({
        name: structName,
        type: 'Struct',
        definition: `type ${structName} = { ... }`,
        fields: fields,
        debugMode: false,
        debugResult: ''
      });
    }

    // Parse TypeAlias type definition (non-object type)
    const typeAliasRegex = /type\s+([A-Za-z_$][A-Za-z0-9_]*)\s*=\s*([^{;]+)(?:;|$)/gi;
    let typeAliasMatch;
    let typeAliasCount = 0;

    while ((typeAliasMatch = typeAliasRegex.exec(code)) !== null) {
      const aliasName = typeAliasMatch[1];
      const aliasType = typeAliasMatch[2].trim();

      // skip types already processed in struct definition
      if (extractedClasses.some(c => c.name === aliasName)) continue;

      typeAliasCount++;
      console.log(`find type alias ${typeAliasCount}:`, aliasName, '=', aliasType);

      extractedClasses.push({
        name: aliasName,
        type: 'TypeAlias',
        definition: `type ${aliasName} = ${aliasType}`,
        debugMode: false,
        debugResult: '',
        valueType: aliasType,
        debugValue: ''
      });
    }

    // Parse Union type
    const unionTypeRegex = /type\s+([A-Za-z_$][A-Za-z0-9_]*)\s*=\s*([^{;]+(?:\s*\|\s*[^{;]+)+)(?:;|$)/gi;
    let unionMatch;
    let unionCount = 0;

    while ((unionMatch = unionTypeRegex.exec(code)) !== null) {
      const unionName = unionMatch[1];
      const unionTypes = unionMatch[2].trim();

      // skip types already processed in struct definition
      if (extractedClasses.some(c => c.name === unionName)) continue;

      unionCount++;
      console.log(`find union type ${unionCount}:`, unionName, '=', unionTypes);

      // parse union type options
      const unionOptions = unionTypes.split('|').map(t => t.trim()).filter(t => t);
      const variants = unionOptions.map(option => ({
        name: option.replace(/['"]/g, ''), // remove quotes
        type: option,
        hasValue: true,
        value: ''
      }));

      extractedClasses.push({
        name: unionName,
        type: 'Union',
        definition: `type ${unionName} = ${unionTypes}`,
        variants: variants,
        debugMode: false,
        debugResult: ''
      });
    }

    // Parse interface definition - enhanced regex
    const interfaceRegex = /interface\s+([A-Za-z_$][A-Za-z0-9_]*)\s*(?:extends\s+[^{]*)?\s*\{([^}]*)\}/gi;
    let interfaceMatch;
    let interfaceCount = 0;

    while ((interfaceMatch = interfaceRegex.exec(code)) !== null) {
      const interfaceName = interfaceMatch[1];
      const interfaceContent = interfaceMatch[2];
      interfaceCount++;

      console.log(`find interface definition ${interfaceCount}:`, interfaceName);

      const fields = parseStructFields(interfaceContent);

      extractedClasses.push({
        name: interfaceName,
        type: 'Struct',
        definition: `interface ${interfaceName} { ... }`,
        fields: fields,
        debugMode: false,
        debugResult: ''
      });
    }

    // Parse enum definition - enhanced regex, support more formats
    const enumPatterns = [
      // standard enum: enum Name { ... }
      /(?:export\s+)?enum\s+([A-Za-z_$][A-Za-z0-9_]*)\s*\{([^}]*)\}/gi,
      // constant enum: const enum Name { ... }
      /(?:export\s+)?const\s+enum\s+([A-Za-z_$][A-Za-z0-9_]*)\s*\{([^}]*)\}/gi
    ];

    let enumCount = 0;
    enumPatterns.forEach(enumRegex => {
      let enumMatch;
      while ((enumMatch = enumRegex.exec(code)) !== null) {
        const enumName = enumMatch[1];
        const enumContent = enumMatch[2];

        // skip types already processed in struct definition
        if (extractedClasses.some(c => c.name === enumName)) continue;

        enumCount++;
        console.log(`find enum definition ${enumCount}:`, enumName);

        const variants = parseEnumMembers(enumContent);

        extractedClasses.push({
          name: enumName,
          type: 'Enum',
          definition: `enum ${enumName} { ... }`,
          variants: variants,
          debugMode: false,
          debugResult: ''
        });
      }
    });

    // Parse class definition - enhanced regex, support more formats
    // first find all class definition start positions, then manually parse content
    const classStartRegex = /(?:export\s+)?class\s+([A-Za-z_$][A-Za-z0-9_]*)\s+extends\s+(Struct|Enum|Vec|Option|Result|Codec|U8aFixed|UInt|Int|Args)\s*(?:<[^>]*>)?\s*\{/gi;
    let classStartMatch;
    let classCount = 0;

    console.log(`🔍 开始搜索类定义...`);

    while ((classStartMatch = classStartRegex.exec(code)) !== null) {
      const className = classStartMatch[1];
      const extendsType = classStartMatch[2];
      const classStartIndex = classStartMatch.index;
      const contentStartIndex = classStartMatch.index + classStartMatch[0].length;

      console.log(`🎯 找到类: ${className} extends ${extendsType}`);

      // manually find matching closing brace
      let braceCount = 1;
      let currentIndex = contentStartIndex;
      let classContent = '';

      while (currentIndex < code.length && braceCount > 0) {
        const char = code[currentIndex];
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
        }

        if (braceCount > 0) {
          classContent += char;
        }
        currentIndex++;
      }

      if (braceCount === 0) {
        classCount++;
        console.log(`  ✅ 成功解析类 ${className}，内容长度: ${classContent.length}`);
        
        // special handling for classes that inherit Args
        if (extendsType === 'Args') {
          console.log(`  🎯 这是一个 Args 继承类: ${className}`);
          // 解析子类构造函数的参数和super调用
          const constructorMatch = classContent.match(/constructor\s*\(\s*([^)]*)\)\s*\{([^}]*)\}/s);
          if (constructorMatch) {
            const constructorParams = constructorMatch[1];
            const constructorBody = constructorMatch[2];
            
            console.log(`解析 ${className} 构造函数参数: ${constructorParams}`);
            
            // 解析 super 调用，支持更灵活的格式
            const superMatch = constructorBody.match(/super\s*\(\s*registry\s*,\s*([^,]+)\s*,\s*([^,\)]+)\s*(?:,\s*([^)]+))?\s*\)/);
            if (superMatch) {
              const param1 = superMatch[1].trim(); // T 参数
              const param2 = superMatch[2].trim(); // S 参数  
              const param3 = superMatch[3]?.trim(); // value 参数（可选）
              
              console.log(`发现 Args 继承类: ${className}`);
              console.log(`  参数1 (T): ${param1}`);
              console.log(`  参数2 (S): ${param2}`);
              if (param3) {
                console.log(`  参数3 (value): ${param3}`);
              }

              // 查找 Args 基类的定义来获取结构
              const argsClassMatch = code.match(/class\s+Args\s+extends\s+Struct\s*\{([^}]*)\}/s);
              let argsFields: DebugField[] = [];

              if (argsClassMatch) {
                const argsClassContent = argsClassMatch[1];
                console.log(`找到 Args 基类，内容长度: ${argsClassContent.length} 字符`);
                console.log(`Args 类内容预览: ${argsClassContent.substring(0, 200)}...`);
                
                // 解析 Args 构造函数中的 super 调用，支持多行格式
                const argsSuperMatch = argsClassContent.match(/super\s*\(\s*registry\s*,\s*\{([^}]*)\}\s*(?:,\s*value)?\s*\)/s);
                
                if (argsSuperMatch) {
                  const structDefinition = argsSuperMatch[1];
                  console.log(`找到 Args 基类结构定义: ${structDefinition.replace(/\s+/g, ' ')}`);
                  
                  // 解析结构字段，支持参数替换
                  const fieldRegex = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*([^,\n}]+)/g;
                  let fieldMatch;
                  
                  while ((fieldMatch = fieldRegex.exec(structDefinition)) !== null) {
                    const fieldName = fieldMatch[1].trim();
                    let fieldType = fieldMatch[2].trim();
                    
                    // 记录原始类型用于显示
                    const originalType = fieldType;
                    
                    // 替换参数：T -> 实际传入的参数值，S -> 实际传入的参数值
                    if (fieldType === 'T') {
                      fieldType = param1;
                    } else if (fieldType === 'S') {
                      fieldType = param2;
                    }
                    
                    console.log(`解析 Args 字段: ${fieldName} : ${originalType} -> ${fieldType}`);
                    
                    argsFields.push({
                      name: fieldName,
                      type: fieldType,
                      value: '',
                      isVec: isVecType(fieldType),
                      isTuple: isTupleType(fieldType),
                      isOption: isOptionType(fieldType),
                      isStruct: false, // 会在后续步骤中解析
                      isEnum: false,
                      itemType: isVecType(fieldType) ? extractVecItemType(fieldType) : undefined,
                      tupleItems: isTupleType(fieldType) ? parseTupleTypes(fieldType) : [],
                      nestedFields: [],
                      enumVariants: [],
                      hasValue: false,
                      items: isVecType(fieldType) ? [{ value: '' }] : [],
                      referencedStructName: undefined,
                      referencedEnumName: undefined
                    });
                  }
                } else {
                  console.log(`未找到 Args 基类的 super 调用，尝试其他格式`);
                  // 尝试更加灵活的正则表达式匹配
                  const patterns = [
                    // 匹配包含 value 参数的完整格式
                    /super\s*\(\s*registry\s*,\s*\{([^}]*)\}\s*,\s*value\s*\)/s,
                    // 匹配没有 value 参数的格式
                    /super\s*\(\s*registry\s*,\s*\{([^}]*)\}\s*\)/s,
                    // 更宽松的匹配，处理可能的空白字符
                    /super\s*\(\s*registry\s*,\s*\{([\s\S]*?)\}\s*(?:,\s*value\s*)?\)/,
                    // 最宽松的匹配
                    /super\s*\([^{]*\{([\s\S]*?)\}/
                  ];
                  
                  let matchFound = false;
                  for (let i = 0; i < patterns.length; i++) {
                    const pattern = patterns[i];
                    const match = argsClassContent.match(pattern);
                    if (match) {
                      const structDefinition = match[1];
                      console.log(`找到 Args 基类结构 (模式${i+1}): ${structDefinition.replace(/\s+/g, ' ')}`);
                      
                      // 解析结构字段
                      const fieldRegex = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*([^,\n}]+)/g;
                      let fieldMatch;
                      
                      while ((fieldMatch = fieldRegex.exec(structDefinition)) !== null) {
                        const fieldName = fieldMatch[1].trim();
                        let fieldType = fieldMatch[2].trim();
                        
                        // 记录原始类型用于显示
                        const originalType = fieldType;
                        
                        // 替换参数：T -> 实际传入的参数值，S -> 实际传入的参数值
                        if (fieldType === 'T') {
                          fieldType = param1;
                        } else if (fieldType === 'S') {
                          fieldType = param2;
                        }
                        
                        console.log(`解析 Args 字段 (模式${i+1}): ${fieldName} : ${originalType} -> ${fieldType}`);
                        
                        argsFields.push({
                          name: fieldName,
                          type: fieldType,
                          value: '',
                          isVec: isVecType(fieldType),
                          isTuple: isTupleType(fieldType),
                          isOption: isOptionType(fieldType),
                          isStruct: false,
                          isEnum: false,
                          itemType: isVecType(fieldType) ? extractVecItemType(fieldType) : undefined,
                          tupleItems: isTupleType(fieldType) ? parseTupleTypes(fieldType) : [],
                          nestedFields: [],
                          enumVariants: [],
                          hasValue: false,
                          items: isVecType(fieldType) ? [{ value: '' }] : [],
                          referencedStructName: undefined,
                          referencedEnumName: undefined
                        });
                      }
                      matchFound = true;
                      break;
                    }
                  }
                  
                  if (!matchFound) {
                    console.log(`所有格式都未匹配成功，Args 类内容:`, argsClassContent.substring(0, 200));
                    // 尝试手动解析 - 如果能看到结构但正则失败
                    if (argsClassContent.includes('signature:') && argsClassContent.includes('payload:')) {
                      console.log(`检测到标准 Args 结构，手动解析`);
                      // 手动创建标准 Args 字段
                      argsFields = [
                        {
                          name: 'signature',
                          type: param2, // S 参数
                          value: '',
                          isVec: isVecType(param2),
                          isTuple: isTupleType(param2),
                          isOption: isOptionType(param2),
                          isStruct: false,
                          isEnum: false,
                          itemType: isVecType(param2) ? extractVecItemType(param2) : undefined,
                          tupleItems: isTupleType(param2) ? parseTupleTypes(param2) : [],
                          nestedFields: [],
                          enumVariants: [],
                          hasValue: false,
                          items: isVecType(param2) ? [{ value: '' }] : [],
                          referencedStructName: undefined,
                          referencedEnumName: undefined
                        },
                        {
                          name: 'signer',
                          type: 'AccountId',
                          value: '',
                          isVec: false,
                          isTuple: false,
                          isOption: false,
                          isStruct: false,
                          isEnum: false,
                          nestedFields: [],
                          enumVariants: [],
                          hasValue: false,
                          items: [],
                          referencedStructName: undefined,
                          referencedEnumName: undefined
                        },
                        {
                          name: 'nonce',
                          type: 'U64',
                          value: '',
                          isVec: false,
                          isTuple: false,
                          isOption: false,
                          isStruct: false,
                          isEnum: false,
                          nestedFields: [],
                          enumVariants: [],
                          hasValue: false,
                          items: [],
                          referencedStructName: undefined,
                          referencedEnumName: undefined
                        },
                        {
                          name: 'payload',
                          type: param1, // T 参数
                          value: '',
                          isVec: isVecType(param1),
                          isTuple: isTupleType(param1),
                          isOption: isOptionType(param1),
                          isStruct: false,
                          isEnum: false,
                          itemType: isVecType(param1) ? extractVecItemType(param1) : undefined,
                          tupleItems: isTupleType(param1) ? parseTupleTypes(param1) : [],
                          nestedFields: [],
                          enumVariants: [],
                          hasValue: false,
                          items: isVecType(param1) ? [{ value: '' }] : [],
                          referencedStructName: undefined,
                          referencedEnumName: undefined
                        }
                      ];
                      console.log(`手动解析完成，创建了 ${argsFields.length} 个字段`);
                    } else {
                      // 提供一个通用的结构提示
                      argsFields = [{
                        name: 'unknown_structure',
                        type: 'any',
                        value: '',
                        isVec: false,
                        isTuple: false,
                        isOption: false,
                        isStruct: false,
                        isEnum: false,
                        nestedFields: [],
                        enumVariants: [],
                        hasValue: false,
                        items: [],
                        referencedStructName: undefined,
                        referencedEnumName: undefined
                      }];
                    }
                  }
                }
              } else {
                console.log(`代码中未找到 Args 基类定义`);
                // 如果代码中没有 Args 的定义，创建一个提示字段
                argsFields = [{
                  name: 'args_not_found',
                  type: 'any',
                  value: '',
                  isVec: false,
                  isTuple: false,
                  isOption: false,
                  isStruct: false,
                  isEnum: false,
                  nestedFields: [],
                  enumVariants: [],
                  hasValue: false,
                  items: [],
                  referencedStructName: undefined,
                  referencedEnumName: undefined
                }];
              }

              extractedClasses.push({
                name: className,
                type: 'Struct',
                definition: `class ${className} extends Args`,
                fields: argsFields,
                debugMode: false,
                debugResult: '',
                baseType: 'Args',
                valueType: `Args<T: ${param1}, S: ${param2}${param3 ? `, value: ${param3}` : ''}>`,
                // 添加构造函数参数信息
                constructorParams: {
                  original: constructorParams,
                  T: param1,
                  S: param2,
                  value: param3,
                  argsFieldsCount: argsFields.length,
                  parseStatus: argsFields.length > 0 && argsFields[0].name !== 'unknown_structure' && argsFields[0].name !== 'args_not_found' ? 'success' : 'failed'
                }
              });

              console.log(`创建 Args 结构体: ${className}, 字段数: ${argsFields.length}`);
            } else {
              console.log(`未找到 ${className} 的 super 调用`);
            }
          } else {
            console.log(`未找到 ${className} 的构造函数`);
          }
          continue;
        }

        // parse type definition in constructor - use manual brace counting
        let typeDefStr = '';

        // find super(registry, { ... }) pattern
        const superStartMatch = classContent.match(/super\s*\(\s*registry\s*,\s*\{/);
        if (superStartMatch) {
          const startIndex = superStartMatch.index! + superStartMatch[0].length - 1; // locate to the starting {
          let braceCount = 1;
          let endIndex = startIndex + 1;

          console.log('start parse super call brace, start index:', startIndex);

          // manually count braces to find matching closing brace
          while (endIndex < classContent.length && braceCount > 0) {
            if (classContent[endIndex] === '{') {
              braceCount++;
            } else if (classContent[endIndex] === '}') {
              braceCount--;
            }
            endIndex++;
          }

          if (braceCount === 0) {
            typeDefStr = classContent.substring(startIndex + 1, endIndex - 1);
            console.log('extract complete super content:', typeDefStr.substring(0, 300) + '...');
          } else {
            console.log('super call brace not match, braceCount:', braceCount);
          }
        }

        // if manual parsing fails, try other patterns
        if (!typeDefStr) {
          const constructorMatches = [
            /super\s*\(\s*registry\s*,\s*([^,)]+)\s*,\s*value\s*\)/gi,
            /super\s*\(\s*registry\s*,\s*([^)]+)\)/gi
          ];

          for (const pattern of constructorMatches) {
            pattern.lastIndex = 0; // reset regex
            const match = pattern.exec(classContent);
            if (match) {
              typeDefStr = match[1];
              break;
            }
          }
        }

        if (typeDefStr) {
          console.log(`find constructor type definition:`, typeDefStr.substring(0, 200) + '...');

          if (extendsType === 'Struct') {
            // handle multi-line Struct definition
            const cleanedTypeDef = `{${typeDefStr}}`;
            const fields = parseObjectFieldsToDebugFields(cleanedTypeDef);
            extractedClasses.push({
              name: className,
              type: 'Struct',
              definition: `class ${className} extends Struct { ... }`,
              fields: fields,
              debugMode: false,
              debugResult: ''
            });
          } else if (extendsType === 'Enum') {
            // handle multi-line Enum definition
            const cleanedTypeDef = `{${typeDefStr}}`;
            const variants = parseEnumVariantsFromClassDef(cleanedTypeDef);
            extractedClasses.push({
              name: className,
              type: 'Enum',
              definition: `class ${className} extends Enum { ... }`,
              variants: variants,
              debugMode: false,
              debugResult: ''
            });
          } else if (['Vec', 'U8aFixed', 'UInt', 'Int'].includes(extendsType)) {
            // for Vec type, try to extract item type from constructor
            let itemType = undefined;
            if (extendsType === 'Vec') {
              // find super(registry, ItemType, value) pattern
              const vecSuperMatch = classContent.match(/super\s*\(\s*registry\s*,\s*([^,\s]+)\s*,\s*value\s*\)/);
              if (vecSuperMatch) {
                itemType = vecSuperMatch[1].trim();
                console.log(`Vec type ${className} item type:`, itemType);
              }
            }

            extractedClasses.push({
              name: className,
              type: extendsType,
              definition: `class ${className} extends ${extendsType} { ... }`,
              debugMode: false,
              debugResult: '',
              baseType: extendsType,
              debugValue: '',
              vecValues: extendsType === 'Vec' ? [''] : undefined, // initialize an array with one empty item for Vec type
              itemType: itemType || (extendsType === 'Vec' ? 'any' : undefined) // use parsed type or default type
            });
          }
        } else {
          console.log(`not find constructor type definition for ${className}`);
        }
      }
    }

    // 2. parse simple const exports (Codec factory function)
    const simpleConstExportRegex = /export\s+const\s+([A-Za-z_$][A-Za-z0-9_]*)\s*=\s*([^;]+);/gi;
    let simpleConstMatch;
    let simpleConstCount = 0;

    while ((simpleConstMatch = simpleConstExportRegex.exec(code)) !== null) {
      const constName = simpleConstMatch[1];
      const constValue = simpleConstMatch[2].trim();

      // Skip already processed constants
      if (extractedClasses.some(c => c.name === constName)) continue;

      simpleConstCount++;
      console.log(`Found constant export ${simpleConstCount}:`, constName, '=', constValue.substring(0, 30) + '...');

      // Check if it's a type definition - extended support for more types
      const isFactoryFunction = constValue.includes('Struct.with') || constValue.includes('Enum.with') ||
        constValue.includes('Vec.with') || constValue.includes('Option.with') ||
        constValue.includes('U8aFixed.with') || constValue.includes('Tuple.with');

      // Check if it's a simple Polkadot type alias
      const polkadotTypePattern = /^(u8|u16|u32|u64|u128|u256|i8|i16|i32|i64|i128|i256|U8|U16|U32|U64|U128|U256|I8|I16|I32|I64|I128|I256|bool|Bool|Text|Bytes|String|H160|H256|H512|AccountId|Balance|BlockNumber|Hash|Moment|Compact|Option|Vec|Result|BTreeMap|BTreeSet|WeakBoundedVec|BoundedVec|RuntimeDbWeight|Weight|DispatchClass|Pays|PerDispatchClass|SpWeightsWeightV2Weight|FrameSystemEventRecord|SpRuntimeDispatchError|DispatchError|SpArithmeticArithmeticError|SpRuntimeTokenError|SpRuntimeModuleError|SpRuntimeTransactionalError|PalletBalancesEvent|PalletTransactionPaymentEvent)$/;

      const isSimpleType = polkadotTypePattern.test(constValue);

      // Check if it's a type constructor call (like U32(5), Text('hello'))
      const typeConstructorPattern = /^([A-Z][A-Za-z0-9_]*)\s*\(/;
      const isTypeConstructor = typeConstructorPattern.test(constValue);

      console.log(`  Type check: isFactoryFunction=${isFactoryFunction}, isSimpleType=${isSimpleType}, isTypeConstructor=${isTypeConstructor}`);

      if (isFactoryFunction || isSimpleType || isTypeConstructor) {
        let extractedType = 'TypeAlias';
        let itemType = undefined;
        let vecValues = undefined;
        let baseType = undefined;

        if (isFactoryFunction) {
          // Special handling for factory function types
          if (constValue.includes('Vec.with')) {
            extractedType = 'Vec';
            baseType = 'Vec';
            const vecMatch = constValue.match(/Vec\.with\s*\(\s*([^)]+)\s*\)/);
            if (vecMatch) {
              itemType = vecMatch[1].trim();
            }
            vecValues = ['']; // Initialize with one empty item
          } else if (constValue.includes('U8aFixed.with')) {
            extractedType = 'U8aFixed';
            baseType = 'U8aFixed';
            // 提取位长度信息
            const bitLengthMatch = constValue.match(/U8aFixed\.with\s*\(\s*(\d+)(?:\s+as\s+U8aBitLength)?\s*\)/);
            if (bitLengthMatch) {
              const bitLength = bitLengthMatch[1];
              baseType = `U8aFixed<${bitLength}>`;
              console.log(`解析 U8aFixed 类型: ${constName}, 位长度: ${bitLength}`);
            }
          } else if (constValue.includes('Struct.with')) {
            extractedType = 'Struct';
            baseType = 'Struct';
          } else if (constValue.includes('Enum.with')) {
            extractedType = 'Enum';
            baseType = 'Enum';
          } else if (constValue.includes('Option.with')) {
            extractedType = 'Option';
            baseType = 'Option';
          } else if (constValue.includes('Tuple.with')) {
            extractedType = 'Tuple';
            baseType = 'Tuple';
          }
        } else if (isSimpleType) {
          // Simple type alias
          extractedType = 'TypeAlias';
          baseType = constValue;

          // Special handling for known composite types
          if (constValue.startsWith('Vec')) {
            extractedType = 'Vec';
            baseType = 'Vec';
            vecValues = [''];
          } else if (constValue.startsWith('Option')) {
            extractedType = 'Option';
            baseType = 'Option';
          } else if (['u8', 'u16', 'u32', 'u64', 'u128', 'u256', 'i8', 'i16', 'i32', 'i64', 'i128', 'i256', 'U8', 'U16', 'U32', 'U64', 'U128', 'U256', 'I8', 'I16', 'I32', 'I64', 'I128', 'I256'].includes(constValue)) {
            extractedType = 'Integer';
            baseType = constValue;
          } else if (constValue === 'bool' || constValue === 'Bool') {
            extractedType = 'Boolean';
            baseType = constValue;
          } else if (constValue === 'Text' || constValue === 'Bytes' || constValue === 'String') {
            extractedType = 'Text';
            baseType = constValue;
          } else if (['H160', 'H256', 'H512'].includes(constValue)) {
            extractedType = 'Hash';
            baseType = constValue;
          }
        } else if (isTypeConstructor) {
          // Type constructor call
          const constructorMatch = constValue.match(/^([A-Z][A-Za-z0-9_]*)\s*\(/);
          if (constructorMatch) {
            const constructorType = constructorMatch[1];
            extractedType = 'TypeAlias';
            baseType = constructorType;
          }
        }

        extractedClasses.push({
          name: constName,
          type: extractedType,
          definition: `export const ${constName} = ${constValue}`,
          debugMode: false,
          debugResult: '',
          valueType: constValue,
          debugValue: '',
          baseType: baseType,
          itemType: itemType,
          vecValues: vecValues
        });

        console.log(`Added constant type: ${constName} (${extractedType}) -> ${constValue}`);
      } else {
        console.log(`Skipped non-type constant: ${constName} = ${constValue}`);
      }
    }

    console.log(`Parsing completed, found ${extractedClasses.length} type definitions:`,
      extractedClasses.map(c => `${c.name}(${c.type})`).join(', '));

    return extractedClasses;
  }, [parseStructFields, parseEnumMembers, parseObjectFieldsToDebugFields, parseEnumVariantsFromClassDef]);

  const executeDebug = useCallback(async (classIndex: number) => {
    const codecClass = extractedClasses[classIndex];
    if (!codecClass) return;

    try {
      let result = '';

      if (codecClass.type === 'Struct' && codecClass.fields) {
        const structData = collectNestedStructData(codecClass.fields);

        const StructType = (window as any)[codecClass.name];
        if (StructType) {
          const instance = new StructType((window as any).registry, structData);
          const hex = instance.toHex();
          const humanReadable = instance?.toHuman() || 'null';
          const json = instance?.toJSON() || 'null';
          result = `Created ${codecClass.name}: \nhex: ${hex} \n\nhumanReadable: ${JSON.stringify(humanReadable, null, 2)} \n\njson: ${JSON.stringify(json, null, 2)}`;
        } else {
          result = `Structure data: ${JSON.stringify(structData, null, 2)}`;
        }
      } else if (codecClass.type === 'Enum' && codecClass.variants && codecClass.selectedVariant) {
        const selectedVariant = codecClass.variants.find(v => v.name === codecClass.selectedVariant);
        const selectedVariantIndex = codecClass.variants.findIndex(v => v.name === codecClass.selectedVariant);
        if (selectedVariant) {
          let enumData: any;

          // Check if the selected variant has nested fields (like Struct.with type)
          if (selectedVariant.nestedFields && selectedVariant.nestedFields.length > 0) {
            // Collect nested field data
            const nestedStructData = collectNestedStructData(selectedVariant.nestedFields);
            enumData = { [selectedVariant.name]: nestedStructData };
            console.log(`Enum ${codecClass.name} nested data:`, enumData);
          } else {
            // Simple value type variant
            enumData = { [selectedVariant.name]: selectedVariant.value || null };
          }

          const EnumType = (window as any)[codecClass.name];
          if (EnumType) {
            const instance = new EnumType((window as any).registry, enumData, selectedVariantIndex);
            const hex = instance.toHex();
            const humanReadable = instance?.toHuman() || 'null';
            const json = instance?.toJSON() || 'null';
            result = `Created ${codecClass.name}: \nhex: ${hex} \n\nhumanReadable: ${JSON.stringify(humanReadable, null, 2)} \n\njson: ${JSON.stringify(json, null, 2)}`;
          } else {
            result = `Enum data: ${JSON.stringify(enumData, null, 2)}`;
          }
        }
      } else if (codecClass.type === 'VecFixed' && codecClass.vecValues) {
        const VecFixedType = (window as any)[codecClass.name];
        if (VecFixedType) {
          const instance = new VecFixedType((window as any).registry, codecClass.vecValues);
          const hex = instance.toHex();
          const humanReadable = instance?.toHuman() || 'null';
          const json = instance?.toJSON() || 'null';
          result = `Created ${codecClass.name}: \nhex: ${hex} \n\nhumanReadable: ${JSON.stringify(humanReadable, null, 2)} \n\njson: ${JSON.stringify(json, null, 2)}`;
        } else {
          result = `VecFixed data: [${codecClass.vecValues.join(', ')}]`;
        }
      } else if (codecClass.type === 'Vec' && codecClass.vecValues) {
        const VecType = (window as any)[codecClass.name];
        if (VecType) {
          const instance = new VecType((window as any).registry, codecClass.vecValues);
          const hex = instance.toHex();
          const humanReadable = instance?.toHuman() || 'null';
          const json = instance?.toJSON() || 'null';
          result = `Created ${codecClass.name}: \nhex: ${hex} \n\nhumanReadable: ${JSON.stringify(humanReadable, null, 2)} \n\njson: ${JSON.stringify(json, null, 2)}`;
        } else {
          result = `Vec data: [${codecClass.vecValues.join(', ')}]`;
        }
      } else if (codecClass.debugValue !== '') {
        const Type = (window as any)[codecClass.name];
        if (Type) {
          const instance = new Type((window as any).registry, codecClass.debugValue);
          const hex = instance.toHex();
          const humanReadable = instance?.toHuman() || 'null';
          const json = instance?.toJSON() || 'null';
          result = `Created ${codecClass.name}: \nhex: ${hex} \n\nhumanReadable: ${JSON.stringify(humanReadable, null, 2)} \n\njson: ${JSON.stringify(json, null, 2)}`;
        } else {
          result = `Value: ${codecClass.debugValue}`;
        }
      }

      setExtractedClasses(prev => prev.map((item, i) =>
        i === classIndex ? { ...item, debugResult: result } : item
      ));
    } catch (error) {
      console.error("error", error);
      const errorMsg = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setExtractedClasses(prev => prev.map((item, i) =>
        i === classIndex ? { ...item, debugResult: errorMsg } : item
      ));
    }
  }, [extractedClasses, collectNestedStructData]);

  const executeFunctionDebug = useCallback(async (functionIndex: number) => {
    const func = functions[functionIndex];
    if (!func || !func.debugInputs) return;

    try {
      const functionArgs = collectNestedStructData(func.debugInputs);
      
      const FunctionType = (window as any)[func.name];
      let result = '';

      console.log("func.name", func.name)
      console.log("functionArgs", functionArgs)

      if (FunctionType && typeof FunctionType === 'function') {
        console.log("FunctionType", FunctionType, "functionArgs", functionArgs, Object.values(functionArgs))
        const functionResult = await FunctionType(...Object.values(functionArgs));
        result = `Function call result:\n${JSON.stringify(functionResult, null, 2)}`;
      } else {
        result = `Function ${func.name} parameters data:\n${JSON.stringify(functionArgs, null, 2)}\n\nParameter types:\n${func.parameters.map(p => `${p.name}: ${p.type}`).join('\n')}`;
      }

      setFunctions(prev => prev.map((f, i) =>
        i === functionIndex ? { ...f, debugResult: result } : f
      ));
    } catch (error) {
      console.error("Function execution error", error);
      const errorMsg = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setFunctions(prev => prev.map((f, i) =>
        i === functionIndex ? { ...f, debugResult: errorMsg } : f
      ));
    }
  }, [functions, collectNestedStructData]);

  const addVecItem = useCallback((classIndex: number) => {
    setExtractedClasses(prev => prev.map((item, i) => {
      if (i === classIndex) {
        // Ensure vecValues exists, initialize with empty array if it doesn't
        const currentVecValues = item.vecValues || [];
        return { ...item, vecValues: [...currentVecValues, ''] };
      }
      return item;
    }));
  }, []);

  const removeVecItem = useCallback((classIndex: number, itemIndex: number) => {
    setExtractedClasses(prev => prev.map((item, i) => {
      if (i === classIndex) {
        const currentVecValues = item.vecValues || [];
        return {
          ...item,
          vecValues: currentVecValues.filter((_, idx) => idx !== itemIndex)
        };
      }
      return item;
    }));
  }, []);

  const addVecItemForNestedField = useCallback((classIndex: number, fieldPath: string) => {
    const pathParts = fieldPath.split('.');

    setExtractedClasses(prev => prev.map((item, i) => {
      if (i !== classIndex || !item.fields) return item;

      const updatedFields = [...item.fields];
      let currentFields = updatedFields;

      // Navigate to the correct nested field
      for (let j = 0; j < pathParts.length - 1; j++) {
        const field = currentFields.find(f => f.name === pathParts[j]);
        if (field && field.nestedFields) {
          currentFields = field.nestedFields;
        }
      }

      // Find the target field and add Vec item
      const targetField = currentFields.find(f => f.name === pathParts[pathParts.length - 1]);
      if (targetField && targetField.isVec && targetField.items) {
        targetField.items = [...targetField.items, { value: '' }];
      }

      return { ...item, fields: updatedFields };
    }));
  }, []);

  const removeVecItemForNestedField = useCallback((classIndex: number, fieldPath: string, itemIndex: number) => {
    const pathParts = fieldPath.split('.');

    setExtractedClasses(prev => prev.map((item, i) => {
      if (i !== classIndex || !item.fields) return item;

      const updatedFields = [...item.fields];
      let currentFields = updatedFields;

      // Navigate to the correct nested field
      for (let j = 0; j < pathParts.length - 1; j++) {
        const field = currentFields.find(f => f.name === pathParts[j]);
        if (field && field.nestedFields) {
          currentFields = field.nestedFields;
        }
      }

      // Find the target field and remove Vec item
      const targetField = currentFields.find(f => f.name === pathParts[pathParts.length - 1]);
      if (targetField && targetField.isVec && targetField.items) {
        targetField.items = targetField.items.filter((_, idx) => idx !== itemIndex);
      }

      return { ...item, fields: updatedFields };
    }));
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



  const inferTypeFromFunctionBody = useCallback((functionBody: string, paramName: string, functionName: string): string | null => {
    console.log(`    🔍 开始推断参数 ${paramName} 的类型，函数: ${functionName}`);
    console.log(`    函数体内容片段: ${functionBody.substring(0, 200)}...`);
    
    // pattern1: new SomeType(registry, TypeArg, paramName) - 3-param constructor
    const constructorPattern = new RegExp(`new\\s+([A-Za-z_$][A-Za-z0-9_$]*)\\s*\\(\\s*registry\\s*,\\s*([A-Za-z_$][A-Za-z0-9_$]*)\\s*,\\s*${paramName}\\s*\\)`, 'g');
    let match = constructorPattern.exec(functionBody);
    console.log(`    🔍 模式1检查 (三参数构造): 匹配=${!!match}`);
    if (match) {
      const constructorType = match[1]; // SignedArgs
      const typeArg = match[2]; // SetModeArg
      
      // 对于三参数构造函数模式，返回构造函数类型（最外层类型）
      // 例如：new SignedArgs(registry, SetModeArg, argsArg) -> argsArg 类型应该是 SignedArgs
      console.log(`    ✓ 三参数构造函数模式: new ${constructorType}(registry, ${typeArg}, ${paramName})`);
      console.log(`    推断 ${paramName} 类型为最外层类型: ${constructorType} (内部类型: ${typeArg})`);
      
      // 将内部类型信息存储，使用更具体的缓存键避免冲突
      (window as any).__typeInferenceCache = (window as any).__typeInferenceCache || {};
      const cacheKey = `${functionName}_${paramName}_${constructorType}_innerType`;
      (window as any).__typeInferenceCache[cacheKey] = typeArg;
      console.log(`    缓存类型信息: ${cacheKey} = ${typeArg}`);
      
      return constructorType; // 返回 SignedArgs 而不是 SetModeArg
    }

    // pattern2: new TypeName(registry, paramName) - 2-param constructor
    const twoParamConstructorPattern = new RegExp(`new\\s+([A-Za-z_$][A-Za-z0-9_$]*)\\s*\\(\\s*registry\\s*,\\s*${paramName}\\s*\\)`, 'g');
    match = twoParamConstructorPattern.exec(functionBody);
    console.log(`    🔍 模式2检查 (双参数构造): 匹配=${!!match}`);
    if (match) {
      const constructorType = match[1];
      console.log(`    ✓ 双参数构造函数模式: new ${constructorType}(registry, ${paramName})`);
      return constructorType;
    }

    // pattern3: new SomeType(registry, typeArg, paramName) - case insensitive
    const constructorPattern2 = new RegExp(`new\\s+([A-Za-z_$][A-Za-z0-9_$]*)\\s*\\(\\s*[^,]+\\s*,\\s*([A-Za-z_$][A-Za-z0-9_$]*)\\s*,\\s*${paramName}\\s*\\)`, 'gi');
    match = constructorPattern2.exec(functionBody);
    console.log(`    🔍 模式3检查 (通用三参数): 匹配=${!!match}`);
    if (match) {
      const constructorType = match[1];
      const typeArg = match[2];
      console.log(`    ✓ 通用三参数构造函数模式: new ${constructorType}(..., ${typeArg}, ${paramName})`);
      return typeArg;
    }

    // pattern4: paramName as SomeType
    const asPattern = new RegExp(`${paramName}\\s+as\\s+([A-Za-z_$][A-Za-z0-9_$<>\\[\\]]+)`, 'g');
    match = asPattern.exec(functionBody);
    console.log(`    🔍 模式4检查 (as 类型转换): 匹配=${!!match}`);
    if (match) {
      console.log(`    ✓ as 类型转换模式: ${paramName} as ${match[1]}`);
      return match[1];
    }

    // pattern5: (paramName: SomeType)
    const typeAnnotationPattern = new RegExp(`\\(\\s*${paramName}\\s*:\\s*([A-Za-z_$][A-Za-z0-9_$<>\\[\\]]+)\\s*\\)`, 'g');
    match = typeAnnotationPattern.exec(functionBody);
    console.log(`    🔍 模式5检查 (类型注解): 匹配=${!!match}`);
    if (match) {
      console.log(`    ✓ 类型注解模式: (${paramName}: ${match[1]})`);
      return match[1];
    }

    // pattern6: SomeType.from(paramName) or SomeType.create(paramName)
    const factoryPattern = new RegExp(`([A-Za-z_$][A-Za-z0-9_$]*)\\.(?:from|create|with)\\s*\\(\\s*[^,]*${paramName}`, 'g');
    match = factoryPattern.exec(functionBody);
    console.log(`    🔍 模式6检查 (工厂方法): 匹配=${!!match}`);
    if (match) {
      console.log(`    ✓ 工厂方法模式: ${match[1]}.from/create/with(...${paramName}...)`);
      return match[1];
    }

    // pattern7: more loose constructor pattern, support multi-param - const something = new Type(registry, SomeArg, paramName, ...)
    const looseConstructorPattern = new RegExp(`new\\s+([A-Za-z_$][A-Za-z0-9_$]*)\\s*\\([^)]*${paramName}[^)]*\\)`, 'g');
    match = looseConstructorPattern.exec(functionBody);
    console.log(`    🔍 模式7检查 (宽松构造): 匹配=${!!match}`);
    if (match) {
      const fullMatch = match[0];
      const typeArgPattern = /new\s+[A-Za-z_$][A-Za-z0-9_$]*\s*\(\s*[^,]+\s*,\s*([A-Za-z_$][A-Za-z0-9_$]*)/;
      const typeArgMatch = typeArgPattern.exec(fullMatch);
      if (typeArgMatch) {
        console.log(`    ✓ 宽松构造函数模式: ${fullMatch} -> ${typeArgMatch[1]}`);
        return typeArgMatch[1];
      }
    }
    
    console.log(`    ❌ 所有模式都未匹配，无法推断类型`);
    return null;
  }, []);

  const parseFunctionBodyTypes = useCallback((functionBody: string, parameters: Parameter[], functionName: string): Parameter[] => {
    if (!functionBody) return parameters;

    console.log(`🔍 解析函数 ${functionName} 的参数类型，函数体长度: ${functionBody.length}`);
    console.log(`  原始参数: [${parameters.map(p => `${p.name}:${p.type}`).join(', ')}]`);

    const updatedParameters = parameters.map(param => {
      if (param.type !== 'any' && param.type !== 'unknown' && !param.type.includes('any')) {
        console.log(`    ⏭️ 跳过 ${param.name}，已有明确类型: ${param.type}`);
        return param;
      }

      console.log(`    🔍 推断参数 ${param.name} 的类型...`);
      const inferredType = inferTypeFromFunctionBody(functionBody, param.name, functionName);
      if (inferredType) {
        console.log(`    ✅ 成功推断 ${param.name} 类型: ${param.type} -> ${inferredType}`);
        return {
          ...param,
          type: inferredType,
          customTypeName: isCustomType(inferredType) ? inferredType : undefined
        };
      } else {
        console.log(`    ❌ 未能推断 ${param.name} 的类型，保持原类型: ${param.type}`);
      }

      return param;
    });

    console.log(`  ✅ 函数 ${functionName} 类型推断完成: [${updatedParameters.map(p => `${p.name}:${p.type}`).join(', ')}]`);
    return updatedParameters;
  }, [inferTypeFromFunctionBody, isCustomType]);

  const extractAndDefineFunctions = useCallback((code: string) => {
    if (!code || typeof code !== 'string') return;
    
    console.log(`📚 开始解析函数，代码长度: ${code.length}`);
    console.log(`📚 代码内容预览: ${code.substring(0, 500)}...`);
    
    const parsedFunctions: ParsedFunction[] = [];

    const functionPatterns = [
      // standard function definition: function name(params): returnType { body }
      /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(([^)]*)\)\s*:\s*([^{]+)\s*\{([^]*?)\}/gi,
      // arrow function: const name = (params): returnType => { body }
      /(?:export\s+)?const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*:\s*([^=]+)\s*=>\s*\{([^]*?)\}/gi,
    ];

    let totalMatches = 0;

    functionPatterns.forEach((pattern, patternIndex) => {
      let match;
      console.log(`🔍 使用模式 ${patternIndex + 1} 搜索函数...`);

      // reset regex lastIndex
      pattern.lastIndex = 0;

      while ((match = pattern.exec(code)) !== null) {
        const name = match[1];
        const params = match[2] || '';
        const returnType = match[3];
        const functionBody = match[4] || '';
        
        console.log(`🎯 找到函数: ${name}(${params}): ${returnType.trim()}`);
        console.log(`  函数体预览: ${functionBody.substring(0, 100)}...`);
        
        const existingFunction = parsedFunctions.find(f => f.name === name);
        if (existingFunction) {
          console.log(`  ⚠️ 跳过重复函数: ${name}`);
          continue;
        }
        
        totalMatches++;

        const parameters = parseParameters(params);
        console.log(`  📝 解析到参数: [${parameters.map(p => `${p.name}:${p.type}`).join(', ')}]`);
        
        const enhancedParameters = parseFunctionBodyTypes(functionBody, parameters, name);

        parsedFunctions.push({
          name,
          parameters: enhancedParameters,
          returnType: returnType.trim(),
        });
        
        console.log(`  ✅ 函数 ${name} 解析完成，最终参数: [${enhancedParameters.map(p => `${p.name}:${p.type}`).join(', ')}]`);
      }
    });

    console.log(`📚 函数解析完成，找到 ${parsedFunctions.length} 个函数:`,
      parsedFunctions.map(f => `${f.name}(${f.parameters.length} parameters)`).join(', '));

    setFunctions(parsedFunctions);
  }, [parseParameters, parseFunctionBodyTypes]);

  const parseTsCode = useCallback(async () => {
    const codeToparse = currentCode || tsCode;
    if (!codeToparse) return;

    if (type === 'type') {
      const extractedPolkadotTypes = extractAndDefineClasses(codeToparse);
      setExtractedClasses(extractedPolkadotTypes);
    }else {
      const extractedPolkadotTypes = extractAndDefineClasses(codeToparse);
      setExtractedClasses(extractedPolkadotTypes);
      extractAndDefineFunctions(codeToparse);
    }
  }, [currentCode, tsCode, extractAndDefineClasses, extractAndDefineFunctions, type]);

  useEffect(() => {
    parseTsCode();
  }, [tsCode, currentCode, parseTsCode]);

  // When the incoming tsCode changes, update currentCode
  useEffect(() => {
    setCurrentCode(tsCode);
  }, [tsCode]);

  // New useEffect to handle nested structure parsing
  useEffect(() => {
    if (extractedClasses.length > 0) {
      const resolvedClasses = extractedClasses.map(cls => {
        if (cls.type === 'Struct' && cls.fields) {
          const resolvedFields = cls.fields.map(field => {
            const isStruct = isCustomType(field.type) &&
              extractedClasses.some(c => c.name === field.type && c.type === 'Struct');

            const isEnum = isCustomType(field.type) &&
              extractedClasses.some(c => c.name === field.type && c.type === 'Enum');

            if (isStruct && !field.isStruct) { // Handle Struct type references
              const structClass = extractedClasses.find(c => c.name === field.type && c.type === 'Struct');
              return {
                ...field,
                isStruct: true,
                referencedStructName: field.type,
                nestedFields: structClass?.fields ? JSON.parse(JSON.stringify(structClass.fields)) : []
              };
            } else if (isEnum && !field.isEnum) { // Handle Enum type references
              const enumClass = extractedClasses.find(c => c.name === field.type && c.type === 'Enum');
              return {
                ...field,
                isEnum: true,
                referencedEnumName: field.type,
                enumVariants: enumClass?.variants ? JSON.parse(JSON.stringify(enumClass.variants)) : []
              };
            }
            return field;
          });

          // Check if any fields have been updated
          const hasChanges = resolvedFields.some((field, index) =>
            field.isStruct !== cls.fields![index]?.isStruct ||
            field.isEnum !== cls.fields![index]?.isEnum
          );

          if (hasChanges) {
            return {
              ...cls,
              fields: resolvedFields
            };
          }
        }
        return cls;
      });

      // Only update state when there are actual changes
      const hasAnyChanges = resolvedClasses.some((cls, index) => cls !== extractedClasses[index]);
      if (hasAnyChanges) {
        setExtractedClasses(resolvedClasses);
      }
    }
  }, [extractedClasses, isCustomType]);

  useEffect(() => {
    if (extractedClasses.length > 0) {
      setFunctions(prevFunctions => {
        if (prevFunctions.length === 0) {
          console.log('no functions to update');
          return prevFunctions;
        }

        const updatedFunctions = prevFunctions.map(func => {
          if (func.debugInputs) {
            const updatedDebugInputs = func.debugInputs.map(input => {
              const referencedStruct = extractedClasses.find(c => c.name === input.type && c.type === 'Struct');
              const referencedEnum = extractedClasses.find(c => c.name === input.type && c.type === 'Enum');
              
              if (referencedStruct && !input.isStruct) {
                return {
                  ...input,
                  isStruct: true,
                  referencedStructName: input.type,
                  nestedFields: referencedStruct.fields ? JSON.parse(JSON.stringify(referencedStruct.fields)) : []
                };
              } else if (referencedEnum && !input.isEnum) {
                return {
                  ...input,
                  isEnum: true,
                  referencedEnumName: input.type,
                  enumVariants: referencedEnum.variants ? JSON.parse(JSON.stringify(referencedEnum.variants)) : []
                };
              }
              return input;
            });

            const hasChanges = updatedDebugInputs.some((input, index) =>
              input.isStruct !== func.debugInputs![index]?.isStruct ||
              input.isEnum !== func.debugInputs![index]?.isEnum ||
              (input.nestedFields?.length || 0) !== (func.debugInputs![index]?.nestedFields?.length || 0) ||
              (input.enumVariants?.length || 0) !== (func.debugInputs![index]?.enumVariants?.length || 0)
            );

            if (hasChanges) {
              return {
                ...func,
                debugInputs: updatedDebugInputs
              };
            }
          }
          return func;
        });

        const hasAnyChanges = updatedFunctions.some((func, index) => {
          const originalFunc = prevFunctions[index];
          return func !== originalFunc;
        });
        
        if (hasAnyChanges) {
          return updatedFunctions;
        } else {
          return prevFunctions;
        }
      });
    }
  }, [extractedClasses]);

  const renderFieldInput = useCallback((
    field: DebugField,
    classIndex: number,
    fieldPath: string,
    level: number = 0,
    context: 'type' | 'function' = 'type'
  ) => {
    const indent = level * 20;

    const handleValueUpdate = (path: string, newValue: any) => {
      if (context === 'function') {
        updateFunctionInput(classIndex, path, newValue);
      } else {
        updateDebugValue(classIndex, path, newValue);
      }
    };

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
                if (level > 0) {
                  if (context === 'function') {
                    const newItems = [...(field.items || []), { value: '' }];
                    updateFunctionInput(classIndex, `${fieldPath}.items`, newItems);
                  } else {
                    addVecItemForNestedField(classIndex, fieldPath);
                  }
                } else {
                  const newItems = [...(field.items || []), { value: '' }];
                  handleValueUpdate(`${fieldPath}.items`, newItems);
                }
              }}
            >
              Add Item
            </Button>
          </div>
          {field.items.map((item, itemIndex) => (
            <div key={`${fieldPath}[${itemIndex}]`} className="flex items-center gap-2" style={{ marginLeft: `${indent + 20}px` }}>
              <span className="text-xs text-default-500 w-8">[{itemIndex}]</span>
              <Input
                size="sm"
                placeholder={getPlaceholder(field.itemType || 'any')}
                value={item.value || ''}
                onChange={(e) => handleValueUpdate(`${fieldPath}[${itemIndex}].value`, e.target.value)}
              />
              <Button
                size="sm"
                variant="flat"
                color="danger"
                onPress={() => {
                  if (level > 0) {
                    if (context === 'function') {
                      const newItems = field.items?.filter((_, idx) => idx !== itemIndex) || [];
                      updateFunctionInput(classIndex, `${fieldPath}.items`, newItems);
                    } else {
                      removeVecItemForNestedField(classIndex, fieldPath, itemIndex);
                    }
                  } else {
                    const newItems = field.items?.filter((_, idx) => idx !== itemIndex) || [];
                    handleValueUpdate(`${fieldPath}.items`, newItems);
                  }
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
                  handleValueUpdate(`${fieldPath}.tupleItems`, newTupleItems);
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
            <Chip size="sm" variant="flat" color="secondary">
              {field.referencedStructName || 'Struct'}
            </Chip>
            {field.referencedStructName && (
              <Chip size="sm" variant="dot" color="primary">
                Reference: {field.referencedStructName}
              </Chip>
            )}
          </div>
          <div className="border-l-2 border-blue-200 pl-4" style={{ marginLeft: `${indent + 10}px` }}>
            {field.nestedFields.map((nestedField, nestedIndex) =>
              renderFieldInput(nestedField, classIndex, `${fieldPath}.${nestedField.name}`, level + 1, context)
            )}
          </div>
        </div>
      );
    }

    if (field.isEnum && field.enumVariants && field.enumVariants.length > 0) {
      return (
        <div key={fieldPath} className="space-y-2" style={{ marginLeft: `${indent}px` }}>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-primary">{field.name}</span>
            <Chip size="sm" variant="flat" color="warning">
              {field.referencedEnumName || 'Enum'}
            </Chip>
            {field.referencedEnumName && (
              <Chip size="sm" variant="dot" color="warning">
                Reference: {field.referencedEnumName}
              </Chip>
            )}
          </div>
          <div className="border-l-2 border-yellow-200 pl-4" style={{ marginLeft: `${indent + 10}px` }}>
            <Select
              size="sm"
              label="Select Enum Variant"
              placeholder="Select a variant"
              selectedKeys={field.selectedVariant ? [field.selectedVariant] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                handleValueUpdate(`${fieldPath}.selectedVariant`, selected);
              }}
            >
              {field.enumVariants.map((variant) => (
                <SelectItem key={variant.name}>
                  {variant.name}
                </SelectItem>
              ))}
            </Select>
            {field.selectedVariant && (
              <div className="mt-2">
                {(() => {
                  const selectedVariant = field.enumVariants?.find(v => v.name === field.selectedVariant);
                  if (selectedVariant?.hasValue) {
                    // Check if there are nested fields (Struct type variant)
                    if (selectedVariant.nestedFields && selectedVariant.nestedFields.length > 0) {
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Chip size="sm" variant="flat" color="secondary">
                              {selectedVariant.name} Struct Field
                            </Chip>
                            <Chip size="sm" variant="flat" color="primary">
                              {selectedVariant.type}
                            </Chip>
                          </div>
                          <div className="border-l-2 border-green-200 pl-4 space-y-3">
                            {selectedVariant.nestedFields.map((nestedField, nestedIndex) =>
                              renderFieldInput(
                                nestedField,
                                classIndex,
                                `variants.${selectedVariant.name}.${nestedField.name}`,
                                1,
                                'type'
                              )
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      // Simple value type variant
                      return (
                        <Input
                          size="sm"
                          label={`${selectedVariant.name} Value`}
                          placeholder={getPlaceholder(selectedVariant.type || 'any')}
                          value={selectedVariant.value || ''}
                          onChange={(e) => {
                            const updatedVariants = field.enumVariants?.map((v: DebugVariant) =>
                              v.name === selectedVariant.name ? { ...v, value: e.target.value } : v
                            );
                            handleValueUpdate(`${fieldPath}.enumVariants`, updatedVariants);
                          }}
                        />
                      );
                    }
                  }
                  return <p className="text-sm text-gray-600">This variant does not need a value.</p>;
                })()}
              </div>
            )}
          </div>
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
          onChange={(e) => handleValueUpdate(`${fieldPath}.value`, e.target.value)}
        />
        <Chip size="sm" variant="flat">{field.type}</Chip>
        {field.isOption && (
          <Chip size="sm" variant="flat" color="warning">Optional</Chip>
        )}
      </div>
    );
  }, [updateDebugValue, updateFunctionInput, addVecItemForNestedField, removeVecItemForNestedField, getPlaceholder]);

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
            <h6 className="text-sm font-medium text-blue-700">Struct Fields:</h6>
            {/* 显示 Args 类型的额外信息 */}
            {codecClass.baseType === 'Args' && codecClass.valueType && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                <div className="text-sm font-medium text-yellow-800 mb-2">Args 类型信息:</div>
                <div className="text-xs text-yellow-700">
                  <div>基础类型: <span className="font-mono">{codecClass.baseType}</span></div>
                  <div>类型参数: <span className="font-mono">{codecClass.valueType}</span></div>
                  
                  {/* 显示构造函数参数详情 */}
                  {codecClass.constructorParams && (
                    <div className="mt-3">
                      <div className="font-medium">构造函数参数解析:</div>
                      <div className="ml-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <span>解析状态:</span>
                          <Chip 
                            size="sm" 
                            variant="flat" 
                            color={codecClass.constructorParams.parseStatus === 'success' ? 'success' : 'danger'}
                          >
                            {codecClass.constructorParams.parseStatus === 'success' ? '成功' : '失败'}
                          </Chip>
                        </div>
                        <div>原始参数: <span className="font-mono text-xs bg-gray-100 px-1 rounded">{codecClass.constructorParams.original}</span></div>
                        <div>T 参数: <span className="font-mono text-blue-600">{codecClass.constructorParams.T}</span></div>
                        <div>S 参数: <span className="font-mono text-green-600">{codecClass.constructorParams.S}</span></div>
                        {codecClass.constructorParams.value && (
                          <div>value 参数: <span className="font-mono text-purple-600">{codecClass.constructorParams.value}</span></div>
                        )}
                        <div>解析字段数: <span className="font-mono">{codecClass.constructorParams.argsFieldsCount}</span></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-2">
                    <div className="font-medium">Args 结构说明:</div>
                    <div className="ml-2 space-y-1">
                      <div>• 这是一个继承自 Args 的类型，具有动态解析的字段结构</div>
                      <div>• 字段类型根据传入的类型参数自动确定</div>
                      <div>• 字段数量: {codecClass.fields?.length || 0} 个</div>
                      {codecClass.fields?.length === 1 && codecClass.fields[0].name === 'unknown_structure' && (
                        <div className="text-orange-600">• ⚠️ 未找到完整的 Args 基类定义，请确保代码中包含 Args 类</div>
                      )}
                      {codecClass.fields?.length === 1 && codecClass.fields[0].name === 'args_not_found' && (
                        <div className="text-red-600">• ❌ 未在代码中找到 Args 基类定义</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {codecClass.fields.map((field, fieldIndex) =>
              renderFieldInput(field, classIndex, field.name, 0)
            )}
          </div>
        )}

        {/* Enum debug */}
        {codecClass.type === 'Enum' && codecClass.variants && codecClass.variants.length > 0 && (
          <div className="space-y-3">
            <h6 className="text-sm font-medium text-blue-700">Enum Variants:</h6>
            <Select
              size="sm"
              label="Select Variant"
              placeholder="Select a variant"
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
                    // Check if there are nested fields (Struct type variant)
                    if (selectedVariant.nestedFields && selectedVariant.nestedFields.length > 0) {
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Chip size="sm" variant="flat" color="secondary">
                              {selectedVariant.name} Struct Field
                            </Chip>
                            <Chip size="sm" variant="flat" color="primary">
                              {selectedVariant.type}
                            </Chip>
                          </div>
                          <div className="border-l-2 border-green-200 pl-4 space-y-3">
                            {selectedVariant.nestedFields.map((nestedField, nestedIndex) =>
                              renderFieldInput(
                                nestedField,
                                classIndex,
                                `variants.${selectedVariant.name}.${nestedField.name}`,
                                1,
                                'type'
                              )
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      // Simple value type variant
                      return (
                        <Input
                          size="sm"
                          label={`${selectedVariant.name} Value`}
                          placeholder={getPlaceholder(selectedVariant.type || 'any')}
                          value={selectedVariant.value || ''}
                          onChange={(e) => {
                            const updatedVariants = codecClass.variants?.map((v: DebugVariant) =>
                              v.name === selectedVariant.name ? { ...v, value: e.target.value } : v
                            );
                            setExtractedClasses(prev => prev.map((item, i) =>
                              i === classIndex ? { ...item, variants: updatedVariants } : item
                            ));
                          }}
                        />
                      );
                    }
                  }
                  return <p className="text-sm text-gray-600">This variant does not need a value.</p>;
                })()}
              </div>
            )}
          </div>
        )}

        {/* Union debug */}
        {codecClass.type === 'Union' && codecClass.variants && codecClass.variants.length > 0 && (
          <div className="space-y-3">
            <h6 className="text-sm font-medium text-blue-700">Union Type Options:</h6>
            <Select
              size="sm"
              label="Select Type"
              placeholder="Select a type"
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
                <Input
                  size="sm"
                  label={`${codecClass.selectedVariant} Value`}
                  placeholder={getPlaceholder(codecClass.selectedVariant)}
                  value={codecClass.debugValue || ''}
                  onChange={(e) => updateDebugValue(classIndex, 'debugValue', e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {/* TypeAlias debug */}
        {codecClass.type === 'TypeAlias' && (
          <div className="space-y-3">
            <h6 className="text-sm font-medium text-blue-700">Type Alias Value:</h6>
            <div className="text-xs text-default-500 mb-2">
              Alias Type: <span className="font-mono">{codecClass.valueType}</span>
            </div>
            <Input
              size="sm"
              label={`${codecClass.name} Value`}
              placeholder={getPlaceholder(codecClass.valueType || 'any')}
              value={codecClass.debugValue || ''}
              onChange={(e) => updateDebugValue(classIndex, 'debugValue', e.target.value)}
            />
          </div>
        )}

        {/* ConstExport debug */}
        {codecClass.type === 'ConstExport' && (
          <div className="space-y-3">
            <h6 className="text-sm font-medium text-blue-700">Const Export Value:</h6>
            <div className="text-xs text-default-500 mb-2">
              Const Type: <span className="font-mono">{codecClass.valueType}</span>
            </div>
            <Input
              size="sm"
              label={`${codecClass.name} Value`}
              placeholder={getPlaceholder(codecClass.valueType || 'any')}
              value={codecClass.debugValue || ''}
              onChange={(e) => updateDebugValue(classIndex, 'debugValue', e.target.value)}
            />
          </div>
        )}

        {/* VecFixed debug */}
        {codecClass.type === 'VecFixed' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h6 className="text-sm font-medium text-blue-700">
                VecFixed Value (Length: {codecClass.length})
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

        {/* Base type debug (Vec, U8aFixed, UInt, Int) */}
        {['U8aFixed', 'UInt', 'Int'].includes(codecClass.type) && (
          <div className="space-y-3">
            <h6 className="text-sm font-medium text-blue-700">{codecClass.type} Value:</h6>
            <div className="text-xs text-default-500 mb-2">
              Base Type: <span className="font-mono">{codecClass.baseType}</span>
              {codecClass.type === 'U8aFixed' && codecClass.baseType?.includes('<') && (
                <div className="mt-1">
                  固定长度字节数组，需要输入十六进制值 (例如: 0x1234...)
                </div>
              )}
            </div>
            <Input
              size="sm"
              label={`${codecClass.type} Value`}
              placeholder={codecClass.type === 'U8aFixed' ? '0x...' : getPlaceholder(codecClass.baseType || codecClass.type)}
              value={codecClass.debugValue || ''}
              onChange={(e) => updateDebugValue(classIndex, 'debugValue', e.target.value)}
            />
          </div>
        )}

        {/* Vec type debug - support multiple items */}
        {codecClass.type === 'Vec' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h6 className="text-sm font-medium text-blue-700">Vec Value:</h6>
              <Button
                size="sm"
                variant="flat"
                color="primary"
                onPress={() => addVecItem(classIndex)}
              >
                Add Item
              </Button>
            </div>
            <div className="text-xs text-default-500 mb-2">
              Base Type: <span className="font-mono">{codecClass.baseType}</span>
              {codecClass.itemType && (
                <span> | Item Type: <span className="font-mono">{codecClass.itemType}</span></span>
              )}
            </div>
            {(!codecClass.vecValues || codecClass.vecValues.length === 0) && (
              <div className="text-sm text-gray-500 italic">
                No items, click &quot;Add Item&quot; to start
              </div>
            )}
            {codecClass.vecValues?.map((value, valueIndex) => (
              <div key={valueIndex} className="flex items-center gap-2">
                <span className="text-xs text-default-500 w-8">[{valueIndex}]</span>
                <Input
                  size="sm"
                  placeholder={getPlaceholder(codecClass.itemType || codecClass.baseType || 'any')}
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
            <div className="flex items-center gap-2 text-xs text-default-500">
              <span>Total: {codecClass.vecValues?.length || 0} items</span>
              {codecClass.vecValues && codecClass.vecValues.length > 0 && (
                <Button
                  size="sm"
                  variant="flat"
                  color="warning"
                  onPress={() => updateDebugValue(classIndex, 'vecValues', [])}
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Integer debug */}
        {codecClass.type === 'Integer' && (
          <div className="space-y-3">
            <h6 className="text-sm font-medium text-blue-700">Integer Type Value:</h6>
            <div className="text-xs text-default-500 mb-2">
              Integer Type: <span className="font-mono">{codecClass.baseType}</span>
            </div>
            <Input
              size="sm"
              label={`${codecClass.name} Value`}
              placeholder={getPlaceholder(codecClass.baseType || 'number')}
              value={codecClass.debugValue || ''}
              onChange={(e) => updateDebugValue(classIndex, 'debugValue', e.target.value)}
              type="number"
            />
          </div>
        )}

        {/* Boolean debug */}
        {codecClass.type === 'Boolean' && (
          <div className="space-y-3">
            <h6 className="text-sm font-medium text-blue-700">Boolean Type Value:</h6>
            <div className="text-xs text-default-500 mb-2">
              Boolean Type: <span className="font-mono">{codecClass.baseType}</span>
            </div>
            <Select
              size="sm"
              label={`${codecClass.name} Value`}
              placeholder="Select true or false"
              selectedKeys={codecClass.debugValue ? [codecClass.debugValue] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                updateDebugValue(classIndex, 'debugValue', selected);
              }}
            >
              <SelectItem key="true">true</SelectItem>
              <SelectItem key="false">false</SelectItem>
            </Select>
          </div>
        )}

        {/* Text debug */}
        {codecClass.type === 'Text' && (
          <div className="space-y-3">
            <h6 className="text-sm font-medium text-blue-700">Text Type Value:</h6>
            <div className="text-xs text-default-500 mb-2">
              Text Type: <span className="font-mono">{codecClass.baseType}</span>
            </div>
            <Input
              size="sm"
              label={`${codecClass.name} Value`}
              placeholder={getPlaceholder(codecClass.baseType || 'string')}
              value={codecClass.debugValue || ''}
              onChange={(e) => updateDebugValue(classIndex, 'debugValue', e.target.value)}
            />
          </div>
        )}

        {/* Hash debug */}
        {codecClass.type === 'Hash' && (
          <div className="space-y-3">
            <h6 className="text-sm font-medium text-blue-700">Hash Type Value:</h6>
            <div className="text-xs text-default-500 mb-2">
              Hash Type: <span className="font-mono">{codecClass.baseType}</span>
              {codecClass.baseType === 'H160' && <span> (Ethereum address format)</span>}
              {codecClass.baseType === 'H256' && <span> (32 bytes hash)</span>}
              {codecClass.baseType === 'H512' && <span> (64 bytes hash)</span>}
            </div>
            <Input
              size="sm"
              label={`${codecClass.name} Value`}
              placeholder={
                codecClass.baseType === 'H160' ? '0x1234567890123456789012345678901234567890' :
                  codecClass.baseType === 'H256' ? '0x1234567890123456789012345678901234567890123456789012345678901234' :
                    codecClass.baseType === 'H512' ? '0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234' :
                      '0x...'
              }
              value={codecClass.debugValue || ''}
              onChange={(e) => updateDebugValue(classIndex, 'debugValue', e.target.value)}
            />
          </div>
        )}

        {/* Option debug */}
        {codecClass.type === 'Option' && (
          <div className="space-y-3">
            <h6 className="text-sm font-medium text-blue-700">Option Type Value:</h6>
            <div className="text-xs text-default-500 mb-2">
              Option Type: <span className="font-mono">{codecClass.baseType}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Switch
                size="sm"
                isSelected={codecClass.debugValue !== 'None'}
                onValueChange={(checked) => {
                  updateDebugValue(classIndex, 'debugValue', checked ? '' : 'None');
                }}
              />
              <span className="text-sm">Has Value (Some) / No Value (None)</span>
            </div>
            {codecClass.debugValue !== 'None' && (
              <Input
                size="sm"
                label={`${codecClass.name} Internal Value`}
                placeholder="Input Option's internal value"
                value={codecClass.debugValue === 'None' ? '' : codecClass.debugValue || ''}
                onChange={(e) => updateDebugValue(classIndex, 'debugValue', e.target.value)}
              />
            )}
          </div>
        )}

        {/* Common value debug for other types */}
        {!['Struct', 'Enum', 'Union', 'TypeAlias', 'ConstExport', 'VecFixed', 'Vec', 'U8aFixed', 'UInt', 'Int', 'Namespace', 'Integer', 'Boolean', 'Text', 'Hash', 'Option'].includes(codecClass.type) && (
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
  }, [updateDebugValue, executeDebug, addVecItem, removeVecItem, renderFieldInput, getPlaceholder]);

  const renderFunctionDebugInterface = useCallback((func: ParsedFunction, functionIndex: number) => {
    if (!func.debugMode) return null;

    console.log(`渲染函数 ${func.name} 的调试界面，调试输入数量: ${func.debugInputs?.length || 0}`);

    return (
      <div className="mt-4 p-4 bg-green-50 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <h5 className="font-semibold text-green-800">Debug Function</h5>
          <Button
            size="sm"
            color="success"
            onPress={() => executeFunctionDebug(functionIndex)}
          >
            Execute
          </Button>
        </div>

        {/* Function parameters input */}
        {func.debugInputs && func.debugInputs.length > 0 && (
          <div className="space-y-3">
            {func.debugInputs.map((field, fieldIndex) => {
              return renderFieldInput(field, functionIndex, field.name, 0, 'function');
            })}
          </div>
        )}

        {/* Function debug result */}
        {func.debugResult && (
          <div className="space-y-2">
            <h6 className="text-sm font-medium text-green-700">Result:</h6>
            <pre className="text-xs bg-gray-100 p-2 rounded border overflow-auto max-h-40">
              {func.debugResult}
            </pre>
          </div>
        )}
      </div>
    );
  }, [executeFunctionDebug, renderFieldInput]);

  return (
    <div className="space-y-6">
      {/* Debug and Test Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <h4 className="text-md font-semibold">TypeScript Code Parser</h4>
          </div>
        </CardHeader>
        <CardBody>
          {(type === 'type' || type === 'all') && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-default-600">Type Definitions:</span>
                <Chip size="sm" variant="flat" color={extractedClasses.length > 0 ? "success" : "default"}>
                  {extractedClasses.length}
                </Chip>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-default-600">Enum Types:</span>
                <Chip size="sm" variant="flat" color={extractedClasses.filter(c => c.type === 'Enum').length > 0 ? "success" : "warning"}>
                  {extractedClasses.filter(c => c.type === 'Enum').length}
                </Chip>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-default-600">Struct Types:</span>
                <Chip size="sm" variant="flat" color={extractedClasses.filter(c => c.type === 'Struct').length > 0 ? "success" : "default"}>
                  {extractedClasses.filter(c => c.type === 'Struct').length}
                </Chip>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-default-600">Args Types:</span>
                <Chip size="sm" variant="flat" color={extractedClasses.filter(c => c.baseType === 'Args').length > 0 ? "warning" : "default"}>
                  {extractedClasses.filter(c => c.baseType === 'Args').length}
                </Chip>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-default-600">Nested Fields:</span>
                <Chip size="sm" variant="flat" color={extractedClasses.some(c => c.variants?.some(v => v.nestedFields && v.nestedFields.length > 0)) ? "success" : "default"}>
                  {extractedClasses.reduce((total, c) => total + (c.variants?.reduce((vTotal, v) => vTotal + (v.nestedFields?.length || 0), 0) || 0), 0)}
                </Chip>
              </div>
              {(extractedClasses.length > 0 || functions.length > 0) && (
                <Chip size="sm" variant="flat" color="success">
                  Parse Success ✓
                </Chip>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {extractedClasses.length > 0 && type === 'type' && (
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
                        {/* 为 Args 类型显示额外的基础类型信息 */}
                        {codecClass.baseType === 'Args' && (
                          <Chip size="sm" variant="flat" color="warning">
                            Args
                          </Chip>
                        )}
                        <span className="font-mono">{codecClass.name}</span>
                        {/* 显示 Args 类型的参数信息 */}
                        {codecClass.baseType === 'Args' && codecClass.valueType && (
                          <span className="text-xs text-default-500 ml-2">
                            ({codecClass.valueType})
                          </span>
                        )}
                        {/* 显示构造函数参数状态 */}
                        {codecClass.constructorParams && (
                          <div className="flex items-center gap-1 ml-2">
                            <Chip 
                              size="sm" 
                              variant="dot" 
                              color={codecClass.constructorParams.parseStatus === 'success' ? 'success' : 'warning'}
                            >
                              {codecClass.constructorParams.parseStatus === 'success' ? 
                                `${codecClass.constructorParams.argsFieldsCount} 字段` : 
                                '解析中'
                              }
                            </Chip>
                          </div>
                        )}
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
                          <div key={variantIndex} className="space-y-1">
                            <div className="flex items-center gap-2 text-sm ml-4">
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
                              {variant.nestedFields && variant.nestedFields.length > 0 && (
                                <Chip size="sm" variant="dot" color="success">
                                  {variant.nestedFields.length} Fields
                                </Chip>
                              )}
                            </div>
                            {/* nested fields details */}
                            {variant.nestedFields && variant.nestedFields.length > 0 && (
                              <div className="ml-8 space-y-1 border-l-2 border-green-200 pl-3">
                                <div className="text-xs text-green-800 font-medium">
                                  Nested Fields Details ({variant.nestedFields.length} fields):
                                </div>
                                {variant.nestedFields.map((nestedField, nestedFieldIndex) => (
                                  <div key={nestedFieldIndex} className="flex items-center gap-2 text-xs">
                                    <span className="font-mono text-green-700">{nestedField.name}</span>
                                    <span>:</span>
                                    <span className="font-mono text-green-600">{nestedField.type}</span>
                                    {nestedField.isVec && (
                                      <Chip size="sm" variant="flat" color="secondary">Vec</Chip>
                                    )}
                                    {nestedField.isOption && (
                                      <Chip size="sm" variant="flat" color="warning">Option</Chip>
                                    )}
                                  </div>
                                ))}
                              </div>
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
                  isHoverable
                  className="cursor-pointer"
                >
                  <CardBody>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Chip size="sm" variant="flat" color="primary">Function</Chip>
                          <span className="font-mono font-semibold">{func.name}</span>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <span className="text-xs text-default-500">Debug</span>
                          <Switch
                            size="sm"
                            isSelected={func.debugMode}
                            onValueChange={() => toggleFunctionDebugMode(index)}
                            color="success"
                          />
                        </div>
                      </div>
                      <div className="text-sm text-default-500">
                        Parameters: {func.parameters.length}
                      </div>
                      {func.parameters.length > 0 && (
                        <div className="space-y-1">
                          {func.parameters.map((param, paramIndex) => (
                            <div key={paramIndex} className="flex items-center gap-2 text-xs ml-4">
                              <span className="font-mono text-primary">{param.name}</span>
                              <span>:</span>
                              <span className="font-mono text-secondary">{param.type}</span>
                              {param.optional && (
                                <Chip size="sm" variant="flat" color="warning">Optional</Chip>
                              )}
                              {param.customTypeName && (
                                <Chip size="sm" variant="flat" color="success">Custom: {param.customTypeName}</Chip>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {renderFunctionDebugInterface(func, index)}
                  </CardBody>
                </Card>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
} 