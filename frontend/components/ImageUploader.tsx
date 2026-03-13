"use client";

import { useId } from "react";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";

type UploadedImage = {
  file: File;
  previewUrl: string;
  fileToken?: string;
};

export function ImageUploader({
  images,
  onAdd,
  onRemove,
  onSubmit,
  submitting,
  canSubmit
}: {
  images: UploadedImage[];
  onAdd: (files: FileList | null) => void;
  onRemove: (previewUrl: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  canSubmit: boolean;
}) {
  const inputId = useId();

  return (
    <Card className="space-y-5">
      <div>
        <h3 className="text-xl font-semibold text-slate-950">Chest X-ray</h3>
        <p className="mt-1 text-sm text-muted">Upload one image and send it to the AI analysis pipeline.</p>
      </div>

      <label
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[2rem] border border-dashed border-teal-300 bg-teal-50/70 px-6 py-10 text-center"
        htmlFor={inputId}
      >
        <div className="rounded-2xl bg-white p-3 text-accent shadow-sm">
          <ImagePlus className="h-6 w-6" />
        </div>
        <div>
          <p className="font-medium text-slate-900">Drop PNG, JPG, or DICOM assets here</p>
          <p className="text-sm text-muted">The prototype stores uploads locally and streams them into the agent workflow.</p>
        </div>
        <span className={buttonVariants("default")}>Select Image</span>
        <input
          className="hidden"
          id={inputId}
          type="file"
          accept=".png,.jpg,.jpeg,.dcm"
          onChange={(event) => onAdd(event.target.files)}
        />
      </label>

      <div className="grid gap-4 xl:grid-cols-2">
        {images.length === 0 ? (
          <div className="rounded-[2rem] border border-border bg-slate-50 p-6 text-sm text-muted">
            No image uploaded yet.
          </div>
        ) : null}

        {images.map((image) => (
          <div key={image.previewUrl} className="space-y-4">
            <div className="overflow-hidden rounded-[2rem] border border-border bg-slate-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={image.file.name} className="h-full w-full object-contain" src={image.previewUrl} />
            </div>
            <div className="flex items-center justify-between rounded-[2rem] border border-border bg-slate-50 p-4">
              <div>
                <p className="font-medium text-slate-950">{image.file.name}</p>
                <p className="text-sm text-muted">{Math.round(image.file.size / 1024)} KB</p>
              </div>
              <Button variant="outline" onClick={() => onRemove(image.previewUrl)} type="button">
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-[2rem] border border-border bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium text-slate-950">Send to AI analysis</p>
          <p className="mt-1 text-sm text-muted">Core fields plus one image are required.</p>
        </div>
        <Button disabled={!canSubmit || submitting} onClick={onSubmit} type="button">
          <UploadCloud className="mr-2 h-4 w-4" />
          {submitting ? "Sending..." : "Analyze Case"}
        </Button>
      </div>
    </Card>
  );
}
