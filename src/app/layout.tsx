import type { Metadata, Viewport } from "next";
import { Geist_Mono, Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";

import { Providers } from "@/components/providers";
import { JsonLd } from "@/components/seo/json-ld";
import { getSite } from "@/lib/content/site";
import { SITE_URL } from "@/lib/site";

import "./globals.css";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const serif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: site.name, template: `%s | ${site.name}` },
    description: site.description || undefined,
    applicationName: site.name,
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: "en_US",
      url: "/",
    },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f9f7f2",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const site = await getSite();

  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} ${mono.variable} h-full antialiased`}
    >
      {/* Browser extensions (e.g. ColorZilla's cz-shortcut-listen) add attributes to <body>
          before React hydrates. This only ignores attribute differences on <body> itself. */}
      <body className="flex min-h-full flex-col overflow-x-clip" suppressHydrationWarning>
        <a
          href="#main"
          className="sr-only z-[60] rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
        >
          Skip to content
        </a>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: site.name,
            url: SITE_URL,
            ...(site.description && { description: site.description }),
          }}
        />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
