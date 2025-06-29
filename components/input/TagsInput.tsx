'use client';

import React, { useState } from 'react';
import { Control, Controller } from 'react-hook-form';
import { Button, Chip, Input } from '@heroui/react';
import { Plus, Trash2 } from 'lucide-react';

interface TagsInputProps {
  name: string;
  control: Control<any, any>;
  label?: string;
  placeholder?: string;
  isDisabled?: boolean;
}

export const TagsInput: React.FC<TagsInputProps> = ({ name, control, label, placeholder, isDisabled }) => {
  const [newTag, setNewTag] = useState('');

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const addTag = () => {
          if (newTag.trim() && !field.value?.includes(newTag.trim())) {
            const updatedTags = [...(field.value || []), newTag.trim()];
            field.onChange(updatedTags);
            setNewTag('');
          }
        };

        const removeTag = (tagToRemove: string) => {
          const updatedTags = field.value?.filter((tag: string) => tag !== tagToRemove) || [];
          field.onChange(updatedTags);
        };

        return (
          <div className="space-y-2 rounded-lg bg-default-100 py-2 px-4">
            <label className="text-xs font-medium text-foreground-600">{label}</label>
            <div className="flex gap-2">
              <Input
                size="sm"
                placeholder={placeholder}
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                isReadOnly={isDisabled}
              />
              <Button
                type="button"
                size="sm"
                color="primary"
                variant="flat"
                onPress={addTag}
                isDisabled={isDisabled || !newTag.trim() || field.value?.includes(newTag.trim())}
                startContent={<Plus size={16} />}
              >
                Add
              </Button>
            </div>

            {field.value && field.value.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {field.value.map((tag: string, tagIndex: number) => (
                  <Chip
                    key={tagIndex}
                    variant="flat"
                    endContent={
                      <Button
                        type="button"
                        size="sm"
                        color="danger"
                        variant="light"
                        isIconOnly
                        className="w-4 h-4 min-w-4"
                        onPress={() => removeTag(tag)}
                        isDisabled={isDisabled}
                      >
                        <Trash2 size={12} />
                      </Button>
                    }
                  >
                    {tag}
                  </Chip>
                ))}
              </div>
            )}
          </div>
        );
      }}
    />
  );
};

export default TagsInput; 