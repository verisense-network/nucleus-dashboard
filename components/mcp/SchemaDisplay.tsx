'use client';

import React from 'react';
import { Card, CardBody, Chip, Code } from '@heroui/react';

interface JSONSchemaProperty {
  type?: string | string[];
  anyOf?: Array<{ type: string; title?: string; description?: string }>;
  oneOf?: Array<{ type: string; title?: string; description?: string }>;
  allOf?: Array<{ type: string; title?: string; description?: string }>;
  title?: string;
  description?: string;
  default?: unknown;
  required?: boolean;
  enum?: string[];
  const?: unknown;
  format?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  items?: JSONSchemaProperty;
  properties?: Record<string, unknown>;
  additionalProperties?: boolean | JSONSchemaProperty;
  examples?: unknown[];
}

interface JSONSchema {
  type: string;
  title?: string;
  description?: string;
  properties?: Record<string, unknown>;
  required?: string[];
}

interface SchemaDisplayProps {
  schema: JSONSchema;
  compact?: boolean;
}

function isJSONSchemaProperty(value: unknown): value is JSONSchemaProperty {
  return typeof value === 'object' && value !== null;
}

function getTypeDisplay(property: JSONSchemaProperty): { type: string; color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default' } {
  if (property.anyOf) {
    const types = property.anyOf.map(item => item.type).join(' | ');
    return { type: types, color: 'secondary' };
  }

  if (property.oneOf) {
    const types = property.oneOf.map(item => item.type).join(' | ');
    return { type: `oneOf(${types})`, color: 'secondary' };
  }

  if (property.allOf) {
    const types = property.allOf.map(item => item.type).join(' & ');
    return { type: `allOf(${types})`, color: 'secondary' };
  }

  if (Array.isArray(property.type)) {
    return { type: property.type.join(' | '), color: 'secondary' };
  }

  const type = property.type || 'unknown';
  const colorMap: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default'> = {
    string: 'primary',
    number: 'success',
    integer: 'success',
    boolean: 'warning',
    object: 'secondary',
    array: 'default',
    null: 'danger'
  };

  return { type, color: colorMap[type] || 'default' };
}

function PropertyDisplay({
  name,
  property,
  isRequired,
  level = 0
}: {
  name: string;
  property: JSONSchemaProperty;
  isRequired: boolean;
  level?: number;
}) {
  const { type, color } = getTypeDisplay(property);
  const indent = level * 20;

  return (
    <div style={{ marginLeft: `${indent}px` }} className="border-l-2 border-default-100 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <code className="text-sm font-mono text-foreground bg-default-100 px-2 py-1 rounded">
            {name}
          </code>
          {isRequired && (
            <span className="text-danger-500">
              *
            </span>
          )}
        </div>
        <Chip size="sm" color={color} variant="flat">
          {type}
        </Chip>
      </div>

      {property.description && (
        <p className="text-sm text-default-600">
          {property.description}
        </p>
      )}

      {property.const !== undefined && (
        <div className="text-xs text-default-500">
          Constant value: <Code className="text-xs">{JSON.stringify(property.const)}</Code>
        </div>
      )}

      {property.format && (
        <div className="text-xs text-default-500">
          Format: <Chip size="sm" color="default" variant="bordered">{property.format}</Chip>
        </div>
      )}

      {property.pattern && (
        <div className="text-xs text-default-500">
          Pattern: <Code className="text-xs">{property.pattern}</Code>
        </div>
      )}

      {(property.minimum !== undefined || property.maximum !== undefined) && (
        <div className="text-xs text-default-500">
          Range:
          {property.minimum !== undefined && ` >= ${property.minimum}`}
          {property.maximum !== undefined && ` <= ${property.maximum}`}
        </div>
      )}

      {(property.minLength !== undefined || property.maxLength !== undefined) && (
        <div className="text-xs text-default-500">
          Length:
          {property.minLength !== undefined && ` >= ${property.minLength}`}
          {property.maxLength !== undefined && ` <= ${property.maxLength}`}
        </div>
      )}

      {property.enum && (
        <div className="text-xs text-default-500">
          Possible values: {property.enum.map((value, index) => (
            <Chip key={index} size="sm" color="default" variant="bordered" className="mx-1">
              {value}
            </Chip>
          ))}
        </div>
      )}

      {property.examples && property.examples.length > 0 && (
        <div className="text-xs text-default-500">
          Examples:
          <div className="mt-1">
            {property.examples.map((example, index) => (
              <Code key={index} className="text-xs mr-2">{JSON.stringify(example)}</Code>
            ))}
          </div>
        </div>
      )}

      {property.properties && (
        <div className="mt-3">
          <p className="text-sm font-medium text-default-700 mb-2">Properties:</p>
          {Object.entries(property.properties).map(([propName, propSchema]) => {
            if (!isJSONSchemaProperty(propSchema)) return null;
            return (
              <PropertyDisplay
                key={propName}
                name={propName}
                property={propSchema}
                isRequired={false}
                level={level + 1}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SchemaDisplay({ schema, compact = false }: SchemaDisplayProps) {
  if (!schema || typeof schema !== 'object') {
    return (
      <div className="text-sm text-default-400 italic">
        Invalid Schema
      </div>
    );
  }

  if (compact) {
    return (
      <div className="text-xs">
        <Code className="text-xs">
          {JSON.stringify(schema, null, 2)}
        </Code>
      </div>
    );
  }

  return (
    <Card className="bg-default-50 dark:bg-default-100">
      <CardBody className="p-4">
        {schema.properties ? (
          <div className="space-y-1">
            {Object.entries(schema.properties).map(([name, property]) => {
              if (!isJSONSchemaProperty(property)) return null;
              const isRequired = schema.required?.includes(name) || false;
              return (
                <PropertyDisplay
                  key={name}
                  name={name}
                  property={property}
                  isRequired={isRequired}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-default-400 italic">
            No parameters
          </div>
        )}
      </CardBody>
    </Card>
  );
}
