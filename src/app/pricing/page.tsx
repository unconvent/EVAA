import { Pricing } from "@/components/pricing";

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-semibold">Pricing</h1>
      <p className="mt-2 text-gray-600">
        Choose the plan that fits. Switch anytime.
      </p>
      <div className="mt-8">
        <Pricing />
      </div>
    </div>
  );
}
