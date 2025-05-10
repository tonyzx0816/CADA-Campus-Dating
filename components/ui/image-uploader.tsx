"use client";

import React from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useDropzone} from "react-dropzone";
import {z} from "zod";
import {Input} from "@/components/ui/input";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from "@/components/ui/form";
import {Button} from "@/components/ui/button";
import {ImagePlus} from "lucide-react";
import {toast} from "sonner";
import Image from "next/image";

interface ImageUploaderProps {
    onUpload?: (file: File) => void;
    hideLabel?: boolean;
    hideSubmitButton?: boolean;
    preloadedImage?: string | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
                                                                onUpload,
                                                                hideLabel = false,
                                                                hideSubmitButton = false,
                                                                preloadedImage = null,
                                                            }) => {
    const [preview, setPreview] = React.useState<string | ArrayBuffer | null>("");

    const formSchema = z.object({
        image: z
            .instanceof(File)
            .refine((file) => file.size !== 0, "Please upload an image"),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: "onBlur",
        defaultValues: {
            image: new File([""], "filename"),
        },
    });

    const onDrop = React.useCallback(
        (acceptedFiles: File[]) => {
            const reader = new FileReader();
            try {
                reader.onload = () => setPreview(reader.result);
                reader.readAsDataURL(acceptedFiles[0]);
                form.setValue("image", acceptedFiles[0]);
                form.clearErrors("image");

                if (onUpload) {
                    onUpload(form.getValues("image"));
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                toast.error(errorMessage);
                setPreview(null);
                form.resetField("image");
            }
        },
        [form]
    );

    const {getRootProps, getInputProps, isDragActive, fileRejections} =
        useDropzone({
            onDrop,
            maxFiles: 1,
            maxSize: 6 * 1024 * 1024, // 6 MB
            accept: {"image/png": [], "image/jpg": [], "image/jpeg": []},
        });

    // const onSubmit = (values: z.infer<typeof formSchema>) => {
    //     console.log("file data", values);
    //     console.log("file img", values.image);
    //     toast.success(`Image uploaded successfully 🎉 ${values.image.name}`);
    // };


    return (
        <Form {...form}>
            <div className="space-y-2">
                <FormField
                    control={form.control}
                    name="image"
                    render={() => (
                        <FormItem className="mx-auto w-sm">

                            {!hideLabel && (
                                <FormLabel
                                    className={`text-lg font-semibold tracking-tight ${
                                        fileRejections.length !== 0 && "text-destructive"
                                    }`}
                                >
                                    Upload your image
                                </FormLabel>
                            )}

                            <FormControl>
                                <div className="mx-auto w-full max-w-xs">
                                    <div
                                        {...getRootProps()}
                                        className="mx-auto flex cursor-pointer flex-col items-center justify-center gap-y-1 rounded-lg border border-foreground p-4 shadow-sm"
                                    >
                                        <div
                                            className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg border bg-gray-100">
                                            {preview || preloadedImage ? (
                                                <Image
                                                    src={(preview as string) || preloadedImage!}
                                                    alt="Uploaded image"
                                                    layout="fill"
                                                    objectFit="cover"
                                                />
                                            ) : (
                                                <ImagePlus className="size-20 text-gray-400"/>
                                            )}

                                        </div>
                                        <Input {...getInputProps()} type="file" className="hidden"/>
                                        {isDragActive ? (
                                            <p className="text-sm">Drop the image!</p>
                                        ) : (
                                            <p className="text-sm text-gray-500">
                                                Click or drag an image to upload
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </FormControl>
                            <FormMessage>
                                {fileRejections.length !== 0 && (
                                    <span className="text-xs text-red-500">
                                        Image must be less than 1MB and of type png, jpg, or jpeg
                                    </span>
                                )}
                            </FormMessage>
                        </FormItem>
                    )}
                />

                {!hideSubmitButton && (
                    <Button
                        type="submit"
                        disabled={form.formState.isSubmitting}
                        className="mx-auto block h-auto rounded-lg px-4 py-2 text-sm"
                    >
                        Submit
                    </Button>
                )}


            </div>
        </Form>
    );
};

