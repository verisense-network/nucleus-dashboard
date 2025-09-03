import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";

interface TaskCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskType: 'agent' | 'mcp';
  title?: string;
  description?: string;
}

export default function TaskCompletionModal({
  isOpen,
  onClose,
  taskType,
  title,
  description,
}: TaskCompletionModalProps) {
  const defaultTitle = taskType === 'agent'
    ? "Agent Registration Task Completed! 🎉"
    : "MCP Server Registration Task Completed! 🎉";

  const defaultDescription = "Congratulations! Your registration task has been successfully completed and your airdrop eligibility has been updated.";

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="md">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">
              {title || defaultTitle}
            </h3>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="text-center space-y-3">
            <p className="text-default-600">
              {description || defaultDescription}
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onPress={onClose} className="w-full">
            Great, Got it!
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
