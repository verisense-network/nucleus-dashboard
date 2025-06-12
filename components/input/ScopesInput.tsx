'use client';

import React from 'react';
import { Controller, Control } from 'react-hook-form';
import { Button, Input, Card } from '@heroui/react';
import { Plus, Trash2 } from 'lucide-react';

interface ScopeEntry {
  name: string;
  description: string;
}



export const ScopesInput = ({
  name,
  control,
  label = "Scopes",
  isRequired = false,
  description,
}: {
  name: string;
  control: Control<any>;
  label?: string;
  isRequired?: boolean;
  description?: string;
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium">
            {label}
            {isRequired && <span className="text-danger ml-1">*</span>}
          </label>
          {description && (
            <p className="text-xs text-default-400 mt-1">{description}</p>
          )}
        </div>
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <Button
              type="button"
              size="sm"
              color="primary"
              variant="flat"
              startContent={<Plus size={14} />}
              onPress={() => {
                const currentScopes = field.value || [];
                field.onChange([
                  ...currentScopes,
                  { name: '', description: '' }
                ]);
              }}
            >
              Add Scope
            </Button>
          )}
        />
      </div>

      <Controller
        name={name}
        control={control}
        rules={isRequired ? { 
          validate: (value) => {
            if (!value || value.length === 0) {
              return 'At least one scope is required';
            }
            for (const scope of value) {
              if (!scope.name?.trim()) {
                return 'Scope name cannot be empty';
              }
            }
            return true;
          }
        } : undefined}
        render={({ field, fieldState: { error } }) => (
          <div className="space-y-3">
            {(field.value || []).map((scope: ScopeEntry, index: number) => (
              <Card key={index} className="p-3">
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Scope name (e.g., read)"
                    value={scope.name || ''}
                    onChange={(e) => {
                      const updatedScopes = [...(field.value || [])];
                      updatedScopes[index] = {
                        ...updatedScopes[index],
                        name: e.target.value
                      };
                      field.onChange(updatedScopes);
                    }}
                    size="sm"
                    classNames={{
                      base: "flex-1"
                    }}
                    isInvalid={!!error}
                  />
                  <Input
                    placeholder="Description (e.g., read access)"
                    value={scope.description || ''}
                    onChange={(e) => {
                      const updatedScopes = [...(field.value || [])];
                      updatedScopes[index] = {
                        ...updatedScopes[index],
                        description: e.target.value
                      };
                      field.onChange(updatedScopes);
                    }}
                    size="sm"
                    classNames={{
                      base: "flex-2"
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    color="danger"
                    variant="flat"
                    isIconOnly
                    onPress={() => {
                      const updatedScopes = [...(field.value || [])];
                      updatedScopes.splice(index, 1);
                      field.onChange(updatedScopes);
                    }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
            ))}

            {(!field.value || field.value.length === 0) && (
              <div className="text-center text-gray-500 py-4 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-sm">No scopes defined</p>
                <p className="text-xs">Click &quot;Add Scope&quot; to add OAuth2 scopes</p>
              </div>
            )}

            {error && (
              <p className="text-danger text-sm">{error.message}</p>
            )}
          </div>
        )}
      />
    </div>
  );
};

export default ScopesInput; 