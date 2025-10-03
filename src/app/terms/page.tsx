export const metadata = {
  title: "Terms of Service — BoilerKitt",
  description: "The terms under which BoilerKitt is provided, including acceptable use and subscriptions.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-slate-100">
      <h1 className="text-3xl font-semibold text-white">Terms of Service</h1>
      <p className="mt-3 text-sm text-[var(--muted)]">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="prose prose-invert mt-8 max-w-none text-[15px] leading-relaxed">
        <p>
          These sample terms govern your use of the BoilerKitt boilerplate. Replace this with your
          company’s terms before production use.
        </p>

        <h2>Use of Service</h2>
        <ul>
          <li>You must comply with applicable laws and these terms.</li>
          <li>No abuse, reverse engineering of third‑party services, or unauthorized access.</li>
        </ul>

        <h2>Accounts</h2>
        <ul>
          <li>You are responsible for activity under your account and maintaining credential security.</li>
        </ul>

        <h2>Subscriptions & Billing</h2>
        <ul>
          <li>Paid plans are handled by Stripe. Pricing and plan details are shown at checkout.</li>
          <li>Cancellations and plan changes can be managed via the Stripe Customer Portal.</li>
        </ul>

        <h2>Intellectual Property</h2>
        <p>BoilerKitt is MIT‑licensed. Your own product code and content remain yours.</p>

        <h2>Disclaimers</h2>
        <p>
          The boilerplate is provided “as is” without warranties. We disclaim all implied warranties to
          the extent permitted by law.
        </p>

        <h2>Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, liability is limited to the amounts paid for the
          service during the 12 months preceding the claim.
        </p>

        <h2>Changes</h2>
        <p>We may update these terms. Material changes will be communicated on this page.</p>

        <h2>Contact</h2>
        <p>Set your contact email or support URL here.</p>

        <p className="mt-6 text-xs italic text-[var(--muted)]">
          This template is provided for convenience only and does not constitute legal advice.
        </p>
      </div>
    </div>
  );
}

