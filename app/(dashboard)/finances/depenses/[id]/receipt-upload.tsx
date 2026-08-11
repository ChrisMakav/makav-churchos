"use client";

import { useRef, useState, useTransition } from "react";
import { UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadExpenseReceipt } from "../../actions";

export function ReceiptUpload({
  organizationId,
  expenseId,
  hasReceipt,
}: {
  organizationId: string;
  expenseId: string;
  hasReceipt: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const formData = new FormData();
          formData.set("file", file);
          setError(null);
          startTransition(async () => {
            try {
              await uploadExpenseReceipt(organizationId, expenseId, formData);
            } catch {
              setError("Échec de l'envoi du justificatif.");
            }
          });
        }}
      />
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        <UploadIcon className="h-4 w-4" />
        {pending ? "Envoi…" : hasReceipt ? "Remplacer le justificatif" : "Ajouter un justificatif"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
