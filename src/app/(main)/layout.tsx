import { Navigation } from '@/components/Navigation';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </>
  );
}
