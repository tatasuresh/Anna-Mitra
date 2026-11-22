import Link from 'next/link';
import AuthForm from '@/components/AuthForm';

const destinations = [
  {
    title: 'Sign in (Donor)',
    description: 'Post surplus food and track each donation to pickup.',
    href: '/donor-dashboard',
    linkLabel: 'Go to Donor screens',
  },
  {
    title: 'Sign in (NGO)',
    description: 'See incoming donations, claim portions and confirm receipt.',
    href: '/ngo-feed',
    linkLabel: 'Go to NGO screens',
  },
  {
    title: 'Sign in (Volunteer / NGO Transporter)',
    description: 'Take pickups and deliver food to NGOs.',
    href: '/volunteer-tasks',
    linkLabel: 'Go to Volunteer / NGO Transporter screens',
  },
  {
    title: 'Sign in (Admin)',
    description: 'Run operations, approvals and matching.',
    href: '/admin-operations',
    linkLabel: 'Go to Admin screens',
  },
  {
    title: 'Sign in (CSR Sponsor)',
    description: 'View the impact your sponsorship has made.',
    href: '/sponsor-impact',
    linkLabel: 'Go to CSR Sponsor screens',
  },
];

export default function LoginPage() {
  return (
    <div data-nexen-component="nx_app_login_page" className="ui-page">
      <div className="ui-page-header">
        <div>
          <h1 data-nexen-id="nx-0de71383-0">Sign in to Anna Mitra</h1>
          <p className="ui-meta" data-nexen-id="nx-0de71383-1">Participants sign in with their own account.</p>
        </div>
      </div>

      <section className="ui-section" data-nexen-id="nx-0de71383-2">
        <div className="ui-row flex-col md:flex-row items-stretch md:items-start">
          <div className="ui-card w-full md:flex-1 min-w-0">
            <div className="ui-card-header">
              <h2 data-nexen-id="nx-0de71383-3">Sign in</h2>
            </div>
            <div className="ui-card-body">
              <AuthForm mode="login" role="" token="" submitLabel="Sign in" />
            </div>
            <div className="ui-card-footer">
              <div className="ui-actions flex-wrap">
                <Link className="ui-link" href="/forgot-password" data-nexen-id="nx-0de71383-4">
                  Forgot password?
                </Link>
                <Link className="ui-link" href="/signup" data-nexen-id="nx-0de71383-5">
                  Create an account
                </Link>
              </div>
            </div>
          </div>

          <div className="ui-card w-full md:flex-1 min-w-0">
            <div className="ui-card-header">
              <h2 data-nexen-id="nx-0de71383-6">Where you go after sign-in</h2>
            </div>
            <div className="ui-card-body">
              <ul className="ui-list" data-nexen-id="nx-0de71383-7">
                {destinations.map((item) => (
                  <li key={item.href} className="ui-list-item flex-col sm:flex-row" data-nexen-id="nx-0de71383-8">
                    <div className="ui-list-main min-w-0">
                      <strong data-nexen-id="nx-0de71383-9">{item.title}</strong>
                      <span className="ui-meta" data-nexen-id="nx-0de71383-10">{item.description}</span>
                    </div>
                    <div className="ui-list-side">
                      <Link className="ui-link" href={item.href} data-nexen-id="nx-0de71383-11">
                        {item.linkLabel}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}