"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

import { ImageUploader } from "@/components/ImageUploader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { analyzeCase, uploadImage } from "@/lib/api";

type UploadedImage = {
  file: File;
  previewUrl: string;
  fileToken?: string;
};

export function CaseForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [form, setForm] = useState({
    caseId: "case-new",
    age: "",
    sex: "",
    chiefComplaint: "",
    vitals: "",
    labs: "",
    medications: "",
    history: ""
  });

  useEffect(() => {
    setForm((current) => {
      if (current.caseId !== "case-new") {
        return current;
      }
      return {
        ...current,
        caseId: `case-${Date.now()}`
      };
    });
  }, []);

  const onImageAdd = async (files: FileList | null) => {
    if (!files?.length) return;

    const nextImages = await Promise.all(
      Array.from(files).map(async (file) => {
        const previewUrl = URL.createObjectURL(file);
        try {
          const upload = await uploadImage(file);
          return { file, previewUrl, fileToken: upload.file_token };
        } catch {
          return { file, previewUrl };
        }
      })
    );
    setImages((current) => [...current, ...nextImages]);
  };

  const removeImage = (previewUrl: string) => {
    setImages((current) => {
      const target = current.find((image) => image.previewUrl === previewUrl);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((image) => image.previewUrl !== previewUrl);
    });
  };

  const canSubmit =
    !submitting &&
    images.length > 0 &&
    form.age.trim() !== "" &&
    form.sex.trim() !== "" &&
    form.chiefComplaint.trim() !== "";

  const submit = async () => {
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    const payload = {
      case_id: form.caseId,
      patient_context: {
        age: Number(form.age),
        sex: form.sex,
        chief_complaint: form.chiefComplaint,
        vitals: form.vitals,
        labs: form.labs,
        medications: form.medications,
        history: form.history
      },
      images: images.map((image, index) => ({
        id: `img${index + 1}`,
        format: (image.file.name.split(".").pop() || "PNG").toUpperCase(),
        file_token: image.fileToken
      }))
    };

    try {
      await analyzeCase(payload);
      router.push(`/analysis/${form.caseId}`);
    } catch {
      router.push(`/analysis/${form.caseId}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-muted">AI Case Intake</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-950">Start a new analysis</h3>
          <p className="mt-2 text-sm text-muted">Enter the core case details, upload one chest X-ray, and send it to the AI workflow.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Case ID">
            <Input value={form.caseId} onChange={(event) => setForm({ ...form, caseId: event.target.value })} />
          </Field>
          <Field label="Age">
            <Input placeholder="Enter age" type="number" value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} />
          </Field>
          <Field label="Sex">
            <Input placeholder="M / F / Other" value={form.sex} onChange={(event) => setForm({ ...form, sex: event.target.value })} />
          </Field>
        </div>

        <Field label="Chief Complaint">
          <Input
            placeholder="Describe the main symptom or presentation"
            value={form.chiefComplaint}
            onChange={(event) => setForm({ ...form, chiefComplaint: event.target.value })}
          />
        </Field>

        <details className="rounded-[2rem] border border-border bg-slate-50 px-5 py-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-900">Optional clinical context</summary>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Vitals">
              <Textarea placeholder="Optional vitals" value={form.vitals} onChange={(event) => setForm({ ...form, vitals: event.target.value })} />
            </Field>
            <Field label="Labs">
              <Textarea placeholder="Optional labs" value={form.labs} onChange={(event) => setForm({ ...form, labs: event.target.value })} />
            </Field>
            <Field label="Medications">
              <Textarea
                placeholder="Optional medications"
                value={form.medications}
                onChange={(event) => setForm({ ...form, medications: event.target.value })}
              />
            </Field>
            <Field label="History">
              <Textarea placeholder="Optional history" value={form.history} onChange={(event) => setForm({ ...form, history: event.target.value })} />
            </Field>
          </div>
        </details>

        <div className="rounded-[2rem] border border-border bg-slate-50 p-5">
          <div>
            <h4 className="text-lg font-semibold text-slate-950">Ready state</h4>
            <p className="mt-1 text-sm text-muted">Required: age, sex, chief complaint, and one uploaded image.</p>
          </div>
          <Button className="mt-4 w-full md:w-auto" disabled={!canSubmit} onClick={submit}>
            {submitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            {submitting ? "Sending..." : "Analyze Case"}
          </Button>
        </div>
      </Card>
      <ImageUploader
        canSubmit={canSubmit}
        images={images}
        onAdd={onImageAdd}
        onRemove={removeImage}
        onSubmit={submit}
        submitting={submitting}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      {children}
    </label>
  );
}
