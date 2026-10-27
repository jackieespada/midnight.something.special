import "./globals.css";

export const metadata = {
  title: "Jackie Espada",
  description: "Bible study, music, and community — real talk, not a sermon.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
   <html lang="en">
  <head>
    <meta name="impact-site-verification" {...{ value: "YOUR-CODE" }} />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
      <body>{children}</body>
    </html>
  );
}
