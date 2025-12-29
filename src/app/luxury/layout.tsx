export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function LuxuryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
