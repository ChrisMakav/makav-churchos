import { PageHeader } from "@/components/patterns/page-header";
import { VehicleForm } from "../vehicle-form";

export default function NouveauVehiculePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Ajouter un véhicule" />
      <VehicleForm />
    </div>
  );
}
