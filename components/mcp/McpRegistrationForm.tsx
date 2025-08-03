'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button, CardHeader } from '@heroui/react';
import { Card, CardBody } from '@heroui/react';
import { Input, Textarea } from '@heroui/react';
import { FileText } from 'lucide-react';
import { McpServer } from '@/types/mcp';
import Link from 'next/link';

interface McpRegistrationFormProps {
  onSubmit: (data: McpServer) => Promise<void>;
  isLoading?: boolean;
}

const testData: McpServer = {
  "name": "Test MCP Server",
  "description": "This is a test MCP server for demonstration purposes",
  "url": "https://example.com/mcp"
};

export const McpRegistrationForm: React.FC<McpRegistrationFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');

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

  const parseJsonData = () => {
    try {
      setJsonError('');
      const parsedData = JSON.parse(jsonInput);

      if (!parsedData || typeof parsedData !== 'object') {
        throw new Error('Invalid JSON format');
      }

      // Validate required fields
      if (!parsedData.name || !parsedData.description || !parsedData.url) {
        throw new Error('Missing required fields: name, description, and url are required');
      }

      reset(parsedData);
      setJsonInput('');
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON format');
    }
  };

  const parseTestData = () => {
    setJsonInput(JSON.stringify(testData, null, 2));
    parseJsonData();
  };

  const clearForm = () => {
    reset({
      name: '',
      description: '',
      url: '',
    });
    setJsonInput('');
    setJsonError('');
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
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText size={20} />
            Import MCP Server Configuration
          </h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <Textarea
              label="From MCP Server JSON"
              labelPlacement='outside'
              placeholder="Paste your MCP Server JSON here..."
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              minRows={6}
              isInvalid={!!jsonError}
              errorMessage={jsonError}
              description="Support MCP Server JSON format data with name, description, and url fields"
            />

            <div className="flex gap-2">
              <Button
                color="primary"
                variant="flat"
                onPress={parseJsonData}
                disabled={!jsonInput.trim() || isLoading}
              >
                Parse
              </Button>

              <Button
                color="warning"
                variant="flat"
                onPress={clearForm}
              >
                Clear Form
              </Button>

              {process.env.NODE_ENV === 'development' && (
                <Button
                  color="secondary"
                  variant="flat"
                  onPress={parseTestData}
                >
                  Load Test Data
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

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

            <div className="flex justify-end">
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
