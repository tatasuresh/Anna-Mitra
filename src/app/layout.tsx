import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '@/lib/auth';
import { getSessionUser } from '@/lib/session';
import AppShell from "@/components/AppShell";
import { NexenInspector } from '@/components/_internal/NexenInspector';

export const metadata: Metadata = {
  title: "App",
  description: "Generated preview",
};

/** Who is signed in, read on the SERVER from the session cookie and handed to the
 *  client AuthProvider, so the first browser render matches the server's (no
 *  hydration mismatch) and the user survives a reload. Rendered by the pipeline. */
async function NexenAuthRoot({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser().catch(() => null);
  return (
    <AuthProvider
      initialUser={user ? { id: user.id, email: user.email, name: user.name ?? '', role: user.role ?? '' } : null}
    >
      {children}
    </AuthProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html data-nexen-component="nx_app_layout" lang="en">
      <body className="font-sans">
				<NexenInspector /><NexenAuthRoot><AppShell>{children}</AppShell></NexenAuthRoot></body>
    </html>
  );
}
