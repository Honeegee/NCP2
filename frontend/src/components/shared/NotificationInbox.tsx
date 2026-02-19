'use client';

import { Inbox } from '@novu/nextjs';
import { useAuth } from '@/lib/auth-context';

export default function NotificationInbox() {
  const { user } = useAuth();

  const applicationIdentifier = process.env.NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER;
  const backendUrl = process.env.NEXT_PUBLIC_NOVU_BACKEND_URL;
  const socketUrl = process.env.NEXT_PUBLIC_NOVU_SOCKET_URL;

  if (!user?.id || !applicationIdentifier) return null;

  return (
    <Inbox
      applicationIdentifier={applicationIdentifier}
      subscriberId={user.id}
      {...(backendUrl ? { backendUrl } : {})}
      {...(socketUrl ? { socketUrl } : {})}
      appearance={{
        variables: {
          colorBackground: 'var(--background)',
          colorForeground: 'var(--foreground)',
          colorPrimary: 'var(--primary)',
          colorPrimaryForeground: 'var(--primary-foreground)',
          colorSecondary: 'var(--secondary)',
          colorSecondaryForeground: 'var(--secondary-foreground)',
          colorCounter: 'var(--destructive)',
          colorCounterForeground: 'var(--destructive-foreground)',
          colorNeutral: 'var(--border)',
          colorShadow: 'rgba(45, 63, 58, 0.08)',
          fontSize: '14px',
        },
        elements: {},
      }}
    />
  );
}
