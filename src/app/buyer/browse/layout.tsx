export const metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
