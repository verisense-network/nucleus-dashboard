'use client';

import React, { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button, CardHeader, Avatar, Spinner } from '@heroui/react';
import { Card, CardBody } from '@heroui/react';
import { Input, Textarea, NumberInput } from '@heroui/react';
import { McpServer } from '@/types/mcp';
import Link from 'next/link';
import { uploadImage } from '@/app/actions';
import { toast } from 'react-toastify';
import { Upload } from 'lucide-react';
import McpServerPreview from './McpServerPreview';

interface McpRegistrationFormProps {
  onSubmit: (data: McpServer) => Promise<void>;
  isLoading?: boolean;
}

export const McpRegistrationForm: React.FC<McpRegistrationFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [mcpValidation, setMcpValidation] = useState<{
    isValid: boolean;
    error?: string;
  }>({ isValid: false });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<McpServer>({
    defaultValues: {
      name: '',
      description: '',
      url: '',
      priceRate: undefined,
      logo: undefined,
      providerWebsite: undefined,
      providerName: undefined,
    },
  });

  const handleFormSubmit = async (data: McpServer) => {
    if (!mcpValidation.isValid) {
      toast.error(mcpValidation.error || 'Please ensure MCP server is accessible before registration');
      return;
    }

    try {
      // Convert price multiplier (0-10) to API value (0-1000) to match Agent logic
      const processedData = {
        ...data,
        priceRate: data.priceRate !== undefined ? Math.round(Number(data.priceRate) * 100).toString() : undefined,
      };

      await onSubmit(processedData);
      reset();
      setLogoFile(null);
      setLogoUrl(null);
      setMcpValidation({ isValid: true });
    } catch (error) {
      console.error('Failed to submit form:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit form. Please try again.';
      toast.error(errorMessage);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadImage(formData);

      if (result.success && result.data) {
        setValue('logo', result.data);
        setLogoFile(file);
        setLogoUrl(result.data);
        toast.success('Logo uploaded successfully!');
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Failed to upload logo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload logo. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const clearForm = () => {
    reset({
      name: '',
      description: '',
      url: '',
      priceRate: undefined,
      logo: undefined,
      providerWebsite: undefined,
      providerName: undefined,
    });
    setLogoFile(null);
    setLogoUrl(null);
    setMcpValidation({ isValid: false });
  };

  const handleMcpValidationChange = useCallback((isValid: boolean, error?: string) => {
    setMcpValidation({ isValid, error });
  }, []);

  const watchedUrl = watch('url') || '';

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
              <h4 className="text-md font-semibold">Server Logo</h4>
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center">
                  <div className="relative cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleLogoUpload(file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      disabled={isUploadingLogo || isLoading}
                    />
                    <Avatar
                      src={logoUrl || undefined}
                      size="lg"
                      className="w-20 h-20 group-hover:opacity-80 transition-opacity"
                      fallback={
                        isUploadingLogo ? (
                          <Spinner />
                        ) : (
                          <div className="flex flex-col items-center">
                            <Upload className="w-6 h-6 text-default-400" />
                          </div>
                        )
                      }
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {isUploadingLogo ? 'Uploading...' : 'Click to upload'}
                  </p>
                </div>
                <div className="flex-1 space-y-2">
                  {logoFile && (
                    <p className="text-sm text-green-600">✓ {logoFile.name}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Upload a logo image for your MCP server (optional, max 1MB)
                  </p>
                </div>
              </div>
            </div>

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
                  />
                )}
              />

              <McpServerPreview
                url={watchedUrl}
                onValidationChange={handleMcpValidationChange}
              />

              <Controller
                name="priceRate"
                control={control}
                rules={{
                  min: {
                    value: 0,
                    message: 'Price rate must be 0 or greater'
                  },
                  max: {
                    value: 10,
                    message: 'Price rate must be 10 or less'
                  }
                }}
                render={({ field }) => (
                  <NumberInput
                    label="Price Rate"
                    placeholder="1.0"
                    step={0.1}
                    min={0}
                    max={10}
                    endContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">x</span>
                      </div>
                    }
                    isInvalid={!!errors.priceRate}
                    errorMessage={errors.priceRate?.message}
                    value={field.value !== undefined ? Number(field.value) : undefined}
                    onValueChange={(value) => {
                      if (value === undefined || value === null) {
                        field.onChange(undefined);
                      } else {
                        // Round to 1 decimal place
                        const rounded = Math.round(value * 10) / 10;
                        if (rounded >= 0 && rounded <= 10) {
                          field.onChange(rounded);
                        }
                      }
                    }}
                  />
                )}
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-md font-semibold">Provider Information</h4>

              <Controller
                name="providerName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Provider Name"
                    placeholder="Enter provider name"
                    isInvalid={!!errors.providerName}
                    errorMessage={errors.providerName?.message}
                  />
                )}
              />

              <Controller
                name="providerWebsite"
                control={control}
                rules={{
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'Please enter a valid URL (http:// or https://)'
                  }
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Provider Website"
                    placeholder="https://provider-website.com"
                    isInvalid={!!errors.providerWebsite}
                    errorMessage={errors.providerWebsite?.message}
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
                color={mcpValidation.isValid ? "primary" : "default"}
                size="lg"
                isLoading={isLoading}
                disabled={isLoading || !mcpValidation.isValid}
              >
                {isLoading
                  ? "Registering..."
                  : mcpValidation.isValid
                    ? "Register MCP Server"
                    : "Server Not Verified"
                }
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default McpRegistrationForm;
