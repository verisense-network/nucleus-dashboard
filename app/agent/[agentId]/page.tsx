import { AgentInfo, getAgentById } from "@/app/actions";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Avatar } from "@heroui/avatar";
import { ArrowLeft, Shield, Zap, FileText, ExternalLink, Key, Lock, CircleHelp } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SecurityScheme, OAuth2SecurityScheme, APIKeySecurityScheme, HTTPAuthSecurityScheme, OpenIdConnectSecurityScheme } from "../../../types/a2a";
import { Tooltip } from "@heroui/tooltip";

interface AgentDetailPageProps {
  params: Promise<{
    agentId: string;
  }>;
}

export async function generateMetadata({ params }: AgentDetailPageProps): Promise<Metadata> {
  const { agentId } = await params;

  const result = await getAgentById(agentId);

  if (!result.success || !result.data) {
    return {
      title: "Agent Not Found",
      description: "The requested Agent does not exist or has been deleted",
    };
  }

  const agent = result.data;

  return {
    title: `${agent.agentCard.name} - Agent Detail`,
    description: `View the detailed information of ${agent.agentCard.name}, including version, description, and other core data.`,
    openGraph: {
      title: `${agent.agentCard.name} - Agent Detail`,
      description: `View the detailed information of ${agent.agentCard.name}, including version, description, and other core data.`,
      type: "website",
    },
  };
}

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { agentId } = await params;

  const result = await getAgentById(agentId);

  if (!result.success || !result.data) {
    if (!result.data && !result.message) {
      notFound();
    }

    return (
      <div className="w-full mx-auto py-4">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" startContent={<ArrowLeft size={16} />}>
              Back to Home
            </Button>
          </Link>
        </div>

        <Card>
          <CardBody>
            <p className="text-danger">Failed to load data: {result.message || "Unknown error"}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const agent = result.data;

  function parseAgentCard(agent: AgentInfo) {
    return {
      ...agent.agentCard,
      securitySchemes: Object.fromEntries(
        Object.entries(agent.agentCard.securitySchemes || {}).map(([key, value]) => [key, JSON.parse(value as unknown as string) as SecurityScheme])
      ),
    };
  }

  const agentCard = parseAgentCard(agent);

  const renderSecurityScheme = (schemeName: string, scheme: SecurityScheme) => {
    const getSchemeIcon = (type: string) => {
      switch (type) {
        case 'oauth2':
          return <Lock className="w-4 h-4" />;
        case 'apiKey':
          return <Key className="w-4 h-4" />;
        case 'http':
          return <Shield className="w-4 h-4" />;
        case 'openIdConnect':
          return <Lock className="w-4 h-4" />;
        default:
          return <Shield className="w-4 h-4" />;
      }
    };

    return (
      <div key={schemeName} className="bg-default-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getSchemeIcon(scheme.type)}
            <h4 className="font-medium">{schemeName}</h4>
          </div>
          <Chip variant="flat" color="success" size="sm">
            {scheme.type}
          </Chip>
        </div>

        {scheme.description && typeof scheme.description === 'string' && (
          <p className="text-small text-default-600 mb-3">{scheme.description}</p>
        )}

        {scheme.type === 'oauth2' && (
          <div className="space-y-3">
            <h5 className="font-medium text-small">Flows</h5>
            {Object.entries((scheme as OAuth2SecurityScheme).flows).map(([flowType, flowConfig]) => (
              flowConfig && (
                <div key={flowType} className="bg-default-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-small capitalize">{flowType.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <Chip variant="flat" color="primary" size="sm">{flowType}</Chip>
                  </div>

                  <div className="space-y-2 text-tiny text-default-600">
                    {'authorizationUrl' in flowConfig && (
                      <div>
                        <span className="font-medium">Authorization URL:</span>
                        <br />
                        <Link href={flowConfig.authorizationUrl} target="_blank" className="text-primary break-all">
                          {flowConfig.authorizationUrl}
                        </Link>
                      </div>
                    )}

                    {'tokenUrl' in flowConfig && (
                      <div>
                        <span className="font-medium">Token URL:</span>
                        <br />
                        <Link href={flowConfig.tokenUrl} target="_blank" className="text-primary break-all">
                          {flowConfig.tokenUrl}
                        </Link>
                      </div>
                    )}

                    {flowConfig.refreshUrl && (
                      <div>
                        <span className="font-medium">Refresh URL:</span>
                        <br />
                        <Link href={flowConfig.refreshUrl} target="_blank" className="text-primary break-all">
                          {flowConfig.refreshUrl}
                        </Link>
                      </div>
                    )}

                    {Object.keys(flowConfig.scopes).length > 0 && (
                      <div>
                        <span className="font-medium">Scopes:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(flowConfig.scopes).map(([scope, description]) => (
                            <Chip
                              key={scope}
                              variant="flat"
                              color="secondary"
                              size="sm"
                              title={String(description)}
                            >
                              {scope}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        {scheme.type === 'apiKey' && (
          <div className="text-small text-default-600 space-y-1">
            <p><span className="font-medium">Location:</span> {(scheme as APIKeySecurityScheme).in}</p>
            <p><span className="font-medium">Parameter Name:</span> {(scheme as APIKeySecurityScheme).name}</p>
          </div>
        )}

        {scheme.type === 'http' && (
          <div className="text-small text-default-600 space-y-1">
            <p><span className="font-medium">Authentication Scheme:</span> {(scheme as HTTPAuthSecurityScheme).scheme}</p>
            {(scheme as HTTPAuthSecurityScheme).bearerFormat && (
              <p><span className="font-medium">Bearer Format:</span> {(scheme as HTTPAuthSecurityScheme).bearerFormat}</p>
            )}
          </div>
        )}

        {scheme.type === 'openIdConnect' && (
          <div className="text-small text-default-600">
            <p><span className="font-medium">OpenID Connect URL:</span></p>
            <Link
              href={(scheme as OpenIdConnectSecurityScheme).openIdConnectUrl}
              target="_blank"
              className="text-primary break-all"
            >
              {(scheme as OpenIdConnectSecurityScheme).openIdConnectUrl}
            </Link>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full mx-auto py-4 space-y-6">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" startContent={<ArrowLeft size={16} />}>
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Agent Details</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center">
              <Avatar src={agentCard.iconUrl} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{agentCard.name}</h2>
              <p className="text-small text-default-500">Version {agentCard.version}</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0 space-y-4">
          <p className="text-default-600">{agentCard.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Service Provider</h4>
              <div className="bg-default-50 rounded-lg p-3">
                <p className="font-medium">{agentCard.provider?.organization}</p>
                {agentCard.provider?.url && (
                  <Link href={agentCard.provider.url} target="_blank" className="text-primary text-small flex items-center gap-1 mt-1">
                    {agentCard.provider.url} <ExternalLink size={12} />
                  </Link>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Related Links</h4>
              <div className="space-y-2">
                <Link href={agentCard.url} target="_blank" className="text-primary text-small flex items-center gap-1">
                  Service URL <ExternalLink size={12} />
                </Link>
                {agentCard.documentationUrl && (
                  <Link href={agentCard.documentationUrl} target="_blank" className="text-primary text-small flex items-center gap-1">
                    Documentation <ExternalLink size={12} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-warning" />
            <h3 className="text-lg font-semibold">Capabilities</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-default-50 rounded-lg">
              <span>SSE</span>
              <Chip
                color={agentCard.capabilities?.streaming ? "success" : "default"}
                variant="flat"
                size="sm"
              >
                {agentCard.capabilities.streaming ? "Supported" : "Not Supported"}
              </Chip>
            </div>

            <div className="flex items-center justify-between p-3 bg-default-50 rounded-lg">
              <span>Push Notifications</span>
              <Chip
                color={agentCard.capabilities.pushNotifications ? "success" : "default"}
                variant="flat"
                size="sm"
              >
                {agentCard.capabilities.pushNotifications ? "Supported" : "Not Supported"}
              </Chip>
            </div>

            <div className="flex items-center justify-between p-3 bg-default-50 rounded-lg">
              <span>Exposes task status<br />change history</span>
              <Chip
                color={agentCard.capabilities.stateTransitionHistory ? "success" : "default"}
                variant="flat"
                size="sm"
              >
                {agentCard.capabilities.stateTransitionHistory ? "Supported" : "Not Supported"}
              </Chip>
            </div>
          </div>

          {agentCard.capabilities.extensions && agentCard.capabilities.extensions.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Extensions</h4>
              <div className="space-y-4">
                {agentCard.capabilities.extensions.map((extension, index) => (
                  <div key={index} className="bg-default-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Link href={extension.uri} target="_blank" className="text-primary text-small flex items-center gap-1">
                            {extension.uri} <ExternalLink size={12} />
                          </Link>
                          <div className="flex items-center gap-1 ml-4">
                            <Chip
                              variant="flat"
                              color={extension.required ? "warning" : "default"}
                              size="sm"
                            >
                              {extension.required ? "Required" : "Optional"}
                            </Chip>
                            <Tooltip content="Whether the client must follow specific requirements of the extension.">
                              <CircleHelp size={18} className="text-default-500" />
                            </Tooltip>
                          </div>
                        </div>
                        {extension.description && (
                          <p className="text-small text-default-600">{extension.description}</p>
                        )}
                      </div>
                    </div>

                    {extension.params && (
                      <div>
                        <h5 className="font-medium mb-2">Parameters</h5>
                        <div className="bg-default-100 rounded-lg p-3">
                          {(() => {
                            const params = typeof extension.params === 'string'
                              ? JSON.parse(extension.params)
                              : extension.params;

                            return (
                              <div className="space-y-2">
                                {Object.entries(params).map(([key, value]) => (
                                  <div key={key} className="flex items-start gap-2">
                                    <div className="min-w-[120px]">
                                      <Chip variant="flat" color="primary" size="sm" className="w-full justify-center">
                                        {key}
                                      </Chip>
                                    </div>
                                    <div className="flex-1">
                                      <Chip variant="flat" color="secondary" size="sm" className="w-full">
                                        {String(value)}
                                      </Chip>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Input/Output Modes</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Default Input Modes</h4>
              <div className="flex flex-wrap gap-2">
                {agentCard.defaultInputModes.map((mode, index) => (
                  <Chip key={index} variant="flat" color="primary" size="sm">
                    {mode}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Default Output Modes</h4>
              <div className="flex flex-wrap gap-2">
                {agentCard.defaultOutputModes.map((mode, index) => (
                  <Chip key={index} variant="flat" color="secondary" size="sm">
                    {mode}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-success" />
            <h3 className="text-lg font-semibold">Security Configuration</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {Object.entries(agentCard.securitySchemes || {}).map(([schemeName, scheme]) =>
              renderSecurityScheme(schemeName, scheme)
            )}

            <Divider className="my-4" />

            <div className="p-2">
              <h4 className="font-medium mb-2">Security Permissions</h4>
              <div className="flex flex-wrap gap-2">
                {agentCard.security?.map((securityItem, index) =>
                  Object.entries(securityItem).map(([scheme, permissions]) =>
                    permissions.map((permission, permIndex) => (
                      <Chip key={`${index}-${scheme}-${permIndex}`} variant="flat" color="warning" size="sm">
                        {scheme}: {permission}
                      </Chip>
                    ))
                  )
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Skills</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {agentCard.skills.map((skill) => (
              <div key={skill.id} className="bg-default-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-lg">{skill.name}</h4>
                    <p className="text-small text-default-500">ID: {skill.id}</p>
                  </div>
                </div>

                <p className="text-default-600 mb-3">{skill.description}</p>

                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium mb-2">Tags</h5>
                    <div className="flex flex-wrap gap-2">
                      {skill.tags.map((tag, tagIndex) => (
                        <Chip key={tagIndex} variant="flat" size="sm">
                          {tag}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Examples</h5>
                    <div className="bg-default-100 rounded-lg p-3">
                      {skill.examples?.map((example, exampleIndex) => (
                        <p key={exampleIndex} className="text-small text-default-600">
                          {example}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Configuration</h3>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between p-3 bg-default-50 rounded-lg">
            <span>Supports Authenticated Extended Card</span>
            <Chip
              color={agentCard.supportsAuthenticatedExtendedCard ? "success" : "default"}
              variant="flat"
              size="sm"
            >
              {agentCard.supportsAuthenticatedExtendedCard ? "Supported" : "Not Supported"}
            </Chip>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
