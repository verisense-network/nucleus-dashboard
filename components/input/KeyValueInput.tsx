import React from 'react';
import { Control, Controller } from 'react-hook-form';
import { Button, Input } from '@heroui/react';
import { Plus, Trash2 } from 'lucide-react';

interface KeyValueInputProps {
  name: string;
  control: Control<any>;
  label?: string;
  placeholder?: {
    key?: string;
    value?: string;
  };
  isDisabled?: boolean;
}

export const KeyValueInput: React.FC<KeyValueInputProps> = ({
  name,
  control,
  label = 'Parameters',
  placeholder = {
    key: 'Key',
    value: 'Value'
  },
  isDisabled = false
}) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="space-y-2">
          <label className="text-sm font-medium">{label}</label>
          <div className="space-y-2">
            {Object.entries(field.value || {}).map(([key, value], paramIndex) => (
              <div key={paramIndex} className="flex gap-2">
                <Input
                  value={key}
                  placeholder={placeholder.key}
                  onChange={(e) => {
                    const newParams = { ...field.value };
                    delete newParams[key];
                    newParams[e.target.value] = value;
                    field.onChange(newParams);
                  }}
                  isReadOnly={isDisabled}
                />
                <Input
                  value={value as string}
                  placeholder={placeholder.value}
                  onChange={(e) => {
                    const newParams = { ...field.value };
                    newParams[key] = e.target.value;
                    field.onChange(newParams);
                  }}
                  isReadOnly={isDisabled}
                />
                <Button
                  type="button"
                  size="sm"
                  color="danger"
                  variant="flat"
                  isIconOnly
                  onPress={() => {
                    const newParams = { ...field.value };
                    delete newParams[key];
                    field.onChange(newParams);
                  }}
                  isDisabled={isDisabled}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              color="primary"
              variant="flat"
              startContent={<Plus size={16} />}
              onPress={() => {
                const newParams = { ...field.value };
                newParams[''] = '';
                field.onChange(newParams);
              }}
              isDisabled={isDisabled}
            >
              Add Parameter
            </Button>
          </div>
        </div>
      )}
    />
  );
}; 