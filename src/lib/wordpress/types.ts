/**
 * Types for the WordPress REST API (wp/v2) with ACF fields exposed by
 * "ACF to REST API". Pass your field shape as the generic, e.g.
 * `getPageBySlug<HomeFields>("home")`.
 */

export type AcfFields = Record<string, unknown>;

export interface WPRendered {
  rendered: string;
  protected?: boolean;
}

interface WPContentBase<TAcf extends AcfFields> {
  id: number;
  date: string;
  date_gmt: string;
  modified: string;
  modified_gmt: string;
  slug: string;
  status: "publish" | "future" | "draft" | "pending" | "private";
  type: string;
  link: string;
  title: WPRendered;
  content: WPRendered;
  excerpt: WPRendered;
  author: number;
  featured_media: number;
  template: string;
  /** ACF fields. Always an object here: the helper turns WordPress's empty `[]` into `{}`. */
  acf: TAcf;
  yoast_head_json?: Record<string, unknown>;
  _embedded?: WPEmbedded;
}

export interface WPPage<TAcf extends AcfFields = AcfFields> extends WPContentBase<TAcf> {
  parent: number;
  menu_order: number;
}

export interface WPPost<TAcf extends AcfFields = AcfFields> extends WPContentBase<TAcf> {
  categories: number[];
  tags: number[];
  sticky: boolean;
  format: string;
}

export interface WPMediaSize {
  file: string;
  width: number;
  height: number;
  mime_type: string;
  source_url: string;
}

export interface WPMedia {
  id: number;
  slug: string;
  source_url: string;
  alt_text: string;
  mime_type: string;
  media_type: "image" | "file";
  caption: WPRendered;
  media_details: {
    width?: number;
    height?: number;
    file?: string;
    sizes?: Record<string, WPMediaSize>;
  };
}

export interface WPTerm {
  id: number;
  name: string;
  slug: string;
  taxonomy: string;
  link: string;
}

export interface WPAuthor {
  id: number;
  name: string;
  slug: string;
  avatar_urls?: Record<string, string>;
}

/** Present when a request is made with `embed: true` (`?_embed`). */
export interface WPEmbedded {
  author?: WPAuthor[];
  "wp:featuredmedia"?: WPMedia[];
  "wp:term"?: WPTerm[][];
}

export interface WPSiteInfo {
  name: string;
  description: string;
  url: string;
  home: string;
}

export interface WPPaginated<T> {
  items: T[];
  total: number;
  totalPages: number;
}

// --- ACF field shapes -----------------------------------------------------------

/** ACF image field with "Return Format: Image Array". Empty fields come back as `false`. */
export interface ACFImage {
  ID: number;
  id: number;
  title: string;
  filename: string;
  url: string;
  alt: string;
  caption: string;
  description: string;
  mime_type: string;
  width: number;
  height: number;
  sizes: Record<string, string | number>;
}

/** One row of an ACF flexible content field. */
export type ACFFlexibleRow<TLayout extends string, TFields> = { acf_fc_layout: TLayout } & TFields;
