'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Button, CardHeader } from '@heroui/react';
import { Card, CardBody } from '@heroui/react';
import { Input, Textarea, Select, SelectItem } from '@heroui/react';
import { Checkbox, Switch } from '@heroui/react';
import { Divider } from '@heroui/react';
import { Plus, Trash2, FileText } from 'lucide-react';
import { AgentCard, SecurityScheme } from '@/types/a2a';
import { TagsInput } from '../input/TagsInput';

// Helper type for form data to handle securitySchemes as an array
interface SecuritySchemeFormData {
  schemeName: string;
  scheme: SecurityScheme;
}

// Helper type for security requirements
interface SecurityRequirementFormData {
  schemeName: string;
  scopes: string[];
}

interface FormData extends Omit<AgentCard, 'securitySchemes' | 'security'> {
  securitySchemesArray: SecuritySchemeFormData[];
  securityArray: SecurityRequirementFormData[];
}

interface AgentRegistrationFormProps {
  onSubmit: (data: AgentCard) => Promise<void>;
  initialData?: Partial<AgentCard>;
  isLoading?: boolean;
}

const testData = {
  "name": "Test",
  "description": "this is a description",
  "url": "https://x.com/veri_sense",
  "iconUrl": "https://tailwindcss.com/_next/static/media/tailwindcss-mark.d52e9897.svg",
  "version": "1.0.0",
  "documentationUrl": "https://x.com/veri_sense",
  "capabilities": {
    "streaming": true,
    "pushNotifications": true,
    "stateTransitionHistory": false,
    "extensions": []
  },
  "defaultInputModes": [
    "text/plain"
  ],
  "defaultOutputModes": [
    "text/plain"
  ],
  "skills": [
    {
      "id": "skill1",
      "name": "sdasafasfd",
      "description": "afsdasfdsfadfsdaasdfasfd",
      "tags": [
        "adfasdf"
      ],
      "examples": [
        "ddddddd"
      ],
      "inputModes": [],
      "outputModes": []
    }
  ],
  "supportsAuthenticatedExtendedCard": true,
  "provider": {
    "organization": "Verisense",
    "url": "https://x.com/veri_sense"
  },
  "securitySchemesArray": [
    {
      "schemeName": "test",
      "scheme": {
        "type": "apiKey",
        "in": "header",
        "name": "X-API-Key",
        "description": "afsafdsfdasafdsfadasfd"
      }
    },
    {
      "schemeName": "test1",
      "scheme": {
        "type": "apiKey",
        "in": "header",
        "name": "1111",
        "description": "111111"
      }
    }
  ],
  "securityArray": [
    {
      "schemeName": "test",
      "scopes": [
        "write"
      ]
    },
    {
      "schemeName": "test1",
      "scopes": [
        "admin"
      ]
    }
  ],
  "securitySchemes": {
    "test": "{\"type\":\"apiKey\",\"in\":\"header\",\"name\":\"X-API-Key\",\"description\":\"afsafdsfdasafdsfadasfd\"}",
    "test1": "{\"type\":\"apiKey\",\"in\":\"header\",\"name\":\"1111\",\"description\":\"111111\"}"
  },
  "security": [
    {
      "test": [
        "write"
      ]
    },
    {
      "test1": [
        "admin"
      ]
    }
  ]
}

export const AgentRegistrationForm: React.FC<AgentRegistrationFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      url: initialData?.url || '',
      iconUrl: initialData?.iconUrl || '',
      version: initialData?.version || '1.0.0',
      documentationUrl: initialData?.documentationUrl || '',
      capabilities: {
        streaming: initialData?.capabilities?.streaming || false,
        pushNotifications: initialData?.capabilities?.pushNotifications || false,
        stateTransitionHistory: initialData?.capabilities?.stateTransitionHistory || false,
        extensions: initialData?.capabilities?.extensions || [],
      },
      defaultInputModes: initialData?.defaultInputModes || ['text/plain'],
      defaultOutputModes: initialData?.defaultOutputModes || ['text/plain'],
      skills: initialData?.skills || [],
      supportsAuthenticatedExtendedCard: initialData?.supportsAuthenticatedExtendedCard || false,
      provider: {
        organization: initialData?.provider?.organization || '',
        url: initialData?.provider?.url || '',
      },
      // Convert securitySchemes object to array for form handling
      securitySchemesArray: initialData?.securitySchemes
        ? Object.entries(initialData.securitySchemes).map(([schemeName, scheme]) => ({
          schemeName,
          scheme,
        }))
        : [],
      // Convert security array to form-friendly format
      securityArray: initialData?.security
        ? initialData.security.flatMap(requirement =>
          Object.entries(requirement).map(([schemeName, scopes]) => ({
            schemeName,
            scopes: Array.isArray(scopes) ? scopes : [],
          }))
        )
        : [],
    },
  });

  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray({
    control,
    name: 'skills',
  });

  const {
    fields: securitySchemeFields,
    append: appendSecurityScheme,
    remove: removeSecurityScheme,
  } = useFieldArray({
    control,
    name: 'securitySchemesArray',
  });

  const {
    fields: securityFields,
    append: appendSecurity,
    remove: removeSecurity,
  } = useFieldArray({
    control,
    name: 'securityArray',
  });

  const mediaTypes = [
    'text/plain',
    'text/markdown',
    'text/html',
    'application/json',
    'image/jpeg',
    'image/png',
    'image/gif',
    'audio/mpeg',
    'video/mp4',
    'application/pdf',
  ];

  const handleFormSubmit = async (data: FormData) => {
    // Convert securitySchemesArray back to securitySchemes object
    const securitySchemes: { [scheme: string]: SecurityScheme } = {};
    data.securitySchemesArray?.forEach(({ schemeName, scheme }) => {
      if (schemeName && scheme) {
        securitySchemes[schemeName] = JSON.stringify(scheme) as any; // force to string
      }
    });

    // Convert securityArray back to security array format
    const security: { [scheme: string]: string[] }[] = [];
    data.securityArray?.forEach(({ schemeName, scopes }) => {
      if (schemeName) {
        security.push({ [schemeName]: scopes || [] });
      }
    });

    const agentCardData: AgentCard = {
      ...data,
      securitySchemes: Object.keys(securitySchemes).length > 0 ? securitySchemes : undefined,
      security: security.length > 0 ? security : undefined,
      iconUrl: data.iconUrl || undefined,
      documentationUrl: data.documentationUrl || undefined,
      provider: data.provider?.organization ? data.provider : undefined,
    };

    await onSubmit(agentCardData);
    reset();
  };

  const parseJsonData = (input?: string) => {
    try {
      setJsonError('');
      const parsedData = JSON.parse(input || jsonInput);

      if (!parsedData || typeof parsedData !== 'object') {
        throw new Error('Invalid JSON format');
      }

      const formData: Partial<FormData> = {
        ...parsedData,
        securitySchemesArray: parsedData.securitySchemes
          ? Object.entries(parsedData.securitySchemes).map(([schemeName, scheme]) => ({
            schemeName,
            scheme: JSON.parse(scheme as string),
          }))
          : [],
        securityArray: parsedData.security
          ? parsedData.security.flatMap((requirement: any) =>
            Object.entries(requirement).map(([schemeName, scopes]) => ({
              schemeName,
              scopes: Array.isArray(scopes) ? scopes : [],
            }))
          )
          : [],
      };

      reset(formData);
      setJsonInput('');
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON format');
    }
  };

  const parseTestData = () => {
    parseJsonData(JSON.stringify(testData));
  }

  const clearForm = () => {
    reset({
      name: '',
      description: '',
      url: '',
      iconUrl: '',
      version: '1.0.0',
      documentationUrl: '',
      capabilities: {
        streaming: false,
        pushNotifications: false,
        stateTransitionHistory: false,
        extensions: [],
      },
      defaultInputModes: ['text/plain'],
      defaultOutputModes: ['text/plain'],
      skills: [],
      supportsAuthenticatedExtendedCard: false,
      provider: {
        organization: '',
        url: '',
      },
      securitySchemesArray: [],
      securityArray: [],
    });
    setJsonInput('');
    setJsonError('');
  };

  return (
    <div className="mx-auto pt-6 space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText size={20} />
            JSON Import
          </h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">

            <Textarea
              placeholder="Paste your AgentCard JSON here..."
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              minRows={6}
              isInvalid={!!jsonError}
              errorMessage={jsonError}
              description="Support complete AgentCard JSON format data"
            />

            <div className="flex gap-2">
              <Button
                color="primary"
                variant="flat"
                onPress={() => parseJsonData()}
                disabled={!jsonInput.trim() && !isLoading}
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
                  color="warning"
                  variant="flat"
                  onPress={parseTestData}
                >
                  Parse Test Data
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>


              <Controller
                name="name"
                control={control}
                rules={{ required: 'Agent name is required' }}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Agent Name"
                    placeholder="Enter Agent Name"
                    isInvalid={!!errors.name}
                    errorMessage={errors.name?.message}
                    isRequired
                  />
                )}
              />

              <Controller
                name="description"
                control={control}
                rules={{ required: 'Agent description is required' }}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    label="Description"
                    placeholder="Describe the functionality and purpose of the Agent"
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
                  required: 'Agent URL is required',
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'Please enter a valid URL (http:// or https://)'
                  }
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Agent URL"
                    placeholder="https://example.com/agent"
                    isInvalid={!!errors.url}
                    errorMessage={errors.url?.message}
                    isRequired
                  />
                )}
              />

              <Controller
                name="iconUrl"
                control={control}
                rules={{
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'Please enter a valid URL'
                  }
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Icon URL"
                    placeholder="https://example.com/icon.png"
                    isInvalid={!!errors.iconUrl}
                    errorMessage={errors.iconUrl?.message}
                  />
                )}
              />

              <Controller
                name="version"
                control={control}
                rules={{ required: 'Version is required' }}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Version"
                    placeholder="1.0.0"
                    isInvalid={!!errors.version}
                    errorMessage={errors.version?.message}
                    isRequired
                  />
                )}
              />

              <Controller
                name="documentationUrl"
                control={control}
                rules={{
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'Please enter a valid URL'
                  }
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Documentation URL"
                    placeholder="https://example.com/docs"
                    isInvalid={!!errors.documentationUrl}
                    errorMessage={errors.documentationUrl?.message}
                  />
                )}
              />
            </div>

            <Divider />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Provider Information</h3>

              <Controller
                name="provider.organization"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Organization Name"
                    placeholder="Your organization name"
                  />
                )}
              />

              <Controller
                name="provider.url"
                control={control}
                rules={{
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'Please enter a valid URL'
                  }
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Organization URL"
                    placeholder="https://your-organization.com"
                    isInvalid={!!errors.provider?.url}
                    errorMessage={errors.provider?.url?.message}
                  />
                )}
              />
            </div>

            <Divider />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Security Schemes</h3>
                <Button
                  type="button"
                  size="sm"
                  color="primary"
                  variant="flat"
                  startContent={<Plus size={16} />}
                  onPress={() =>
                    appendSecurityScheme({
                      schemeName: '',
                      scheme: {
                        type: 'apiKey',
                        in: 'header',
                        name: '',
                      },
                    })
                  }
                >
                  Add Security Scheme
                </Button>
              </div>

              {securitySchemeFields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Security Scheme {index + 1}</h4>
                      <Button
                        type="button"
                        size="sm"
                        color="danger"
                        variant="flat"
                        isIconOnly
                        onPress={() => removeSecurityScheme(index)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>

                    <Controller
                      name={`securitySchemesArray.${index}.schemeName`}
                      control={control}
                      rules={{ required: 'Scheme name is required' }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          label="Scheme Name"
                          placeholder="bearer_auth"
                          isInvalid={!!errors.securitySchemesArray?.[index]?.schemeName}
                          errorMessage={errors.securitySchemesArray?.[index]?.schemeName?.message}
                          isRequired
                        />
                      )}
                    />

                    <Controller
                      name={`securitySchemesArray.${index}.scheme.type`}
                      control={control}
                      rules={{ required: 'Security scheme type is required' }}
                      render={({ field }) => (
                        <Select
                          label="Security Scheme Type"
                          selectedKeys={field.value ? new Set([field.value]) : new Set()}
                          onSelectionChange={(keys) => {
                            const selectedType = Array.from(keys)[0] as string;
                            field.onChange(selectedType);

                            // Reset scheme-specific fields when type changes
                            const currentScheme = watch(`securitySchemesArray.${index}.scheme`);
                            let newScheme: SecurityScheme;

                            switch (selectedType) {
                              case 'apiKey':
                                newScheme = { type: 'apiKey', in: 'header', name: '' };
                                break;
                              case 'http':
                                newScheme = { type: 'http', scheme: '' };
                                break;
                              case 'oauth2':
                                newScheme = {
                                  type: 'oauth2',
                                  flows: {
                                    clientCredentials: {
                                      tokenUrl: '',
                                      scopes: {},
                                    },
                                  },
                                };
                                break;
                              case 'openIdConnect':
                                newScheme = { type: 'openIdConnect', openIdConnectUrl: '' };
                                break;
                              default:
                                newScheme = currentScheme;
                            }

                            // Update the entire scheme object
                            setValue(`securitySchemesArray.${index}.scheme`, newScheme);
                          }}
                          isRequired
                        >
                          <SelectItem key="apiKey">API Key</SelectItem>
                          <SelectItem key="http">HTTP Authentication</SelectItem>
                          <SelectItem key="oauth2">OAuth 2.0</SelectItem>
                          <SelectItem key="openIdConnect">OpenID Connect</SelectItem>
                        </Select>
                      )}
                    />

                    {/* Conditional fields based on security scheme type */}
                    {watch(`securitySchemesArray.${index}.scheme.type`) === 'apiKey' && (
                      <>
                        <Controller
                          name={`securitySchemesArray.${index}.scheme.in`}
                          control={control}
                          rules={{ required: 'API key location is required' }}
                          render={({ field }) => (
                            <Select
                              label="API Key Location"
                              selectedKeys={field.value ? new Set([field.value]) : new Set()}
                              onSelectionChange={(keys) => {
                                field.onChange(Array.from(keys)[0]);
                              }}
                              isRequired
                            >
                              <SelectItem key="header">Header</SelectItem>
                              <SelectItem key="query">Query Parameter</SelectItem>
                              <SelectItem key="cookie">Cookie</SelectItem>
                            </Select>
                          )}
                        />

                        <Controller
                          name={`securitySchemesArray.${index}.scheme.name`}
                          control={control}
                          rules={{ required: 'API key name is required' }}
                          render={({ field }) => (
                            <Input
                              {...field}
                              label="API Key Name"
                              placeholder="X-API-Key"
                              isRequired
                            />
                          )}
                        />
                      </>
                    )}

                    {watch(`securitySchemesArray.${index}.scheme.type`) === 'http' && (
                      <>
                        <Controller
                          name={`securitySchemesArray.${index}.scheme.scheme`}
                          control={control}
                          rules={{ required: 'HTTP scheme is required' }}
                          render={({ field }) => (
                            <Input
                              {...field}
                              label="HTTP Scheme"
                              placeholder="bearer"
                              isRequired
                            />
                          )}
                        />

                        <Controller
                          name={`securitySchemesArray.${index}.scheme.bearerFormat`}
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              label="Bearer Format"
                              placeholder="JWT"
                            />
                          )}
                        />
                      </>
                    )}

                    {watch(`securitySchemesArray.${index}.scheme.type`) === 'openIdConnect' && (
                      <Controller
                        name={`securitySchemesArray.${index}.scheme.openIdConnectUrl`}
                        control={control}
                        rules={{
                          required: 'OpenID Connect URL is required',
                          pattern: {
                            value: /^https?:\/\/.+/,
                            message: 'Please enter a valid URL'
                          }
                        }}
                        render={({ field }) => (
                          <Input
                            {...field}
                            label="OpenID Connect URL"
                            placeholder="https://example.com/.well-known/openid_configuration"
                            isRequired
                          />
                        )}
                      />
                    )}

                    {watch(`securitySchemesArray.${index}.scheme.type`) === 'oauth2' && (
                      <div className="space-y-4">
                        <Controller
                          name={`securitySchemesArray.${index}.scheme.flows.clientCredentials.tokenUrl`}
                          control={control}
                          rules={{
                            required: 'Token URL is required',
                            pattern: {
                              value: /^https?:\/\/.+/,
                              message: 'Please enter a valid URL'
                            }
                          }}
                          render={({ field }) => (
                            <Input
                              {...field}
                              label="Token URL"
                              placeholder="https://example.com/oauth/token"
                              isRequired
                            />
                          )}
                        />

                        <Controller
                          name={`securitySchemesArray.${index}.scheme.flows.clientCredentials.scopes`}
                          control={control}
                          render={({ field }) => (
                            <Textarea
                              label="Scopes (JSON)"
                              placeholder={'{"read": "Read access", "write": "Write access"}'}
                              value={field.value && typeof field.value === 'object' ? JSON.stringify(field.value, null, 2) : field.value || '{}'}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                try {
                                  const scopes = JSON.parse(newValue || '{}');
                                  if (typeof scopes === 'object' && scopes !== null) {
                                    field.onChange(scopes);
                                  }
                                } catch {
                                  // Keep the string value for invalid JSON
                                }
                              }}
                              description="Enter valid JSON format for scopes"
                            />
                          )}
                        />
                      </div>
                    )}

                    <Controller
                      name={`securitySchemesArray.${index}.scheme.description`}
                      control={control}
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          label="Description"
                          placeholder="Describe this security scheme"
                        />
                      )}
                    />
                  </div>
                </Card>
              ))}

              {securitySchemeFields.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  <p>No security schemes configured.</p>
                </div>
              )}
            </div>

            <Divider />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Security</h3>
                <Button
                  type="button"
                  size="sm"
                  color="primary"
                  variant="flat"
                  startContent={<Plus size={16} />}
                  onPress={() =>
                    appendSecurity({
                      schemeName: '',
                      scopes: [],
                    })
                  }
                >
                  Add Security
                </Button>
              </div>

              {securityFields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Security {index + 1}</h4>
                      <Button
                        type="button"
                        size="sm"
                        color="danger"
                        variant="flat"
                        isIconOnly
                        onPress={() => removeSecurity(index)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>

                    <Controller
                      name={`securityArray.${index}.schemeName`}
                      control={control}
                      rules={{ required: 'Security scheme name is required' }}
                      render={({ field }) => {
                        const availableSchemes = watch('securitySchemesArray')?.map(s => s.schemeName).filter(Boolean) || [];
                        return (
                          <Select
                            label="Security Scheme"
                            placeholder="Select a security scheme"
                            selectedKeys={field.value ? new Set([field.value]) : new Set()}
                            onSelectionChange={(keys) => {
                              field.onChange(Array.from(keys)[0]);
                            }}
                            isRequired
                          >
                            {availableSchemes.map((schemeName) => (
                              <SelectItem key={schemeName}>
                                {schemeName}
                              </SelectItem>
                            ))}
                          </Select>
                        );
                      }}
                    />

                    <TagsInput
                      name={`securityArray.${index}.scopes`}
                      control={control}
                      label="Scopes"
                      placeholder="Enter scopes (e.g., read, write, admin)"
                    />
                  </div>
                </Card>
              ))}

              {securityFields.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  <p>No security configured.</p>
                  <p className="text-sm">Add security schemes first, then configure security.</p>
                </div>
              )}
            </div>

            <Divider />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Agent Capabilities</h3>

              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="capabilities.streaming"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      isSelected={field.value}
                      onValueChange={field.onChange}
                    >
                      Streaming Response (SSE)
                    </Checkbox>
                  )}
                />

                <Controller
                  name="capabilities.pushNotifications"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      isSelected={field.value}
                      onValueChange={field.onChange}
                    >
                      Push Notifications
                    </Checkbox>
                  )}
                />

                <Controller
                  name="capabilities.stateTransitionHistory"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      isSelected={field.value}
                      onValueChange={field.onChange}
                    >
                      Exposes task status change history
                    </Checkbox>
                  )}
                />
              </div>
            </div>

            <Divider />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Media Type Support</h3>

              <Controller
                name="defaultInputModes"
                control={control}
                rules={{ required: 'At least one input media type is required' }}
                render={({ field }) => (
                  <Select
                    label="Default Input Media Type"
                    selectionMode="multiple"
                    selectedKeys={new Set(field.value)}
                    onSelectionChange={(keys) => {
                      field.onChange(Array.from(keys as Set<string>));
                    }}
                    isInvalid={!!errors.defaultInputModes}
                    errorMessage={errors.defaultInputModes?.message}
                    isRequired
                  >
                    {mediaTypes.map((type) => (
                      <SelectItem key={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              />

              <Controller
                name="defaultOutputModes"
                control={control}
                rules={{ required: 'At least one output media type is required' }}
                render={({ field }) => (
                  <Select
                    label="Default Output Media Type"
                    selectionMode="multiple"
                    selectedKeys={new Set(field.value)}
                    onSelectionChange={(keys) => {
                      field.onChange(Array.from(keys as Set<string>));
                    }}
                    isInvalid={!!errors.defaultOutputModes}
                    errorMessage={errors.defaultOutputModes?.message}
                    isRequired
                  >
                    {mediaTypes.map((type) => (
                      <SelectItem key={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              />
            </div>

            <Divider />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Agent Skills</h3>
                <Button
                  type="button"
                  size="sm"
                  color="primary"
                  variant="flat"
                  startContent={<Plus size={16} />}
                  onPress={() =>
                    appendSkill({
                      id: '',
                      name: '',
                      description: '',
                      tags: [],
                      examples: [],
                      inputModes: [],
                      outputModes: [],
                    })
                  }
                >
                  Add Skill
                </Button>
              </div>

              {skillFields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Skill {index + 1}</h4>
                      <Button
                        type="button"
                        size="sm"
                        color="danger"
                        variant="flat"
                        isIconOnly
                        onPress={() => removeSkill(index)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>

                    <Controller
                      name={`skills.${index}.id`}
                      control={control}
                      rules={{ required: 'Skill ID is required' }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          label="Skill ID"
                          placeholder="skill-unique-id"
                          isInvalid={!!errors.skills?.[index]?.id}
                          errorMessage={errors.skills?.[index]?.id?.message}
                          isRequired
                        />
                      )}
                    />

                    <Controller
                      name={`skills.${index}.name`}
                      control={control}
                      rules={{ required: 'Skill name is required' }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          label="Skill Name"
                          placeholder="Skill Name"
                          isInvalid={!!errors.skills?.[index]?.name}
                          errorMessage={errors.skills?.[index]?.name?.message}
                          isRequired
                        />
                      )}
                    />

                    <Controller
                      name={`skills.${index}.description`}
                      control={control}
                      rules={{ required: 'Skill description is required' }}
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          label="Skill Description"
                          placeholder="Describe the functionality of this skill"
                          isInvalid={!!errors.skills?.[index]?.description}
                          errorMessage={errors.skills?.[index]?.description?.message}
                          isRequired
                        />
                      )}
                    />

                    <TagsInput
                      name={`skills.${index}.tags`}
                      control={control}
                      label="Tags"
                      placeholder="Enter tags (e.g., cooking, customer-support, billing)"
                    />

                    <Controller
                      name={`skills.${index}.examples`}
                      control={control}
                      render={({ field }) => (
                        <Textarea
                          label="Examples"
                          placeholder="One example per line"
                          value={Array.isArray(field.value) ? field.value.join('\n') : ''}
                          onChange={(e) => {
                            const examples = e.target.value.split('\n').map(ex => ex.trim()).filter(Boolean);
                            field.onChange(examples);
                          }}
                        />
                      )}
                    />
                  </div>
                </Card>
              ))}
            </div>

            <Divider />

            <div className="space-y-4">
              <Controller
                name="supportsAuthenticatedExtendedCard"
                control={control}
                render={({ field }) => (
                  <div className="flex w-full">
                    <Switch
                      isSelected={field.value}
                      onValueChange={field.onChange}
                      size="lg"
                      color="primary"
                      classNames={{
                        base: "inline-flex flex-row-reverse w-full max-w-full bg-content1 hover:bg-content2 items-center justify-between cursor-pointer rounded-lg gap-2 p-4 border-2 border-gray-200 data-[selected=true]:border-primary",
                        wrapper: "p-0 h-4 overflow-visible",
                        thumb: "w-6 h-6 border-2 border-white shadow-lg group-data-[hover=true]:border-primary group-data-[selected=true]:ml-8 group-data-[selected=true]:border-primary rtl:group-data-[selected=true]:ml-0 rtl:group-data-[selected=true]:mr-8"
                      }}
                    >
                      <div className="flex flex-col gap-1">
                        <p className="text-medium">Supports Authenticated Extended Card</p>
                        <p className="text-tiny text-default-400">
                          True if the agent supports providing an extended agent card when the user is authenticated.
                        </p>
                      </div>
                    </Switch>
                  </div>
                )}
              />
            </div>

            <Divider />

            <div className="flex justify-end space-x-4">
              <Button
                type="submit"
                color="primary"
                size="lg"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Registering...' : 'Register Agent'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default AgentRegistrationForm; 