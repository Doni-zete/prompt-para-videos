export type ApiProduct = {
  id: string;
  name: string;
  category: string;
  affiliateUrl: string;
  price: number | null;
  originalPrice: number | null;
  imageUrl?: string | null;
  priceCondition?: string;
  basePrice?: number | null;
  commission?: number | null;
  commissionRate?: number | null;
  sellerCommissionRate?: number | null;
  shopeeCommissionRate?: number | null;
  shopName?: string;
  sales?: number | null;
  sourceItemId?: string | null;
  createdAt: string;
};
export type ShopeeOffer = {
  itemId: string;
  name: string;
  affiliateUrl: string;
  price: number | null;
  basePrice?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
  commission: number | null;
  commissionRate: number | null;
  sellerCommissionRate?: number | null;
  shopeeCommissionRate?: number | null;
  imageUrl: string | null;
  shopName: string | null;
  sales: number | null;
};

export type ApiGroup = { id: string; name: string; chatId: string; active: boolean; createdAt: string };
export type ApiTemplate = { id: string; name: string; body: string; createdAt: string; updatedAt: string };
export type ApiCampaign = {
  id: string;
  groupId: string;
  groupName?: string;
  productId: string | null;
  productName: string;
  message: string;
  scheduledAt: string;
  status: "scheduled" | "sending" | "sent" | "failed" | "cancelled";
  attempts: number;
  lastError: string | null;
  createdAt: string;
  sentAt: string | null;
};
export type ApiRedirect = { code: string; shortUrl: string; targetUrl: string; clicks: number; createdAt: string };
export type ApiSession = { accessToken: string; tokenType: "Bearer"; expiresIn: string };

const apiOrigin = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
  ?.VITE_DIVULGADOR_API_URL?.replace(/\/$/, "");

export const isDivulgadorApiConfigured = Boolean(apiOrigin);

async function request<T>(path: string, accessToken?: string, body?: unknown, method = body ? "POST" : "GET", signal?: AbortSignal): Promise<T> {
  if (!apiOrigin) throw new Error("Backend do Divulgador não configurado.");

  const headers = new Headers({ accept: "application/json" });
  if (body !== undefined) headers.set("content-type", "application/json");
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);

  let response: Response;
  try {
    response = await fetch(`${apiOrigin}/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal ?? AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error(`Não foi possível conectar ao backend (${apiOrigin}). Confira se o NestJS está ativo e se CORS_ORIGIN aceita o endereço desta página.`);
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string | string[] } | null;
    const message = Array.isArray(payload?.message) ? payload.message.join(" ") : payload?.message;
    throw new Error(message || `Backend respondeu com HTTP ${response.status}.`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const divulgadorApi = {
  login: (password: string) => request<ApiSession>("/auth/session", undefined, { password }),
  products: (token: string) => request<ApiProduct[]>("/products", token),
  shopeeStatus: (token: string) => request<{ configured: boolean }>("/products/shopee/status", token),
  resolveShopeeProduct: (token: string, productUrl: string) => request<ShopeeOffer>("/products/shopee/resolve", token, { productUrl }),
  addProduct: (token: string, product: Omit<ApiProduct, "id" | "createdAt">) => request<ApiProduct>("/products", token, product),
  updateProduct: (token: string, id: string, product: Omit<ApiProduct, "id" | "createdAt">) => request<ApiProduct>(`/products/${encodeURIComponent(id)}`, token, product, "PUT"),
  deleteProduct: (token: string, id: string) => request<{ ok: true }>(`/products/${encodeURIComponent(id)}`, token, undefined, "DELETE"),
  groups: (token: string) => request<ApiGroup[]>("/telegram/groups", token),
  addGroup: (token: string, group: { name: string; chatId: string }) => request<ApiGroup>("/telegram/groups", token, group),
  deleteGroup: (token: string, id: string) => request<{ ok: true }>(`/telegram/groups/${encodeURIComponent(id)}`, token, undefined, "DELETE"),
  templates: (token: string) => request<ApiTemplate[]>("/templates", token),
  addTemplate: (token: string, template: { name: string; body: string }) => request<ApiTemplate>("/templates", token, template),
  deleteTemplate: (token: string, id: string) => request<{ ok: true }>(`/templates/${encodeURIComponent(id)}`, token, undefined, "DELETE"),
  campaigns: (token: string) => request<ApiCampaign[]>("/campaigns", token),
  addCampaign: (token: string, campaign: { groupId: string; productId?: string; productName?: string; message: string; scheduledAt: string }) => request<ApiCampaign>("/campaigns", token, campaign),
  cancelCampaign: (token: string, id: string) => request<{ ok: true }>(`/campaigns/${encodeURIComponent(id)}/cancel`, token, {}, "PATCH"),
  retryCampaign: (token: string, id: string) => request<{ ok: true }>(`/campaigns/${encodeURIComponent(id)}/retry`, token, {}),
  redirects: (token: string) => request<ApiRedirect[]>("/redirects", token),
  addRedirect: (token: string, targetUrl: string) => request<ApiRedirect>("/redirects", token, { targetUrl }),
};

export type SiteBanner = { imageUrl: string; title: string; linkUrl: string };
export type SiteSettings = {
  name: string; slug: string; description: string; telegramUrl: string; instagramUrl: string;
  logoUrl: string; accentColor: string; published: boolean; autoPublish: boolean; banners: SiteBanner[];
};
export type PublicSiteSettings = Omit<SiteSettings, "published" | "autoPublish">;
export type SiteSelection = { productId: string; featured: boolean; clicks: number };
export type SiteAdmin = { settings: SiteSettings | null; selections: SiteSelection[] };
export type SiteProduct = Omit<ApiProduct, "affiliateUrl"> & { featured: boolean; clicks: number };
export type SiteCatalog = {
  settings: PublicSiteSettings; products: SiteProduct[]; featured: SiteProduct[]; categories: string[]; total: number; page: number;
};

export function storefrontLink(slug: string) {
  return `${window.location.href.split("#")[0]}#/ofertas/${encodeURIComponent(slug)}`;
}
export function storefrontVisit(slug: string, id: string) {
  return `${apiOrigin}/api/public/storefront/${encodeURIComponent(slug)}/products/${encodeURIComponent(id)}/visit`;
}
export const storefrontApi = {
  admin: (token: string) => request<SiteAdmin>("/storefront", token),
  save: (token: string, settings: SiteSettings) => request<SiteAdmin>("/storefront", token, settings, "PUT"),
  select: (token: string, id: string, included: boolean, featured: boolean) => request<SiteAdmin>(`/storefront/products/${encodeURIComponent(id)}`, token, { included, featured }, "PUT"),
  remove: (token: string) => request<{ ok: true }>("/storefront", token, undefined, "DELETE"),
  catalog: (slug: string, search: string, category: string, page: number, signal?: AbortSignal) => request<SiteCatalog>(`/public/storefront/${encodeURIComponent(slug)}?${new URLSearchParams({ search, category, page: String(page) })}`, undefined, undefined, "GET", signal),
  detail: (slug: string, id: string, signal?: AbortSignal) => request<{ settings: PublicSiteSettings; product: SiteProduct }>(`/public/storefront/${encodeURIComponent(slug)}/products/${encodeURIComponent(id)}`, undefined, undefined, "GET", signal),
};