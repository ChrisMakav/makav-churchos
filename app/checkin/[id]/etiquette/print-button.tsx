"use client";

import { PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button onClick={() => window.print()} className="print:hidden">
      <PrinterIcon className="h-4 w-4" />
      Imprimer les étiquettes
    </Button>
  );
}
