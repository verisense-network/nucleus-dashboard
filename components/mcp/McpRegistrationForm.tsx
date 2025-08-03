'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button, CardHeader } from '@heroui/react';
import { Card, CardBody } from '@heroui/react';
import { Input, Textarea } from '@heroui/react';
import { McpServer } from '@/types/mcp';
import Link from 'next/link';

interface McpRegistrationFormProps {
  onSubmit: (data: McpServer) => Promise<void>;
  isLoading?: boolean;
}

export const McpRegistrationForm: React.FC<McpRegistrationFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<McpServer>({
    defaultValues: {
      name: '',
      description: '',
      url: '',
    },
  });

  const handleFormSubmit = async (data: McpServer) => {
    await onSubmit(data);
    reset();
  };

  const clearForm = () => {
    reset({
      name: '',
      description: '',
      url: '',
    });
  };

  return (
    <div className="mx-auto space-y-6">
      <div className="flex justify-end gap-2">
        <Link href="https://t.me/verisense_faucet_bot" target="_blank">
          <Button
            color="primary"
            variant="flat"
          >
            Faucet
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">MCP Server Registration</h3>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-md font-semibold">Basic Information</h4>

              <Controller
                name="name"
                control={control}
                rules={{ required: 'MCP Server name is required' }}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="MCP Server Name"
                    placeholder="Enter MCP Server Name"
                    isInvalid={!!errors.name}
                    errorMessage={errors.name?.message}
                    isRequired
                    description="A unique name for your MCP server"
                  />
                )}
              />

              <Controller
                name="description"
                control={control}
                rules={{ required: 'MCP Server description is required' }}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    label="Description"
                    placeholder="Describe the functionality and purpose of the MCP Server"
                    isInvalid={!!errors.description}
                    errorMessage={errors.description?.message}
                    isRequired
                    description="Explain what your MCP server does and what capabilities it provides"
                  />
                )}
              />

              <Controller
                name="url"
                control={control}
                rules={{
                  required: 'MCP Server URL is required',
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'Please enter a valid URL (http:// or https://)'
                  }
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="MCP Server URL"
                    placeholder="https://example.com/mcp"
                    isInvalid={!!errors.url}
                    errorMessage={errors.url?.message}
                    isRequired
                    description="The endpoint URL where your MCP server is accessible"
                  />
                )}
              />
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                color="warning"
                variant="flat"
                onPress={clearForm}
                disabled={isLoading}
              >
                Clear Form
              </Button>

              <Button
                type="submit"
                color="primary"
                size="lg"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? "Registering..." : "Register MCP Server"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default McpRegistrationForm;
