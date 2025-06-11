'use client';

import React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Button } from '@heroui/react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Input, Textarea, Select, SelectItem } from '@heroui/react';
import { Checkbox, Switch } from '@heroui/react';
import { Divider } from '@heroui/react';
import { Plus, Trash2 } from 'lucide-react';
import { AgentCard, SecurityScheme } from '@/types/a2a';

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

export const AgentRegistrationForm: React.FC<AgentRegistrationFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
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

  return (
    <div className="mx-auto pt-6 space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-center">Agent Registration Form</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>

              <Input
                {...register('name', { required: 'Agent name is required' })}
                label="Agent Name"
                placeholder="Enter Agent Name"
                isInvalid={!!errors.name}
                errorMessage={errors.name?.message}
                isRequired
              />

              <Textarea
                {...register('description', { required: 'Agent description is required' })}
                label="Description"
                placeholder="Describe the functionality and purpose of the Agent"
                isInvalid={!!errors.description}
                errorMessage={errors.description?.message}
                isRequired
              />

              <Input
                {...register('url', {
                  required: 'Agent URL is required',
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'Please enter a valid URL (http:// or https://)'
                  }
                })}
                label="Agent URL"
                placeholder="https://example.com/agent"
                isInvalid={!!errors.url}
                errorMessage={errors.url?.message}
                isRequired
              />

              <Input
                {...register('iconUrl', {
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'Please enter a valid URL'
                  }
                })}
                label="Icon URL"
                placeholder="https://example.com/icon.png"
                isInvalid={!!errors.iconUrl}
                errorMessage={errors.iconUrl?.message}
              />

              <Input
                {...register('version', { required: 'Version is required' })}
                label="Version"
                placeholder="1.0.0"
                isInvalid={!!errors.version}
                errorMessage={errors.version?.message}
                isRequired
              />

              <Input
                {...register('documentationUrl', {
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'Please enter a valid URL'
                  }
                })}
                label="Documentation URL"
                placeholder="https://example.com/docs"
                isInvalid={!!errors.documentationUrl}
                errorMessage={errors.documentationUrl?.message}
              />
            </div>

            <Divider />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Provider Information</h3>

              <Input
                {...register('provider.organization')}
                label="Organization Name"
                placeholder="Your organization name"
              />

              <Input
                {...register('provider.url', {
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'Please enter a valid URL'
                  }
                })}
                label="Organization URL"
                placeholder="https://your-organization.com"
                isInvalid={!!errors.provider?.url}
                errorMessage={errors.provider?.url?.message}
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

                    <Input
                      {...register(`securitySchemesArray.${index}.schemeName`, { required: 'Scheme name is required' })}
                      label="Scheme Name"
                      placeholder="bearer_auth"
                      isInvalid={!!errors.securitySchemesArray?.[index]?.schemeName}
                      errorMessage={errors.securitySchemesArray?.[index]?.schemeName?.message}
                      isRequired
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
                            register(`securitySchemesArray.${index}.scheme`).onChange({
                              target: { value: newScheme }
                            });
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

                        <Input
                          {...register(`securitySchemesArray.${index}.scheme.name`, { required: 'API key name is required' })}
                          label="API Key Name"
                          placeholder="X-API-Key"
                          isRequired
                        />
                      </>
                    )}

                    {watch(`securitySchemesArray.${index}.scheme.type`) === 'http' && (
                      <>
                        <Input
                          {...register(`securitySchemesArray.${index}.scheme.scheme`, { required: 'HTTP scheme is required' })}
                          label="HTTP Scheme"
                          placeholder="bearer"
                          isRequired
                        />

                        <Input
                          {...register(`securitySchemesArray.${index}.scheme.bearerFormat`)}
                          label="Bearer Format"
                          placeholder="JWT"
                        />
                      </>
                    )}

                    {watch(`securitySchemesArray.${index}.scheme.type`) === 'openIdConnect' && (
                      <Input
                        {...register(`securitySchemesArray.${index}.scheme.openIdConnectUrl`, {
                          required: 'OpenID Connect URL is required',
                          pattern: {
                            value: /^https?:\/\/.+/,
                            message: 'Please enter a valid URL'
                          }
                        })}
                        label="OpenID Connect URL"
                        placeholder="https://example.com/.well-known/openid_configuration"
                        isRequired
                      />
                    )}

                    {watch(`securitySchemesArray.${index}.scheme.type`) === 'oauth2' && (
                      <div className="space-y-4">
                        <Input
                          {...register(`securitySchemesArray.${index}.scheme.flows.clientCredentials.tokenUrl`, {
                            required: 'Token URL is required',
                            pattern: {
                              value: /^https?:\/\/.+/,
                              message: 'Please enter a valid URL'
                            }
                          })}
                          label="Token URL"
                          placeholder="https://example.com/oauth/token"
                          isRequired
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

                    <Textarea
                      {...register(`securitySchemesArray.${index}.scheme.description`)}
                      label="Description"
                      placeholder="Describe this security scheme"
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

                    <Controller
                      name={`securityArray.${index}.scopes`}
                      control={control}
                      render={({ field }) => (
                        <Textarea
                          label="Scopes"
                          placeholder="Enter scopes separated by commas (e.g., read, write, admin)"
                          value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                          onChange={(e) => {
                            const scopes = e.target.value.split(',').map(scope => scope.trim()).filter(Boolean);
                            field.onChange(scopes);
                          }}
                        />
                      )}
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

                    <Input
                      {...register(`skills.${index}.id`, { required: 'Skill ID is required' })}
                      label="Skill ID"
                      placeholder="skill-unique-id"
                      isInvalid={!!errors.skills?.[index]?.id}
                      errorMessage={errors.skills?.[index]?.id?.message}
                      isRequired
                    />

                    <Input
                      {...register(`skills.${index}.name`, { required: 'Skill name is required' })}
                      label="Skill Name"
                      placeholder="Skill Name"
                      isInvalid={!!errors.skills?.[index]?.name}
                      errorMessage={errors.skills?.[index]?.name?.message}
                      isRequired
                    />

                    <Textarea
                      {...register(`skills.${index}.description`, { required: 'Skill description is required' })}
                      label="Skill Description"
                      placeholder="Describe the functionality of this skill"
                      isInvalid={!!errors.skills?.[index]?.description}
                      errorMessage={errors.skills?.[index]?.description?.message}
                      isRequired
                    />

                    <Controller
                      name={`skills.${index}.tags`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          label="Tags"
                          placeholder="cooking,customer-support,billing (use comma to separate)"
                          value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                          onChange={(e) => {
                            const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                            field.onChange(tags);
                          }}
                        />
                      )}
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