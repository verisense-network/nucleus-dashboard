'use client';

import { Button } from '@heroui/react';
import { DollarSign, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StripeOnboardButtonProps {
  agentId: string;
  isOnboarded?: boolean;
  variant?: 'solid' | 'bordered' | 'light' | 'flat';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function StripeOnboardButton({
  agentId,
  isOnboarded = false,
  variant = 'flat',
  size = 'sm',
  className = '',
}: StripeOnboardButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/agent/${agentId}/onboard`);
  };

  if (isOnboarded) {
    return (
      <Button
        size={size}
        variant="light"
        color="success"
        startContent={<CheckCircle className="w-4 h-4" />}
        className={className}
        isDisabled
      >
        Stripe Connected
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant={variant}
      color="primary"
      startContent={<DollarSign className="w-4 h-4" />}
      onPress={handleClick}
      className={className}
    >
      Connect Stripe
    </Button>
  );
}
