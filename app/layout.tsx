import "./globals.css";

export const metadata = {
  title: "The Hunt",
  description: "Anime Treasure Hunt",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}