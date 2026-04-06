import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#050505",
};

export const metadata: Metadata = {
  title: "Spike AI — AI Cinema Streaming",
  description: "The world's first streaming platform for AI-generated cinema. Watch groundbreaking films created entirely by artificial intelligence.",
  manifest: "/manifest.json",
  metadataBase: new URL("https://www.spikeai.studio"),
  openGraph: {
    title: "Spike AI — AI Cinema Streaming",
    description: "The world's first streaming platform for AI-generated cinema.",
    url: "https://www.spikeai.studio",
    siteName: "Spike AI",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Spike AI — The Future of Cinema",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Spike AI — AI Cinema Streaming",
    description: "Watch groundbreaking films created entirely by artificial intelligence.",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Spike AI",
    startupImage: "/icons/icon-512.png",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  keywords: ["AI cinema", "AI movies", "AI generated films", "Sora", "Runway", "streaming", "AI art"],
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={inter.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        {children}
        {/* Service Worker Registration */}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) { console.log('SW registered:', reg.scope); })
                    .catch(function(err) { console.log('SW failed:', err); });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
