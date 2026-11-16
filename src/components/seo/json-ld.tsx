import type { Thing, WithContext } from "schema-dts";

/**
 * Renders schema.org structured data. Server Component.
 *
 *   <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: "..." }} />
 */
export function JsonLd<T extends Thing>({ data }: { data: WithContext<T> | WithContext<T>[] }) {
  return (
    <script
      type="application/ld+json"
      // Escape "<" so CMS content can't close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
