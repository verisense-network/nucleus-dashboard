'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Alert, Button, CardHeader } from '@heroui/react';
import { Card, CardBody } from '@heroui/react';
import { Input, Textarea, Select, SelectItem } from '@heroui/react';
import { Checkbox, Switch } from '@heroui/react';
import { Divider } from '@heroui/react';
import { Plus, Trash2, FileText } from 'lucide-react';
import { AgentCard, SecurityScheme } from '@/types/a2a';
import { TagsInput } from '../input/TagsInput';
import { OAuth2FlowsInput } from '../input/OAuth2FlowsInput';
import { KeyValueInput } from '../input/KeyValueInput';
import Link from 'next/link';
import { getAgentById } from '@/app/actions';
import { useEndpointStore } from '@/stores/endpoint';
import { toast } from 'react-toastify';


interface SecuritySchemeFormData {
  schemeName: string;
  scheme: SecurityScheme & {
    flows?: any;
  };
}

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
  isLoading?: boolean;
  agentCardId?: string | null;
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
    "extensions": [
      {
        "uri": "https://x.com/veri_sense",
        "description": "assadafsasdf",
        "required": false,
        "params": "{\"asdfasfdsaf\":\"1\",\"b\":\"2\"}"
      }
    ]
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
  "securitySchemes": {
    "api_key": "{\"type\":\"apiKey\",\"in\":\"header\",\"name\":\"X-API-Key\",\"description\":\"API Key Authentication\"}",
    "oauth2_standard": "{\"type\":\"oauth2\",\"description\":\"OAuth2 Standard\",\"flows\":{\"authorizationCode\":{\"authorizationUrl\":\"https://example.com/oauth/authorize\",\"tokenUrl\":\"https://example.com/oauth/token\",\"refreshUrl\":\"https://example.com/oauth/refresh\",\"scopes\":{\"read\":\"read permission\",\"write\":\"write permission\"}}}}"
  },
  "security": [
    {
      "api_key": [
        "read"
      ]
    },
    {
      "oauth2_standard": [
        "read",
        "write"
      ]
    }
  ]
}

export const AgentRegistrationForm: React.FC<AgentRegistrationFormProps> = ({
  onSubmit,
  isLoading = false,
  agentCardId = ''
}) => {
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [endpointUrlError, setEndpointUrlError] = useState('');
  const [isLoadingAgentCard, setIsLoadingAgentCard] = useState(false);
  const { endpoint } = useEndpointStore();

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
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
      // Convert securitySchemes object to array for form handling
      securitySchemesArray: [],
      // Convert security array to form-friendly format
      securityArray: [],
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

  const {
    fields: extensionFields,
    append: appendExtension,
    remove: removeExtension,
  } = useFieldArray({
    control,
    name: 'capabilities.extensions',
  });

  const mediaTypes = [
    'text',
    'file',
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
        let processedScheme = { ...scheme };

        if (scheme.type === 'oauth2' && scheme.flows) {
          const processedFlows: any = {};

          Object.entries(scheme.flows).forEach(([flowType, flowConfig]: [string, any]) => {
            if (flowConfig && typeof flowConfig === 'object') {
              const processedFlow = { ...flowConfig };

              if (flowConfig.scopesArray && Array.isArray(flowConfig.scopesArray)) {
                const scopes: { [name: string]: string } = {};
                flowConfig.scopesArray.forEach(({ name, description }: any) => {
                  if (name?.trim()) {
                    scopes[name.trim()] = description?.trim() || '';
                  }
                });
                processedFlow.scopes = scopes;
                delete processedFlow.scopesArray;
              }

              processedFlows[flowType] = processedFlow;
            }
          });

          processedScheme = {
            ...scheme,
            flows: processedFlows,
          };
        }

        securitySchemes[schemeName] = JSON.stringify(processedScheme) as any; // force to string
      }
    });

    // Convert securityArray back to security array format
    const security: { [scheme: string]: string[] }[] = [];
    data.securityArray?.forEach(({ schemeName, scopes }) => {
      if (schemeName) {
        security.push({ [schemeName]: scopes || [] });
      }
    });

    // Process extensions params
    const processedExtensions = data.capabilities.extensions?.map(extension => ({
      ...extension,
      params: extension.params ? JSON.stringify(extension.params) : "{}"
    }));

    const agentCardData: AgentCard = {
      ...data,
      securitySchemes: Object.keys(securitySchemes).length > 0 ? securitySchemes : undefined,
      security: security.length > 0 ? security : undefined,
      iconUrl: data.iconUrl || undefined,
      documentationUrl: data.documentationUrl || undefined,
      provider: data.provider?.organization ? data.provider : undefined,
      capabilities: {
        ...data.capabilities,
        extensions: processedExtensions as any
      }
    };

    await onSubmit(agentCardData);
    reset();
  };

  const parseJsonData = useCallback((input?: string) => {
    try {
      setJsonError('');
      const parsedData = JSON.parse(input || jsonInput);

      if (!parsedData || typeof parsedData !== 'object') {
        throw new Error('Invalid JSON format');
      }

      const formData: Partial<FormData> = {
        ...parsedData,
        securitySchemesArray: parsedData.securitySchemes
          ? Object.entries(parsedData.securitySchemes).map(([schemeName, scheme]) => {
            const parsedScheme = JSON.parse(scheme as string);

            // Convert scopes object to array for OAuth2
            if (parsedScheme.type === 'oauth2' && parsedScheme.flows) {
              const processedFlows: any = {};

              Object.entries(parsedScheme.flows).forEach(([flowType, flowConfig]: [string, any]) => {
                if (flowConfig && typeof flowConfig === 'object') {
                  const processedFlow = { ...flowConfig };

                  if (flowConfig.scopes && typeof flowConfig.scopes === 'object') {
                    const scopesArray = Object.entries(flowConfig.scopes).map(([name, description]) => ({
                      name,
                      description: description as string,
                    }));
                    processedFlow.scopesArray = scopesArray;
                  }

                  processedFlows[flowType] = processedFlow;
                }
              });

              return {
                schemeName,
                scheme: {
                  ...parsedScheme,
                  flows: processedFlows,
                },
              };
            }

            return {
              schemeName,
              scheme: parsedScheme,
            };
          })
          : [],
        securityArray: parsedData.security
          ? parsedData.security.flatMap((requirement: any) =>
            Object.entries(requirement).map(([schemeName, scopes]) => ({
              schemeName,
              scopes: Array.isArray(scopes) ? scopes : [],
            }))
          )
          : [],
        capabilities: {
          ...parsedData.capabilities,
          extensions: parsedData.capabilities?.extensions?.map((extension: any) => ({
            ...extension,
            params: typeof extension.params === 'string' ? JSON.parse(extension.params) : extension.params
          }))
        }
      };

      reset(formData);
      setJsonInput('');
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON format');
    }
  }, [jsonInput, reset]);

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

  const loadAgentCardFromEndpoint = useCallback(async () => {
    if (!endpointUrl.trim()) {
      setEndpointUrlError('Please enter a valid endpoint address');
      return;
    }

    setIsLoadingAgentCard(true);
    try {
      setEndpointUrlError('');
      const response = await fetch(`/api/proxy-agent-card?endpoint=${encodeURIComponent(endpointUrl)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      parseJsonData(JSON.stringify(data));
      setIsOpenForm(true);
    } catch (error) {
      console.error('Error loading agent card:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setEndpointUrlError(`Failed to load: ${errorMessage}`);
    } finally {
      setIsLoadingAgentCard(false);
    }
  }, [endpointUrl, parseJsonData]);

  useEffect(() => {
    const fetchAgentCard = async () => {
      toast.loading('Loading agent card...');
      if (agentCardId && endpoint) {
        const agentCard = await getAgentById(endpoint, agentCardId);
        if (agentCard.success) {
          const url = agentCard.data?.agentCard.url;
          if (url) {
            setEndpointUrl(url);
            await loadAgentCardFromEndpoint();
          }
        }
      }
      toast.dismiss();
    }
    fetchAgentCard();
  }, [agentCardId, endpoint, loadAgentCardFromEndpoint]);

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
      {agentCardId && <Alert color="warning">Updating Agent Card: {agentCardId}</Alert>}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText size={20} />
            Import
          </h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                label="From Endpoint"
                placeholder="Enter Agent server address (e.g. https://example.com)"
                value={endpointUrl}
                labelPlacement='outside'
                onChange={(e) => setEndpointUrl(e.target.value)}
                isInvalid={!!endpointUrlError}
                errorMessage={endpointUrlError}
                description="Enter the base URL of the Agent server, the system will automatically load /.well-known/agent.json"
              />
              <Button
                color="primary"
                variant="flat"
                onPress={loadAgentCardFromEndpoint}
                isLoading={isLoadingAgentCard}
                disabled={isLoadingAgentCard || !endpointUrl.trim()}
              >
                {isLoadingAgentCard ? 'Loading...' : 'Load Agent Card'}
              </Button>
            </div>

            <Textarea
              label="From AgentCard JSON (from your code)"
              labelPlacement='outside'
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

      {isOpenForm && <Card>
        <CardBody>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div>
              <Alert color="warning" variant="flat">
                Update Agent Card in your code, here is just read and display
              </Alert>
            </div>
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
                    isReadOnly
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
                    isReadOnly
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
                    isReadOnly
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
                    isReadOnly
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
                    isReadOnly
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
                    isReadOnly
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
                    isReadOnly
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
                    isReadOnly
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
                  isDisabled
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
                        isDisabled
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
                          isReadOnly
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
                                    authorizationCode: {
                                      authorizationUrl: '',
                                      tokenUrl: '',
                                      refreshUrl: '',
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
                          isDisabled
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
                              isDisabled
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
                              isDisabled
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
                              isDisabled
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
                              isDisabled
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
                            isDisabled
                          />
                        )}
                      />
                    )}

                    {watch(`securitySchemesArray.${index}.scheme.type`) === 'oauth2' && (
                      <OAuth2FlowsInput
                        name={`securitySchemesArray.${index}.scheme`}
                        control={control}
                        label="OAuth2 Flows"
                        isRequired
                        isDisabled
                      />
                    )}

                    <Controller
                      name={`securitySchemesArray.${index}.scheme.description`}
                      control={control}
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          label="Description"
                          placeholder="Describe this security scheme"
                          isReadOnly
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
                  isDisabled
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
                        isDisabled
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
                            isDisabled
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
                      isDisabled
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
                      isReadOnly
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
                      isReadOnly
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
                      isReadOnly
                    >
                      Exposes task status change history
                    </Checkbox>
                  )}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Extensions</h4>
                  <Button
                    type="button"
                    size="sm"
                    color="primary"
                    variant="flat"
                    startContent={<Plus size={16} />}
                    onPress={() => {
                      appendExtension({
                        uri: '',
                        description: '',
                        required: false,
                        params: {}
                      });
                    }}
                    isDisabled
                  >
                    Add Extension
                  </Button>
                </div>

                {extensionFields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Extension {index + 1}</h4>
                        <Button
                          type="button"
                          size="sm"
                          color="danger"
                          variant="flat"
                          isIconOnly
                          onPress={() => removeExtension(index)}
                          isDisabled
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>

                      <Controller
                        name={`capabilities.extensions.${index}.uri`}
                        control={control}
                        rules={{ required: 'Extension URI is required' }}
                        render={({ field }) => (
                          <Input
                            {...field}
                            label="Extension URI"
                            placeholder="https://example.com/extension"
                            isInvalid={!!errors.capabilities?.extensions?.[index]?.uri}
                            errorMessage={errors.capabilities?.extensions?.[index]?.uri?.message}
                            isRequired
                            isReadOnly
                          />
                        )}
                      />

                      <Controller
                        name={`capabilities.extensions.${index}.description`}
                        control={control}
                        render={({ field }) => (
                          <Textarea
                            {...field}
                            label="Description"
                            placeholder="Describe how this agent uses this extension"
                            isReadOnly
                          />
                        )}
                      />

                      <Controller
                        name={`capabilities.extensions.${index}.required`}
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            isSelected={field.value}
                            onValueChange={field.onChange}
                            isReadOnly
                          >
                            Required
                          </Checkbox>
                        )}
                      />

                      <Controller
                        name={`capabilities.extensions.${index}.params`}
                        control={control}
                        render={({ field }) => (
                          <KeyValueInput
                            name={`capabilities.extensions.${index}.params`}
                            control={control}
                            label="Parameters"
                            placeholder={{
                              key: "Parameter name",
                              value: "Parameter value"
                            }}
                            isDisabled
                          />
                        )}
                      />
                    </div>
                  </Card>
                ))}

                {extensionFields.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    <p>No extensions configured.</p>
                  </div>
                )}
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
                    isDisabled
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
                    isDisabled
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
                  isDisabled
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
                        isDisabled
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
                          isDisabled
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
                          isDisabled
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
                          isDisabled
                        />
                      )}
                    />

                    <TagsInput
                      name={`skills.${index}.tags`}
                      control={control}
                      label="Tags"
                      placeholder="Enter tags (e.g., cooking, customer-support, billing)"
                      isDisabled
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
                          isReadOnly
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
                      isReadOnly
                      classNames={{
                        base: "inline-flex flex-row-reverse w-full max-w-full bg-content1 hover:bg-content2 items-center justify-between cursor-pointer rounded-lg gap-2 p-4 border-2 border-zinc-200 dark:border-zinc-800 data-[selected=true]:border-primary",
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
                isDisabled={isLoading}
              >
                {isLoading ? 'Registering...' : 'Register Agent'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>}
    </div>
  );
};

export default AgentRegistrationForm; 