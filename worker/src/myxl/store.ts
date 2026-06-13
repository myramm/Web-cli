export function storeActionHref(actionType: string, actionParam: string): string | null {
  if (actionType === "PDP") return `/packages/by-option?code=${encodeURIComponent(actionParam)}`;
  if (actionType === "PLP") return `/packages/by-family?code=${encodeURIComponent(actionParam)}`;
  return null;
}

export function formatStoreSegments(res: Record<string, unknown> | null) {
  const segments: Array<{
    title: string;
    banners: Array<Record<string, unknown>>;
  }> = [];
  if (!res) return segments;
  const rawSegs = ((res.data as Record<string, unknown>)?.store_segments as unknown[]) ?? [];
  for (const s of rawSegs) {
    const seg = s as Record<string, unknown>;
    const banners = ((seg.banners as unknown[]) ?? []).map((b) => {
      const banner = b as Record<string, unknown>;
      const actionType = String(banner.action_type ?? "");
      const actionParam = String(banner.action_param ?? "");
      return {
        title: banner.title ?? "-",
        family_name: banner.family_name ?? "",
        validity: banner.validity ?? "",
        price: banner.discounted_price,
        original_price: banner.original_price,
        image_url: banner.image_url ?? banner.background_image_url,
        href: storeActionHref(actionType, actionParam),
        action_type: actionType,
        has_href: Boolean(storeActionHref(actionType, actionParam)),
      };
    });
    segments.push({ title: String(seg.title ?? "-"), banners });
  }
  return segments;
}

export function formatStoreFamilies(res: Record<string, unknown> | null) {
  const families: Array<{ label: string; id: string; icon: string; has_icon: boolean }> = [];
  if (!res) return families;
  for (const f of ((res.data as Record<string, unknown>)?.results as unknown[]) ?? []) {
    const row = f as Record<string, unknown>;
    const icon = String(row.icon_url ?? row.icon ?? "");
    families.push({
      label: String(row.label ?? "-"),
      id: String(row.id ?? ""),
      icon,
      has_icon: Boolean(icon),
    });
  }
  return families;
}

export function formatStorePackages(res: Record<string, unknown> | null) {
  const packages: Array<Record<string, unknown>> = [];
  if (!res) return packages;
  for (const p of ((res.data as Record<string, unknown>)?.results_price_only as unknown[]) ?? []) {
    const row = p as Record<string, unknown>;
    const original = Number(row.original_price ?? 0) || 0;
    const discounted = Number(row.discounted_price ?? 0) || 0;
    const actionType = String(row.action_type ?? "");
    const actionParam = String(row.action_param ?? "");
    const href = storeActionHref(actionType, actionParam);
    packages.push({
      title: row.title ?? "-",
      family_name: row.family_name ?? "",
      original_price: original,
      price: discounted > 0 ? discounted : original,
      has_discount: discounted > 0 && discounted !== original,
      validity: row.validity ?? "",
      href,
      has_href: Boolean(href),
    });
  }
  return packages;
}

export function formatRedeemables(res: Record<string, unknown> | null) {
  const categories: Array<Record<string, unknown>> = [];
  if (!res) return categories;
  const data = res.data;
  const cats = (typeof data === "object" && data && "categories" in (data as object)
    ? (data as Record<string, unknown>).categories
    : []) as unknown[];
  for (const c of cats ?? []) {
    const cat = c as Record<string, unknown>;
    const items = ((cat.redeemables as unknown[]) ?? []).map((r) => {
      const item = r as Record<string, unknown>;
      const vu = item.valid_until;
      let validUntil = "";
      if (vu != null) {
        try {
          validUntil = new Date(Number(vu) * 1000).toISOString().slice(0, 10);
        } catch {
          validUntil = String(vu);
        }
      }
      const actionType = String(item.action_type ?? "");
      const actionParam = String(item.action_param ?? "");
      const href = storeActionHref(actionType, actionParam);
      return {
        name: item.name ?? "-",
        valid_until: validUntil,
        has_valid_until: Boolean(validUntil),
        icon: item.icon_url ?? item.image_url,
        has_icon: Boolean(item.icon_url ?? item.image_url),
        action_type: actionType,
        href,
        has_href: Boolean(href),
      };
    });
    categories.push({
      name: cat.category_name ?? "-",
      code: cat.category_code ?? "",
      redeem_items: items,
      has_items: items.length > 0,
    });
  }
  return categories;
}