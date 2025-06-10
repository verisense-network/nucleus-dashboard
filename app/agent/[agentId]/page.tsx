import { AgentInfo, getAgentById } from "@/app/actions";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Avatar } from "@heroui/avatar";
import { ArrowLeft, Shield, Zap, FileText, ExternalLink } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

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
    if (result.message?.includes("404") || result.message?.includes("not found")) {
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
        Object.entries(agent.agentCard.securitySchemes || {}).map(([key, value]) => [key, JSON.parse(value as unknown as string)])
      ),
    };
  }

  const agentCard = parseAgentCard(agent);

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
              <span>Exposes task status<br/>change history</span>
              <Chip 
                color={agentCard.capabilities.stateTransitionHistory ? "success" : "default"} 
                variant="flat" 
                size="sm"
              >
                {agentCard.capabilities.stateTransitionHistory ? "Supported" : "Not Supported"}
              </Chip>
            </div>
          </div>
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
            {Object.entries(agentCard.securitySchemes).map(([schemeName, scheme]) => (
              <div key={schemeName} className="bg-default-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{schemeName}</h4>
                  <Chip variant="flat" color="success" size="sm">
                    {scheme.type}
                  </Chip>
                </div>
                <div className="text-small text-default-600 space-y-1">
                  <p><span className="font-medium">Location:</span> {scheme.in}</p>
                  <p><span className="font-medium">Name:</span> {scheme.name}</p>
                  <p><span className="font-medium">Description:</span> {scheme.description}</p>
                </div>
              </div>
            ))}
            
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
            {agentCard.skills.map((skill, index) => (
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
