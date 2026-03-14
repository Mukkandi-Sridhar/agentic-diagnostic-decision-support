"use client";

import { useId } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

type UploadedImage = {
  file: File;
  previewUrl: string;
  fileToken?: string;
};

export function ImageUploader({
  images,
  onAdd,
  onRemove,
}: {
  images: UploadedImage[];
  onAdd: (files: FileList | null) => void;
  onRemove: (previewUrl: string) => void;
}) {
  const inputId = useId();

  return (
    <Card className="space-y-5 border-dashed">
      <div>
        <h3 className="text-lg font-semibold text-slate-950">Chest X-ray</h3>
        <p className="mt-1 text-sm text-muted">Upload a PNG, JPG, JPEG, or DICOM chest image.</p>
      </div>

      <label
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[2rem] border border-dashed border-teal-300 bg-teal-50/70 px-6 py-10 text-center"
        htmlFor={inputId}
      >
        <div className="rounded-2xl bg-white p-3 text-accent shadow-sm">
          <ImagePlus className="h-6 w-6" />
        </div>
        <div>
          <p className="font-medium text-slate-900">Choose one chest X-ray image</p>
          <p className="text-sm text-muted">The uploaded image is sent to the imaging and retrieval workflow.</p>
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

      <div className="grid gap-4">
        {images.length === 0 ? (
          <div className="rounded-[2rem] border border-border bg-slate-50 p-6 text-sm text-muted">
            No image selected yet.
          </div>
        ) : null}

        {images.map((image) => (
          <div key={image.previewUrl} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
            <div className="overflow-hidden rounded-[2rem] border border-border bg-slate-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={image.file.name} className="h-64 w-full object-contain" src={image.previewUrl} />
            </div>
            <div className="flex items-center justify-between rounded-[2rem] border border-border bg-slate-50 p-4">
              <div>
                <p className="font-medium text-slate-950">{image.file.name}</p>
                <p className="text-sm text-muted">{Math.round(image.file.size / 1024)} KB</p>
              </div>
              <button
                className={buttonVariants("outline")}
                onClick={() => onRemove(image.previewUrl)}
                type="button"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
