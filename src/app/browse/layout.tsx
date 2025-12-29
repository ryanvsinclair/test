export const metadata = {
  title: 'Browse Vehicles | Carly',
  description: 'Browse thousands of verified vehicle listings. Find your perfect car with smart search and filters.',
  robots: {
    index: true, // Public and SEO-friendly
    follow: true,
  },
  alternates: {
    canonical: '/browse',
  },
};

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
