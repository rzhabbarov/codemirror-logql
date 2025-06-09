export const labelCache = new Map<string, { timestamp: number; data: string[] }>();
export const valueCache = new Map<string, Map<string, { timestamp: number; data: string[] }>>();

export function clearCache(): void {
  labelCache.clear();
  valueCache.clear();
}

export function clearLabelCache(url?: string): void {
  if (url) {
    labelCache.delete(url);
  } else {
    labelCache.clear();
  }
}

export function clearValueCache(url?: string, label?: string): void {
  if (url && valueCache.has(url)) {
    if (label) {
      valueCache.get(url)?.delete(label);
    } else {
      valueCache.delete(url);
    }
  } else {
    valueCache.clear();
  }
}

export async function fetchLabels(
  lokiUrl: string, 
  fetchOptions?: RequestInit,
  cacheDuration = 300_000
): Promise<string[]> {
  const cacheKey = lokiUrl;
  const now = Date.now();
  
  if (labelCache.has(cacheKey)) {
    const entry = labelCache.get(cacheKey)!;
    if (now - entry.timestamp < cacheDuration) {
      return entry.data;
    }
  }
  
  try {
    const response = await fetch(`${lokiUrl}/loki/api/v1/labels`, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`Loki API error: ${response.status} ${response.statusText}`);
    }
    
    const { data } = await response.json();
    
    labelCache.set(cacheKey, {
      timestamp: now,
      data
    });
    
    return data;
  } catch (error) {
    console.error("Loki labels fetch error:", error);
    return [];
  }
}

export async function fetchLabelValues(
  lokiUrl: string,
  label: string,
  fetchOptions?: RequestInit,
  cacheDuration = 300_000
): Promise<string[]> {
  const now = Date.now();
  
  if (!valueCache.has(lokiUrl)) {
    valueCache.set(lokiUrl, new Map());
  }
  const urlCache = valueCache.get(lokiUrl)!;
  
  if (urlCache.has(label)) {
    const entry = urlCache.get(label)!;
    if (now - entry.timestamp < cacheDuration) {
      return entry.data;
    }
  }
  
  try {
    const response = await fetch(
      `${lokiUrl}/loki/api/v1/label/${label}/values`,
      fetchOptions
    );
    
    if (!response.ok) {
      throw new Error(`Loki API error: ${response.status} ${response.statusText}`);
    }
    
    const { data } = await response.json();
    
    urlCache.set(label, {
      timestamp: now,
      data
    });
    
    return data;
  } catch (error) {
    console.error("Loki values fetch error:", error);
    return [];
  }
}