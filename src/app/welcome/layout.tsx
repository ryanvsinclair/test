export const metadata = {
  title: 'Welcome | Carly',
  description: 'Welcome to Carly - The Ultimate Car Shopping Experience',
  robots: {
    index: false,
    follow: true,
  },
};

export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
