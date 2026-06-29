import type { Metadata, Viewport } from "next";
import { Outfit, DM_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "RECOMP",
  description: "Absolute Fitness Workout Tracker",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Recomp",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#08090e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${dmMono.variable}`}>
      <body className="dark">
        <div id="root-shell">{children}</div>
      </body>
    </html>
  );
}
