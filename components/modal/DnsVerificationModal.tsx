'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Divider,
  Chip,
  Alert,
} from "@heroui/react";
import { Copy, ExternalLink } from 'lucide-react';
import { AgentCard } from '@/types/a2a';
import { McpServer } from '@/types/mcp';
import {
  generateDnsVerificationInfo,
  isValidDomain,
  extractDomainFromUrl,
  DnsVerificationInfo
} from '@/utils/dns';

interface DnsVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: AgentCard & { id: string };
  mcp?: McpServer & { id: string };
}

export default function DnsVerificationModal({
  isOpen,
  onClose,
  agent,
  mcp,
}: DnsVerificationModalProps) {
  const [verificationInfo, setVerificationInfo] = useState<DnsVerificationInfo | null>(null);

  const type = agent ? 'agent' : 'mcp';
  const data = agent || mcp;
  const entityId = data?.id || '';
  const entityName = data?.name || '';
  const entityUrl = data?.url || '';

  const urlDomain = extractDomainFromUrl(entityUrl);

  const generateVerificationInfo = React.useCallback((domain: string) => {
    if (!domain || !entityId) return;

    if (!isValidDomain(domain)) {
      setVerificationInfo(null);
      return;
    }

    const info = generateDnsVerificationInfo(entityId, domain, type);
    setVerificationInfo(info);
  }, [entityId, type]);

  useEffect(() => {
    if (isOpen) {
      setVerificationInfo(null);

      if (urlDomain) {
        generateVerificationInfo(urlDomain);
      }
    }
  }, [isOpen, urlDomain, generateVerificationInfo]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onClose}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">
            DNS Verification
          </h3>
        </ModalHeader>

        <ModalBody className="space-y-4">
          <Card>
            <CardBody>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Name:</span>
                  <span className="text-sm">{entityName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">ID:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-default-100 px-2 py-1 rounded">
                      {entityId}
                    </code>
                    <Button
                      size="sm"
                      variant="light"
                      isIconOnly
                      onPress={() => copyToClipboard(entityId)}
                    >
                      <Copy size={14} />
                    </Button>
                  </div>
                </div>
                {entityUrl && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">URL:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{entityUrl}</span>
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        as="a"
                        href={entityUrl}
                        target="_blank"
                      >
                        <ExternalLink size={14} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {verificationInfo && (
            <>
              <Divider />
              <div className="space-y-4">
                <h4 className="text-md font-semibold">DNS Configuration</h4>

                <Card>
                  <CardBody className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <p className="text-sm font-medium text-default-700">Record Type</p>
                        <div className="flex items-center gap-2">
                          <Chip size="sm" color="secondary" variant="flat">
                            {verificationInfo.recordType}
                          </Chip>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-default-700">Host/Name</p>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-default-100 px-2 py-1 rounded flex-1">
                            {verificationInfo.subdomain}<span className="text-zinc-500">.{verificationInfo.domain}</span>
                          </code>
                          <Button
                            size="sm"
                            variant="light"
                            isIconOnly
                            onPress={() => copyToClipboard(verificationInfo.subdomain)}
                          >
                            <Copy size={14} />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-default-700">Value</p>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-default-100 px-2 py-1 rounded flex-1 break-all">
                            {verificationInfo.recordValue}
                          </code>
                          <Button
                            size="sm"
                            variant="light"
                            isIconOnly
                            onPress={() => copyToClipboard(verificationInfo.recordValue)}
                          >
                            <Copy size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Alert
                  color="warning"
                  variant="faded"
                >
                  <div className="space-y-2">
                    <p className="font-medium">Important Instructions:</p>
                    <ul className="text-sm space-y-1">
                      <li>• Wait 10-20 minutes for DNS propagation after adding the record</li>
                      <li>• Complete verification within 10 days</li>
                      <li>• After successful verification, your {type} will appear in SenseSpace</li>
                    </ul>
                  </div>
                </Alert>

                <Alert
                  color="success"
                  variant="faded"
                >
                  <div className="space-y-2">
                    <p className="font-medium">Next Steps:</p>
                    <ol className="text-sm space-y-1">
                      <li>1. Add the TXT record to your DNS provider</li>
                      <li>2. Wait for DNS propagation (10-20 minutes)</li>
                      <li>3. Return to verify your domain ownership</li>
                      <li>4. Your {type} will be visible in SenseSpace after verification</li>
                    </ol>
                  </div>
                </Alert>
              </div>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={onClose}
          >
            Close
          </Button>
          {verificationInfo && (
            <Button
              color="primary"
              onPress={() => {
                const info = `DNS Verification for ${entityName}
Record Type: ${verificationInfo.recordType}
Host/Name: ${verificationInfo.subdomain}
Value: ${verificationInfo.recordValue}`;
                copyToClipboard(info);
              }}
            >
              Copy All Info
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
