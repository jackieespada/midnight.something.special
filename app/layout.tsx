import "./globals.css";

export const metadata = {
  title: "Jackie Espada",
  description: "Bible study, music, and community — real talk, not a sermon.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <meta name='impact-site-verification' value='a7dc7ed1-58fc-41b4-a1e6-85dc1c50d403'>
      <body>{children}</body>
    </html>
  );
}
