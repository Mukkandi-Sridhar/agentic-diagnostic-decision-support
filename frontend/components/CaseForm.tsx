"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";

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
  const [errorMessage, setErrorMessage] = useState("");
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
    setErrorMessage("");

    try {
      const nextImages = await Promise.all(
        Array.from(files).map(async (file) => {
          const previewUrl = URL.createObjectURL(file);
          const upload = await uploadImage(file);
          return { file, previewUrl, fileToken: upload.file_token };
        })
      );
      setImages((current) => [...current, ...nextImages]);
    } catch {
      setErrorMessage("Image upload failed. Please try again.");
    }
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
    setErrorMessage("");
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
      const response = await analyzeCase(payload);
      router.push(`/analysis/${response.case_id ?? form.caseId}`);
    } catch {
      setErrorMessage("Analysis could not be started. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="space-y-8">
      <div className="space-y-3">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-muted">Upload and analyze</p>
          <h3 className="mt-2 text-3xl font-semibold text-slate-950">Upload a chest X-ray and get a grounded answer</h3>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            Add the image, enter a few core clinical details, and the system will return a concise diagnostic report with evidence.
          </p>
        </div>
      </div>

      <ImageUploader images={images} onAdd={onImageAdd} onRemove={removeImage} />

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Age">
          <Input placeholder="64" type="number" value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} />
        </Field>
        <Field label="Sex">
          <Input placeholder="M / F / Other" value={form.sex} onChange={(event) => setForm({ ...form, sex: event.target.value })} />
        </Field>
        <Field label="Chief complaint">
          <Input
            placeholder="Acute dyspnea, cough, chest pain..."
            value={form.chiefComplaint}
            onChange={(event) => setForm({ ...form, chiefComplaint: event.target.value })}
          />
        </Field>
      </div>

      <details className="rounded-[2rem] border border-border bg-slate-50 px-5 py-4">
        <summary className="cursor-pointer text-sm font-medium text-slate-900">Add more clinical context</summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Vitals">
            <Textarea placeholder="BP 98/60, HR 120, SpO2 88%" value={form.vitals} onChange={(event) => setForm({ ...form, vitals: event.target.value })} />
          </Field>
          <Field label="Labs">
            <Textarea placeholder="D-dimer, troponin, BNP..." value={form.labs} onChange={(event) => setForm({ ...form, labs: event.target.value })} />
          </Field>
          <Field label="Medications">
            <Textarea
              placeholder="Current medications"
              value={form.medications}
              onChange={(event) => setForm({ ...form, medications: event.target.value })}
            />
          </Field>
          <Field label="History">
            <Textarea
              placeholder="Relevant history, recent illness, smoking, COPD..."
              value={form.history}
              onChange={(event) => setForm({ ...form, history: event.target.value })}
            />
          </Field>
        </div>
      </details>

      <div className="flex flex-col gap-4 rounded-[2rem] border border-border bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium text-slate-950">Required: one image, age, sex, and chief complaint</p>
          <p className="mt-1 text-sm text-muted">The result opens automatically when the analysis finishes.</p>
        </div>
        <Button className="min-w-44" disabled={!canSubmit} onClick={submit}>
          {submitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {submitting ? "Analyzing..." : "Analyze image"}
        </Button>
      </div>

      {errorMessage ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {errorMessage}
        </p>
      ) : null}
    </Card>
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
