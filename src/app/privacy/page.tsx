export const metadata = {
  title: "Privacy Policy — BoilerKitt",
  description:
    "Learn how BoilerKitt handles authentication, billing, and personal data with Supabase, Stripe, and Vercel.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-slate-100">
      <h1 className="text-3xl font-semibold text-white">Privacy Policy</h1>
      <p className="mt-3 text-sm text-[var(--muted)]">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="prose prose-invert mt-8 max-w-none text-[15px] leading-relaxed">
        <p>
          This is a sample privacy policy for the BoilerKitt boilerplate. Replace this with your
          company’s policy. It explains what data is collected, how it’s used, and who it’s shared with.
        </p>

        <h2>Data We Collect</h2>
        <ul>
          <li>Authentication: Google OAuth profile (email) via Supabase Auth.</li>
          <li>Billing: Subscription and payment details processed by Stripe (no card data stored here).</li>
          <li>Operational: Basic logs/metrics via hosting (e.g., Vercel), server logs for debugging.</li>
        </ul>

        <h2>How We Use Data</h2>
        <ul>
          <li>Authenticate accounts and provide access to plan‑gated features.</li>
          <li>Process subscriptions, upgrades, and billing management via Stripe.</li>
          <li>Maintain service reliability, prevent abuse, and improve the product.</li>
        </ul>

        <h2>Sharing</h2>
        <ul>
          <li>Supabase (authentication, database), Stripe (payments), Vercel (hosting).</li>
          <li>We do not sell personal data.</li>
        </ul>

        <h2>Security</h2>
        <p>
          We use role‑based access, server‑only keys, and least‑privilege principles. Always rotate any
          exposed secrets and keep dependencies updated.
        </p>

        <h2>Retention</h2>
        <p>We retain account and billing records as required for operations and compliance.</p>

        <h2>Your Rights</h2>
        <p>Contact us to request access, correction, or deletion of your personal data.</p>

        <h2>Contact</h2>
        <p>Set your contact email or support URL here.</p>

        <p className="mt-6 text-xs italic text-[var(--muted)]">
          This template is provided for convenience only and does not constitute legal advice.
        </p>
      </div>
    </div>
  );
}

