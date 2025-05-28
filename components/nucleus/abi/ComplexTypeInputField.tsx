"use client";

import { useState, useEffect } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Minus, Plus } from "lucide-react";

interface FieldDefinition {
  name: string;
  type: string;
  customTypeName?: string;
  value?: any;
  isArray?: boolean;
  isTuple?: boolean;
  itemType?: string;
  tupleItems?: Array<{ type: string; value: string; index: number }>;
  items?: Array<{ value: string }>;
}

interface ComplexTypeInputFieldProps {
  field: FieldDefinition;
  registry?: any[];
  onChange?: (value: any) => void;
}

export default function ComplexTypeInputField({ 
  field, 
  registry = [], 
  onChange 
}: ComplexTypeInputFieldProps) {
  const [nestedFields, setNestedFields] = useState<FieldDefinition[]>([]);

  // 判断是否为自定义类型
  const isCustomType = field && (field.customTypeName || /^[A-Z]/.test(field.type));

  useEffect(() => {
    if (isCustomType) {
      initializeNestedFields();
    }
  }, [field, isCustomType]);

  const initializeNestedFields = () => {
    const typeName = field.customTypeName || field.type;
    if (!typeName) return;

    try {
      // 尝试从registry中查找接口定义
      const interfaceDefinition = registry?.find(
        (iface: any) => iface.name === typeName || iface.name === `I${typeName}`
      );

      if (interfaceDefinition && interfaceDefinition.fields) {
        const fields = interfaceDefinition.fields.map((fieldDef: any) => ({
          name: fieldDef.name,
          type: fieldDef.type,
          customTypeName: fieldDef.customTypeName,
          isArray: fieldDef.isArray,
          isTuple: fieldDef.isTuple,
          itemType: fieldDef.itemType,
          tupleItems: fieldDef.tupleItems,
          value: getDefaultValue(fieldDef),
          items: fieldDef.isArray ? [{ value: '' }] : undefined,
        }));
        setNestedFields(fields);
        return;
      }
    } catch (error) {
      console.error('Error initializing complex type fields:', error);
    }
  };

  const getDefaultValue = (fieldDef: any) => {
    if (fieldDef.isArray) return [];
    if (fieldDef.isTuple) return fieldDef.tupleItems?.map(() => '') || [];
    if (fieldDef.customTypeName) return {};
    if (fieldDef.type.includes('number')) return 0;
    if (fieldDef.type.includes('string')) return '';
    if (fieldDef.type.includes('boolean')) return false;
    return null;
  };

  const isNestedCustomType = (nestedField: FieldDefinition): boolean => {
    return !!(nestedField.customTypeName || /^[A-Z]/.test(nestedField.type));
  };

  const isArrayType = (nestedField: FieldDefinition): boolean => {
    return !!(nestedField.isArray || 
      (nestedField.type && (nestedField.type.includes('Array<') || nestedField.type.includes('[]'))));
  };

  const isTupleType = (nestedField: FieldDefinition): boolean => {
    return !!(nestedField.isTuple || 
      (nestedField.type && ((nestedField.type.startsWith('[') && nestedField.type.endsWith(']')) || 
                           nestedField.type.includes('Tuple'))));
  };

  const getOrCreateItems = (nestedField: FieldDefinition) => {
    if (!nestedField.items) {
      nestedField.items = [{ value: '' }];
    }
    return nestedField.items;
  };

  const getOrCreateTupleItems = (nestedField: FieldDefinition) => {
    if (!nestedField.tupleItems) {
      const tupleMatch = nestedField.type.match(/\[([^\]]+)\]/);
      if (tupleMatch) {
        const tupleTypes = tupleMatch[1].split(',').map(t => t.trim());
        nestedField.tupleItems = tupleTypes.map((type, index) => ({
          type,
          value: '',
          index
        }));
      } else {
        nestedField.tupleItems = [{ type: 'any', value: '', index: 0 }];
      }
    }
    return nestedField.tupleItems;
  };

  const addItem = (nestedField: FieldDefinition) => {
    const items = getOrCreateItems(nestedField);
    items.push({ value: '' });
    updateNestedField(nestedField);
  };

  const removeItem = (nestedField: FieldDefinition, index: number) => {
    if (nestedField.items && index >= 0 && index < nestedField.items.length) {
      nestedField.items.splice(index, 1);
      if (nestedField.items.length === 0) {
        nestedField.items.push({ value: '' });
      }
      updateNestedField(nestedField);
    }
  };

  const updateNestedField = (updatedField: FieldDefinition) => {
    setNestedFields(prev => 
      prev.map(field => 
        field.name === updatedField.name ? updatedField : field
      )
    );
    
    // 通知父组件值已更改
    if (onChange) {
      const fieldValues = nestedFields.reduce((acc, field) => {
        acc[field.name] = field.value;
        return acc;
      }, {} as Record<string, any>);
      onChange(fieldValues);
    }
  };

  const handleNestedFieldChange = (fieldName: string, value: any) => {
    setNestedFields(prev => 
      prev.map(field => 
        field.name === fieldName ? { ...field, value } : field
      )
    );
    
    if (onChange) {
      const fieldValues = nestedFields.reduce((acc, field) => {
        acc[field.name] = field.name === fieldName ? value : field.value;
        return acc;
      }, {} as Record<string, any>);
      onChange(fieldValues);
    }
  };

  const getPlaceholder = (type: string): string => {
    if (!type) return '';
    
    const typeStr = typeof type === 'string' ? type : String(type);
    
    if (typeStr.toLowerCase().includes('number') || 
        /u(8|16|32|64|128)/i.test(typeStr) || 
        /i(8|16|32|64|128)/i.test(typeStr)) {
      return '0';
    } else if (typeStr.toLowerCase().includes('string') || typeStr.includes('Text')) {
      return '文本...';
    } else if (typeStr.toLowerCase().includes('boolean')) {
      return 'true/false';
    } else if (typeStr.toLowerCase().includes('array') || typeStr.includes('[]')) {
      return '[]';
    } else {
      return '值...';
    }
  };

  if (!isCustomType) {
    return null;
  }

  return (
    <Card className="complex-type-field">
      <CardBody>
        <div className="space-y-4">
          {nestedFields.map((nestedField, nestedIndex) => (
            <div key={nestedIndex} className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">
                  {nestedField.name}
                </label>
                <Chip size="sm" variant="flat" color="default">
                  {nestedField.type}
                </Chip>
              </div>
              
              {isNestedCustomType(nestedField) && (
                <div className="ml-4 pl-2 border-l-2 border-default-200">
                  <ComplexTypeInputField 
                    field={nestedField} 
                    registry={registry}
                    onChange={(value) => handleNestedFieldChange(nestedField.name, value)}
                  />
                </div>
              )}
              
              {isArrayType(nestedField) && (
                <div className="ml-4 space-y-2">
                  <div className="flex flex-col space-y-2">
                    {getOrCreateItems(nestedField).map((item, itemIndex) => (
                      <div key={itemIndex} className="flex space-x-2">
                        <Input
                          value={item.value}
                          onChange={(e) => {
                            item.value = e.target.value;
                            updateNestedField(nestedField);
                          }}
                          placeholder={getPlaceholder(nestedField.itemType || 'any')}
                          size="sm"
                          className="flex-grow"
                        />
                        <Button
                          size="sm"
                          variant="flat"
                          color="danger"
                          isIconOnly
                          onPress={() => removeItem(nestedField, itemIndex)}
                        >
                          <Minus size={16} />
                        </Button>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      startContent={<Plus size={16} />}
                      onPress={() => addItem(nestedField)}
                    >
                      添加项目
                    </Button>
                  </div>
                </div>
              )}
              
              {isTupleType(nestedField) && (
                <div className="ml-4 space-y-2">
                  {getOrCreateTupleItems(nestedField).map((tupleItem, tupleIndex) => (
                    <div key={tupleIndex} className="flex space-x-2">
                      <label className="text-xs w-10 flex items-center">
                        {tupleIndex}:
                      </label>
                      <Input
                        value={tupleItem.value}
                        onChange={(e) => {
                          tupleItem.value = e.target.value;
                          updateNestedField(nestedField);
                        }}
                        placeholder={getPlaceholder(tupleItem.type)}
                        size="sm"
                        className="flex-grow"
                      />
                    </div>
                  ))}
                </div>
              )}
              
              {!isNestedCustomType(nestedField) && !isArrayType(nestedField) && !isTupleType(nestedField) && (
                <Input
                  value={nestedField.value || ''}
                  onChange={(e) => handleNestedFieldChange(nestedField.name, e.target.value)}
                  placeholder={getPlaceholder(nestedField.type)}
                  size="sm"
                  className="w-full"
                />
              )}
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
} 