import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Form,
  Modal,
  ModalHeader,
  ModalBody,
  ModalContent,
  useDisclosure,
} from "@heroui/react";
import {
  ButtonWithTooltip,
  insertMarkdown$,
  usePublisher,
} from "@mdxeditor/editor";
import { useCallback } from "react";
import { toast } from "react-toastify";

import { Controller, useForm } from "react-hook-form";
import { debounce, formatAddress } from "@/utils/tools";
import { useMentions } from "./mentionCtx";
import { AtSignIcon } from "lucide-react";

export interface FormData {
  address: string;
}

export interface Mention {
  name: string;
  address: string;
}

export default function AddMention() {
  const insertMarkdown = usePublisher(insertMarkdown$);
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const { control, handleSubmit, reset } = useForm<FormData>({
    defaultValues: {
      address: "",
    },
  });

  const { accounts } = useMentions();

  const onSubmit = useCallback(
    (data: FormData) => {
      try {
        console.log("data", data);
        const account = accounts.find((it) => it.address === data.address);
        if (!account) {
          throw new Error("Account not found");
        }
        insertMarkdown(`@${account.address}`);
        onClose();
        reset();
      } catch {
        toast.error("Can't Add your Mention, try again.");
      }
    },
    [accounts, insertMarkdown, reset, onClose]
  );

  return (
    <>
      <ButtonWithTooltip onClick={() => onOpen()} title="Add mention">
        <AtSignIcon width={20} height={20} />
      </ButtonWithTooltip>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        classNames={{
          body: "max-h-[85vh] overflow-y-auto md:max-h-[95vh]",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Add mention</ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-2">
                  <Form>
                    <Controller
                      name="address"
                      control={control}
                      rules={{
                        required: "Please enter a account name or address",
                      }}
                      render={({ field, fieldState }) => (
                        <Autocomplete
                          {...field}
                          startContent={<AtSignIcon />}
                          label="Account Name or Address"
                          labelPlacement="outside"
                          placeholder="Enter your account name or address"
                          isInvalid={!!fieldState.error}
                          errorMessage={fieldState.error?.message}
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                          }}
                          onInputChange={debounce((value) => {
                            if (value === field.value) return;
                          }, 500)}
                          onSelectionChange={(value) => {
                            field.onChange(value);
                          }}
                        >
                          {accounts
                            .filter((it) => it.address)
                            .map((it) => (
                              <AutocompleteItem key={it.address}>
                                {`${it.name} (${formatAddress(it.address)})`}
                              </AutocompleteItem>
                            ))}
                        </Autocomplete>
                      )}
                    />
                    <div className="flex justify-end items-center w-full gap-2">
                      <Button type="reset" onPress={() => onClose()}>
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onPress={() => handleSubmit(onSubmit)()}
                      >
                        Insert
                      </Button>
                    </div>
                  </Form>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
