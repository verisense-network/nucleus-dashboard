'use client';

import React from 'react';
import { Controller, Control } from 'react-hook-form';
import { Input, Select, SelectItem, Card, Checkbox } from '@heroui/react';
import { ScopesInput } from './ScopesInput';

interface OAuth2FlowType {
  authorizationCode: boolean;
  clientCredentials: boolean;
  implicit: boolean;
  password: boolean;
}

interface OAuth2FlowsInputProps {
  name: string;
  control: Control<any>;
  label?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
}

const FLOW_PRESETS = {
  standard: {
    label: 'Standard Client Application (Recommended)',
    description: 'Suitable for most web applications and mobile apps',
    flows: { authorizationCode: true, clientCredentials: false, implicit: false, password: false }
  },
  fullstack: {
    label: 'Full-stack Application (Client + Server)',
    description: 'Client authentication + server integration',
    flows: { authorizationCode: true, clientCredentials: true, implicit: false, password: false }
  },
  serverOnly: {
    label: 'Server-only Application',
    description: 'For server-to-server communication only',
    flows: { authorizationCode: false, clientCredentials: true, implicit: false, password: false }
  },
  custom: {
    label: 'Custom Configuration',
    description: 'Manually select required flows',
    flows: { authorizationCode: false, clientCredentials: false, implicit: false, password: false }
  }
};

export const OAuth2FlowsInput: React.FC<OAuth2FlowsInputProps> = ({
  name,
  control,
  label = "OAuth2 Flow Configuration",
  isRequired = false,
  isDisabled = false,
}) => {
  const [selectedPreset, setSelectedPreset] = React.useState<string>('standard');
  const [customFlows, setCustomFlows] = React.useState<OAuth2FlowType>({
    authorizationCode: true,
    clientCredentials: false,
    implicit: false,
    password: false
  });

  React.useEffect(() => {
    if (selectedPreset !== 'custom') {
      setCustomFlows(FLOW_PRESETS[selectedPreset as keyof typeof FLOW_PRESETS].flows);
    }
  }, [selectedPreset]);

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium">
          {label}
          {isRequired && <span className="text-danger ml-1">*</span>}
        </label>
        <p className="text-xs text-default-400 mt-1">
          Select the OAuth2 flow configuration suitable for your application
        </p>
      </div>

      {/* Preset Selection */}
      <Select
        label="Recommended Configuration"
        selectedKeys={new Set([selectedPreset])}
        onSelectionChange={(keys) => {
          const preset = Array.from(keys)[0] as string;
          setSelectedPreset(preset);
        }}
        description="Select a recommended configuration based on your application type"
        isDisabled={isDisabled}
      >
        {Object.entries(FLOW_PRESETS).map(([key, preset]) => (
          <SelectItem key={key} description={preset.description}>
            {preset.label}
          </SelectItem>
        ))}
      </Select>

      {/* Flow Selection */}
      <Card className="p-4">
        <div className="space-y-4">
          <h4 className="font-medium">Enabled Flows</h4>
          
          <div className="grid grid-cols-1 gap-3">
            <Checkbox
              isSelected={customFlows.authorizationCode}
              onValueChange={(checked) => {
                if (selectedPreset === 'custom') {
                  setCustomFlows(prev => ({ ...prev, authorizationCode: checked }));
                }
              }}
              isDisabled={selectedPreset !== 'custom'}
              color="primary"
              isReadOnly={isDisabled}
            >
              <div>
                <div className="font-medium text-sm">Authorization Code Flow</div>
                <div className="text-xs text-default-400">
                  Suitable for Web applications, high security (Recommended)
                </div>
              </div>
            </Checkbox>

            <Checkbox
              isSelected={customFlows.clientCredentials}
              onValueChange={(checked) => {
                if (selectedPreset === 'custom') {
                  setCustomFlows(prev => ({ ...prev, clientCredentials: checked }));
                }
              }}
              isDisabled={selectedPreset !== 'custom'}
              color="primary"
              isReadOnly={isDisabled}
            >
              <div>
                <div className="font-medium text-sm">Client Credentials Flow</div>
                <div className="text-xs text-default-400">
                  Suitable for server-to-server communication
                </div>
              </div>
            </Checkbox>

            <Checkbox
              isSelected={customFlows.implicit}
              onValueChange={(checked) => {
                if (selectedPreset === 'custom') {
                  setCustomFlows(prev => ({ ...prev, implicit: checked }));
                }
              }}
              isDisabled={selectedPreset !== 'custom'}
              color="warning"
              isReadOnly={isDisabled}
            >
              <div>
                <div className="font-medium text-sm">Implicit Flow <span className="text-warning">(Not Recommended)</span></div>
                <div className="text-xs text-default-400">
                  Lower security, replaced by Authorization Code + PKCE
                </div>
              </div>
            </Checkbox>

            <Checkbox
              isSelected={customFlows.password}
              onValueChange={(checked) => {
                if (selectedPreset === 'custom') {
                  setCustomFlows(prev => ({ ...prev, password: checked }));
                }
              }}
              isDisabled={selectedPreset !== 'custom'}
              color="warning"
              isReadOnly={isDisabled}
            >
              <div>
                <div className="font-medium text-sm">Resource Owner Password Flow <span className="text-warning">(Not Recommended)</span></div>
                <div className="text-xs text-default-400">
                  Lower security, use only in highly trusted applications
                </div>
              </div>
            </Checkbox>
          </div>

          {selectedPreset !== 'custom' && (
            <div className="text-xs text-default-400 bg-default-100 p-2 rounded">
              Current configuration is using preset. Select &quot;Custom Configuration&quot; to manually select flows.
            </div>
          )}
        </div>
      </Card>

      {/* Authorization Code Flow Configuration */}
      {customFlows.authorizationCode && (
        <Card className="p-4">
          <div className="space-y-4">
            <h4 className="font-medium">Authorization Code Flow Configuration</h4>
            
            <Controller
              name={`${name}.flows.authorizationCode.authorizationUrl`}
              control={control}
              rules={{
                required: customFlows.authorizationCode ? 'Authorization URL is required' : false,
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Please enter a valid URL'
                }
              }}
              render={({ field, fieldState: { error } }) => (
                <Input
                  {...field}
                  label="Authorization URL"
                  placeholder="https://example.com/oauth/authorize"
                  isInvalid={!!error}
                  errorMessage={error?.message}
                  isRequired={customFlows.authorizationCode}
                  description="Endpoint URL for user authorization"
                  isReadOnly={isDisabled}
                />
              )}
            />

            <Controller
              name={`${name}.flows.authorizationCode.tokenUrl`}
              control={control}
              rules={{
                required: customFlows.authorizationCode ? 'Token URL is required' : false,
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Please enter a valid URL'
                }
              }}
              render={({ field, fieldState: { error } }) => (
                <Input
                  {...field}
                  label="Token URL"
                  placeholder="https://example.com/oauth/token"
                  isInvalid={!!error}
                  errorMessage={error?.message}
                  isRequired={customFlows.authorizationCode}
                  description="Endpoint URL for obtaining access token"
                  isReadOnly={isDisabled}
                />
              )}
            />

            <Controller
              name={`${name}.flows.authorizationCode.refreshUrl`}
              control={control}
              rules={{
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Please enter a valid URL'
                }
              }}
              render={({ field, fieldState: { error } }) => (
                <Input
                  {...field}
                  label="Refresh URL (Optional)"
                  placeholder="https://example.com/oauth/refresh"
                  isInvalid={!!error}
                  errorMessage={error?.message}
                  description="Endpoint URL for refreshing token"
                  isReadOnly={isDisabled}
                />
              )}
            />

            <ScopesInput
              name={`${name}.flows.authorizationCode.scopesArray`}
              control={control}
              label="Authorization Code Scopes"
              description="Define the scopes supported by this flow"
              isDisabled={isDisabled}
            />
          </div>
        </Card>
      )}

      {/* Client Credentials Flow Configuration */}
      {customFlows.clientCredentials && (
        <Card className="p-4">
          <div className="space-y-4">
            <h4 className="font-medium">Client Credentials Flow Configuration</h4>
            
            <Controller
              name={`${name}.flows.clientCredentials.tokenUrl`}
              control={control}
              rules={{
                required: customFlows.clientCredentials ? 'Token URL is required' : false,
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Please enter a valid URL'
                }
              }}
              render={({ field, fieldState: { error } }) => (
                <Input
                  {...field}
                  label="Token URL"
                  placeholder="https://example.com/oauth/token"
                  isInvalid={!!error}
                  errorMessage={error?.message}
                  isRequired={customFlows.clientCredentials}
                  description="Endpoint URL for obtaining access token"
                  isReadOnly={isDisabled}
                />
              )}
            />

            <Controller
              name={`${name}.flows.clientCredentials.refreshUrl`}
              control={control}
              rules={{
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Please enter a valid URL'
                }
              }}
              render={({ field, fieldState: { error } }) => (
                <Input
                  {...field}
                  label="Refresh URL (Optional)"
                  placeholder="https://example.com/oauth/refresh"
                  isInvalid={!!error}
                  errorMessage={error?.message}
                  description="Endpoint URL for refreshing token"
                  isReadOnly={isDisabled}
                />
              )}
            />

            <ScopesInput
              name={`${name}.flows.clientCredentials.scopesArray`}
              control={control}
              label="Client Credentials Scopes"
              description="Define the scopes supported by this flow"
              isDisabled={isDisabled}
            />
          </div>
        </Card>
      )}

      {/* Implicit Flow Configuration */}
      {customFlows.implicit && (
        <Card className="p-4 border-warning">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">Implicit Flow Configuration</h4>
              <span className="text-warning text-xs px-2 py-1 bg-warning/20 rounded">Not Recommended</span>
            </div>
            
            <div className="text-sm text-warning bg-warning/10 p-3 rounded">
              ⚠️ Implicit Flow poses security risks, use Authorization Code Flow + PKCE instead
            </div>

            <Controller
              name={`${name}.flows.implicit.authorizationUrl`}
              control={control}
              rules={{
                required: customFlows.implicit ? 'Authorization URL is required' : false,
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Please enter a valid URL'
                }
              }}
              render={({ field, fieldState: { error } }) => (
                <Input
                  {...field}
                  label="Authorization URL"
                  placeholder="https://example.com/oauth/authorize"
                  isInvalid={!!error}
                  errorMessage={error?.message}
                  isRequired={customFlows.implicit}
                  isReadOnly={isDisabled}
                />
              )}
            />

            <ScopesInput
              name={`${name}.flows.implicit.scopesArray`}
              control={control}
              label="Implicit Scopes"
              isDisabled={isDisabled}
            />
          </div>
        </Card>
      )}

      {/* Password Flow Configuration */}
      {customFlows.password && (
        <Card className="p-4 border-warning">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">Resource Owner Password Flow Configuration</h4>
              <span className="text-warning text-xs px-2 py-1 bg-warning/20 rounded">Not Recommended</span>
            </div>
            
            <div className="text-sm text-warning bg-warning/10 p-3 rounded">
              ⚠️ Password Flow poses security risks, use only in highly trusted applications
            </div>

            <Controller
              name={`${name}.flows.password.tokenUrl`}
              control={control}
              rules={{
                required: customFlows.password ? 'Token URL is required' : false,
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Please enter a valid URL'
                }
              }}
              render={({ field, fieldState: { error } }) => (
                <Input
                  {...field}
                  label="Token URL"
                  placeholder="https://example.com/oauth/token"
                  isInvalid={!!error}
                  errorMessage={error?.message}
                  isRequired={customFlows.password}
                  isReadOnly={isDisabled}
                />
              )}
            />

            <ScopesInput
              name={`${name}.flows.password.scopesArray`}
              control={control}
              label="Password Scopes"
              isDisabled={isDisabled}
            />
          </div>
        </Card>
      )}
    </div>
  );
};

export default OAuth2FlowsInput; 