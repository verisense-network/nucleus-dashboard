import {
  Button,
  Divider,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  Spinner,
} from "@heroui/react";
import {
  ButtonWithTooltip,
  insertImage$,
  InsertImageParameters,
  SrcImageParameters,
  usePublisher,
} from "@mdxeditor/editor";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";

import Dropzone, { FileRejection } from "react-dropzone";
// import { uploadImage } from "@/app/actions";
import { Controller, useForm } from "react-hook-form";
import { ImageUpIcon } from "lucide-react";
import Image from "next/image";
import { MAX_IMAGE_SIZE, UPLOAD_IMAGE_ACCEPT } from "@/utils/tools";

export default function AddImage() {
  const insertImage = usePublisher(insertImage$);
  const [openImageDialog, seOpenImageDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const { control, watch, handleSubmit, setValue, reset } =
    useForm<InsertImageParameters>({
      defaultValues: {
        src: "",
        altText: "",
      },
    });

  const imageSrc = watch("src");
  const imageAltText = watch("altText");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const image = acceptedFiles[0];
      if (!image) return;

      const toastId = toast.loading("Uploading image");
      try {
        setLoading(true);

        // const { success, data: url, message } = await uploadImage(image);
        // if (!success) {
        //   throw new Error(`failed: ${message}`);
        // }
        // setValue("src", url);
        setValue("altText", image.name);
        toast.update(toastId, {
          render: `Upload Complete`,
          type: "success",
          isLoading: false,
          autoClose: 1500,
        });
        setLoading(false);
      } catch (e: any) {
        toast.update(toastId, {
          render: `failed to upload image: ${e?.message || e?.toString()}`,
          type: "error",
          isLoading: false,
          autoClose: 2000,
        });
        setLoading(false);
      }
    },
    [setValue]
  );

  const onDropRejected = useCallback(
    (fileRejections: FileRejection[], _event: any) => {
      console.log("fileRejections", fileRejections);
      const errorMessage = fileRejections[0].errors?.[0]?.message;
      toast.error(errorMessage);
    },
    []
  );

  const onSubmit = useCallback(
    (data: InsertImageParameters) => {
      try {
        setLoading(true);
        insertImage({
          src: (data as SrcImageParameters).src,
          altText: data.altText,
          title: data.title,
        });
        setLoading(false);
        seOpenImageDialog(false);
        reset();
      } catch {
        setLoading(false);
        toast.error("Can't Add your Image, try again.");
      }
    },
    [insertImage, reset]
  );

  return (
    <>
      <ButtonWithTooltip
        onClick={() => seOpenImageDialog(true)}
        title="Add image"
      >
        <ImageUpIcon width={20} height={20} />
      </ButtonWithTooltip>

      <Modal
        isOpen={openImageDialog}
        onOpenChange={() => seOpenImageDialog(false)}
        classNames={{
          body: "max-h-[85vh] overflow-y-auto md:max-h-[95vh]",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <ModalBody>
              <div className="flex flex-col gap-2">
                <Dropzone
                  accept={UPLOAD_IMAGE_ACCEPT}
                  maxSize={MAX_IMAGE_SIZE}
                  maxFiles={1}
                  onDrop={onDrop}
                  onDropRejected={onDropRejected}
                >
                  {({ getRootProps, getInputProps }) => (
                    <section>
                      <div
                        {...getRootProps()}
                        className="flex flex-col justify-center items-center w-full"
                      >
                        <input {...getInputProps()} />
                        <div className="my-2 flex flex-col justify-center items-center w-full">
                          {loading && <Spinner />}
                          {!loading && !imageSrc && (
                            <ImageUpIcon width={100} height={100} />
                          )}
                          {imageSrc && (
                            <Image
                              src={imageSrc}
                              width={100}
                              height={100}
                              alt={imageAltText || ""}
                            />
                          )}
                        </div>
                        <p className="text-center text-xs">
                          Drag & drop some files here, or click to select files
                        </p>
                        <Button
                          className="mt-2 pointer-events-none"
                          variant="bordered"
                          size="sm"
                        >
                          Upload
                        </Button>
                      </div>
                    </section>
                  )}
                </Dropzone>
                <Divider className="my-4" />
                <Form>
                  <Controller
                    control={control}
                    name="src"
                    rules={{
                      required: "Image source is required",
                      validate: (value) => {
                        if (value.includes(" ")) {
                          return "Image source cannot contain spaces";
                        } else if (!value.startsWith("http")) {
                          return "Image source must start with http or https";
                        }
                        return true;
                      },
                    }}
                    render={({ field, fieldState }) => (
                      <Input
                        {...field}
                        labelPlacement="outside"
                        label="Image Link"
                        placeholder="Image Link"
                        isInvalid={!!fieldState.error}
                        errorMessage={fieldState.error?.message}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="altText"
                    rules={{
                      required: "Image title is required",
                    }}
                    render={({ field, fieldState }) => (
                      <Input
                        {...field}
                        labelPlacement="outside"
                        label="Image Title"
                        placeholder="Image Title"
                        isInvalid={!!fieldState.error}
                        errorMessage={fieldState.error?.message}
                      />
                    )}
                  />
                  <div className="flex justify-end items-center w-full gap-2">
                    <Button
                      type="reset"
                      onPress={() => seOpenImageDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      isLoading={loading}
                      isDisabled={loading || !imageSrc}
                      type="button"
                      onPress={() => handleSubmit(onSubmit)()}
                    >
                      {loading ? "Uploading" : "Insert"}
                    </Button>
                  </div>
                </Form>
              </div>
            </ModalBody>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
