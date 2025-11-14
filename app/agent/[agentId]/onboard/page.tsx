'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardBody, CardHeader, Spinner, Chip, Alert } from '@heroui/react';
import { DollarSign, AlertCircle, CheckCircle, ArrowRight, CheckCircle2, XCircle, Copy, ArrowLeft } from 'lucide-react';
import { onboardAgent } from '@/api/stripe';
import { Agent, getAgentById } from '@/api/agents';
import { usePolkadotWalletStore } from '@/stores/polkadot-wallet';
import { web3Enable, web3FromSource } from '@polkadot/extension-dapp';

export default function AgentOnboardPage() {
  const params = useParams();
  const agentId = params.agentId as string;

  const { selectedAccount } = usePolkadotWalletStore();
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [stripeUrl, setStripeUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [agentData, setAgentData] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAgent = async () => {
      setIsLoading(true);
      const response = await getAgentById(agentId);
      if (response.success && response.data) {
        setAgentData(response.data);
      } else {
        setError(response.message || 'Failed to load agent information');
      }
      setIsLoading(false);
    };

    fetchAgent();
  }, [agentId]);

  const handleOnboard = async () => {
    if (!selectedAccount) {
      setError('Please connect your wallet first');
      return;
    }

    if (agentData?.ownerId &&
      agentData?.ownerId.toLowerCase() !== selectedAccount.address.toLowerCase()) {
      setError('The connected wallet does not own this agent. Please connect with the correct wallet.');
      return;
    }

    setIsOnboarding(true);
    setError(null);

    try {
      const extensions = await web3Enable('Nucleus Dashboard');
      if (extensions.length === 0) {
        throw new Error('No Polkadot extension found. Please install Polkadot.js extension.');
      }

      const message = `Onboard agent ${agentId} to Stripe Connect`;

      const injector = await web3FromSource(selectedAccount.meta.source);

      if (!injector.signer.signRaw) {
        throw new Error('Signing not supported by this wallet');
      }

      const { signature } = await injector.signer.signRaw({
        address: selectedAccount.address,
        data: message,
        type: 'bytes',
      });


      const response = await onboardAgent({
        agentId,
        signature,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to onboard agent');
      }

      if (!response.data) {
        throw new Error('No data returned from server');
      }

      setApiKey(response.data.apiKey);
      setStripeUrl(response.data.stripeOnboardingUrl);
      setIsOnboarding(false);
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err instanceof Error ? err.message : 'Failed to onboard agent');
      setIsOnboarding(false);
    }
  };

  const handleCopyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleContinueToStripe = () => {
    if (stripeUrl) {
      window.location.href = stripeUrl;
    }
  };

  useEffect(() => {
    if (!selectedAccount) {
      setError('Wallet not connected. Please connect your wallet to continue.');
    } else {
      setError(null);
    }
  }, [selectedAccount]);

  return (
    <div className="container mx-auto max-w-2xl p-6 mt-20">
      <Card>
        <CardHeader className="flex flex-col items-center gap-4 pb-6">
          <div className="p-4 bg-primary-100 dark:bg-primary-900/20 rounded-full">
            <DollarSign className="w-12 h-12 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Configure Payment Account</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Set up payment processing to start receiving payments from users
            </p>
          </div>
        </CardHeader>

        <CardBody className="space-y-6">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          )}

          {!isLoading && agentData && agentData && (
            <>
              <div className="bg-default-100 dark:bg-default-900/20 p-4 rounded-lg space-y-3">
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-default-600">Agent</h3>
                  <p className="text-base font-medium mb-1">{agentData.name}</p>
                  <p className="text-xs font-mono break-all text-default-500">{agentId}</p>
                </div>
                {agentData.ownerId && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-default-600">Owner Address</h3>
                      {selectedAccount && (
                        agentData.ownerId.toLowerCase() === selectedAccount.address.toLowerCase() ? (
                          <Chip
                            color="success"
                            variant="flat"
                            size="sm"
                            startContent={<CheckCircle2 className="w-3.5 h-3.5" />}
                          >
                            Verified
                          </Chip>
                        ) : (
                          <Chip
                            color="danger"
                            variant="flat"
                            size="sm"
                            startContent={<XCircle className="w-3.5 h-3.5" />}
                          >
                            Mismatch
                          </Chip>
                        )
                      )}
                    </div>
                    <p className="text-sm font-mono break-all px-3 py-2 bg-default-100 rounded-lg border border-default-200">
                      {agentData.ownerId}
                    </p>
                  </div>
                )}
              </div>



              {!isLoading && agentData && (
                <>
                  {agentData.stripeAccountId && agentData.chargesEnabled && (
                    <Card className="border-success bg-success-50/50">
                      <CardBody className="gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 p-2 bg-success rounded-lg">
                            <CheckCircle className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold mb-1">
                              Payment Account Active
                            </h4>
                            <p className="text-sm text-foreground-700">
                              Your Stripe account is fully configured and ready to receive payments from users.
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Link href={`/agent/${agentId}`}>
                            <Button
                              color="success"
                              variant="flat"
                              startContent={<ArrowLeft className="w-4 h-4" />}
                            >
                              Back to Agent Details
                            </Button>
                          </Link>
                        </div>
                      </CardBody>
                    </Card>
                  )}

                  {agentData.stripeAccountId && !agentData.chargesEnabled && (
                    <Card className="border-warning bg-warning-50/50">
                      <CardBody className="gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 p-2 bg-warning rounded-lg">
                            <AlertCircle className="w-6 h-6" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <h4 className="text-lg font-bold text-warning">
                              Verification In Progress
                            </h4>
                            <p className="text-sm">
                              Your Stripe account is connected but pending verification. Please complete any outstanding requirements in your Stripe dashboard.
                            </p>
                            <div className="mt-3">
                              <h5 className="text-sm font-semibold mb-2">What&apos;s Next:</h5>
                              <ul className="text-sm space-y-1 ml-4 list-disc">
                                <li>Check your Stripe dashboard for pending actions</li>
                                <li>Complete business information verification</li>
                                <li>Verify bank account details</li>
                                <li>Submit any required documents</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-3">
                          <Link href={`/agent/${agentId}`}>
                            <Button
                              color="warning"
                              variant="flat"
                              startContent={<ArrowLeft className="w-4 h-4" />}
                            >
                              Back to Agent Details
                            </Button>
                          </Link>
                          <Button
                            color="primary"
                            variant="solid"
                            onPress={handleOnboard}
                            isLoading={isOnboarding}
                            isDisabled={!selectedAccount || isOnboarding}
                          >
                            {isOnboarding ? 'Processing...' : 'Resume Verification'}
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  )}
                </>
              )}

              {selectedAccount && agentData.ownerId &&
                agentData.ownerId.toLowerCase() !== selectedAccount.address.toLowerCase() && (
                  <Card className="border-danger bg-danger-50/50">
                    <CardBody className="gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 p-2 bg-danger rounded-lg">
                          <XCircle className="w-5 h-5 text-danger-foreground" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <h4 className="text-base font-bold text-danger-foreground">
                            Wrong Wallet Connected
                          </h4>
                          <p className="text-sm text-foreground-600">
                            The connected wallet is not the owner of this agent. Please switch to the correct wallet.
                          </p>
                        </div>
                      </div>

                      <Card shadow="none" className="border-danger-200">
                        <CardBody className="gap-3 py-3">
                          <div>
                            <p className="text-xs font-semibold text-danger mb-1">Connected Wallet:</p>
                            <p className="text-sm font-mono break-all">
                              {selectedAccount.address}
                            </p>
                          </div>
                          <div className="border-t border-divider pt-3">
                            <p className="text-xs font-semibold text-success mb-1">Required Owner:</p>
                            <p className="text-sm font-mono break-all">
                              {agentData.ownerId}
                            </p>
                          </div>
                        </CardBody>
                      </Card>

                      <p className="text-sm font-medium text-danger">
                        → Please switch to the owner wallet to continue
                      </p>
                    </CardBody>
                  </Card>
                )}
            </>
          )}

          {!isLoading && agentData && !apiKey && !agentData.stripeAccountId && (
            <div className="space-y-3">
              <h3 className="font-semibold">Configuration Steps:</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Wallet Signature Verification</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Confirm you are the owner of this agent
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-warning flex items-center justify-center text-white text-xs flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-warning-700 dark:text-warning-400">⚠️ Save API Key (Shown only once!)</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This is your payment credential needed when users pay
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Complete Stripe Account Setup</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Provide business information and bank account details
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center text-white text-xs flex-shrink-0">
                    ✓
                  </div>
                  <div>
                    <p className="font-medium text-success-700 dark:text-success-400">Start Receiving Payments</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your agent can charge users, funds automatically transfer to your account
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {apiKey && (
            <Card className="border-warning bg-warning-50/50">
              <CardBody className="gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 bg-warning rounded-lg">
                    <AlertCircle className="w-6 h-6 text-warning" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="text-lg font-bold text-warning">
                      ⚠️ IMPORTANT: Save Your API Key Now
                    </h4>
                    <div className="space-y-1 text-sm text-foreground-700">
                      <p className="font-semibold">This key is <span className="text-warning underline">shown only once</span> and cannot be recovered!</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Used to verify your agent&apos;s identity</li>
                        <li>Required credential when users make payments</li>
                        <li>If lost, you&apos;ll need to reconfigure Stripe</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Card shadow="none" className="border-warning-300 bg-white dark:bg-black">
                  <CardBody className="py-3">
                    <div className="flex items-center gap-2">
                      <code className="text-sm break-all font-mono flex-1 select-all">{apiKey}</code>
                      <Button
                        size="sm"
                        variant="flat"
                        color={copied ? "success" : "warning"}
                        isIconOnly
                        onPress={handleCopyApiKey}
                        className="flex-shrink-0"
                      >
                        {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardBody>
                </Card>

                <div className="bg-warning-100 dark:bg-warning-900/20 p-3 rounded-lg border border-warning-300">
                  <p className="text-sm font-medium text-warning">
                    💡 Recommendation: Save this key in a secure password manager or environment variable
                  </p>
                </div>

                <Button
                  color="primary"
                  size="lg"
                  endContent={<ArrowRight className="w-5 h-5" />}
                  onPress={handleContinueToStripe}
                  className="w-full"
                  isDisabled={!stripeUrl}
                >
                  I&apos;ve Saved the Key - Continue to Payment Setup
                </Button>
              </CardBody>
            </Card>
          )}

          {error && !apiKey && (
            <Alert
              color="danger"
              variant="flat"
              title="Error"
              description={error}
            />
          )}

          {!apiKey && !agentData?.stripeAccountId && (
            <div className="flex gap-3 justify-end pt-4">
              <Button
                color="primary"
                endContent={<ArrowRight className="w-4 h-4" />}
                onPress={handleOnboard}
                isLoading={isOnboarding}
                isDisabled={
                  isLoading ||
                  !selectedAccount ||
                  isOnboarding ||
                  !agentData ||
                  Boolean(agentData?.ownerId &&
                    agentData?.ownerId.toLowerCase() !== selectedAccount.address.toLowerCase())
                }
              >
                {isOnboarding ? 'Verifying Signature...' : 'Start Configuration'}
              </Button>
            </div>
          )}

          {!apiKey && (
            <Card className="border-primary">
              <CardBody className="gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 bg-primary rounded-lg">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="text-base font-bold">
                      Secure Payment Processing
                    </h4>
                    <ul className="text-sm text-foreground-600 space-y-1">
                      <li>• Powered by Stripe, industry-leading security standards</li>
                      <li>• Bank-level encryption protects all transactions</li>
                      <li>• Transparent fee structure with no hidden charges</li>
                      <li>• Funds deposited directly to your bank account</li>
                    </ul>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
