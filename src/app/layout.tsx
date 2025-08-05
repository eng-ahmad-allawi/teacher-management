import type { Metadata } from "next";
import { cairo } from '@/lib/theme';
import ThemeProvider from '@/components/ThemeProvider';
import Navigation from '@/components/Navigation';
import "./globals.css";

export const metadata: Metadata = {
  title: "تطبيق إدارة شؤون الأستاذ",
  description: "تطبيق شامل لإدارة شؤون الأستاذ يشمل المواد والمعاهد والحسابات والمواعيد",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="إدارة الأستاذ" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={cairo.className} suppressHydrationWarning={true}>
        <ThemeProvider>
          <Navigation />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
