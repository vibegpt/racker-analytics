/**
 * GEO ROUTER - Route clicks by country for affiliate links
 */

export interface GeoRoute {
  country: string;
  region?: string;
  url: string;
  label?: string;
}

export interface GeoRouterConfig {
  defaultUrl: string;
  routes: GeoRoute[];
  preserveQueryParams?: boolean;
}

export interface GeoRouteResult {
  url: string;
  matchType: "region" | "country" | "default";
  matchedCountry?: string;
  matchedRegion?: string;
}

export function resolveGeoRoute(
  config: GeoRouterConfig,
  country: string | undefined,
  region?: string,
  queryParams?: URLSearchParams
): GeoRouteResult {
  if (!country) {
    return { url: config.defaultUrl, matchType: "default" };
  }

  const normalizedCountry = country.toUpperCase();
  const normalizedRegion = region?.toUpperCase();

  // Try region match first
  if (normalizedRegion) {
    const regionMatch = config.routes.find(
      r => r.country.toUpperCase() === normalizedCountry && 
           r.region?.toUpperCase() === normalizedRegion
    );
    if (regionMatch) {
      return {
        url: regionMatch.url,
        matchType: "region",
        matchedCountry: normalizedCountry,
        matchedRegion: normalizedRegion
      };
    }
  }

  // Try country match
  const countryMatch = config.routes.find(
    r => r.country.toUpperCase() === normalizedCountry && !r.region
  );
  if (countryMatch) {
    return {
      url: countryMatch.url,
      matchType: "country",
      matchedCountry: normalizedCountry
    };
  }

  return { url: config.defaultUrl, matchType: "default" };
}

export const AMAZON_DOMAINS: { [key: string]: string } = {
  US: "amazon.com",
  GB: "amazon.co.uk",
  UK: "amazon.co.uk",
  DE: "amazon.de",
  FR: "amazon.fr",
  IT: "amazon.it",
  ES: "amazon.es",
  CA: "amazon.ca",
  AU: "amazon.com.au",
  JP: "amazon.co.jp",
  IN: "amazon.in",
  BR: "amazon.com.br",
  MX: "amazon.com.mx",
};

export function quickAmazonConfig(
  asin: string,
  tags: { [country: string]: string },
  defaultTag?: string
): GeoRouterConfig {
  const routes: GeoRoute[] = Object.entries(tags).map(([country, tag]) => {
    const domain = AMAZON_DOMAINS[country.toUpperCase()] || "amazon.com";
    return {
      country: country.toUpperCase(),
      url: \`https://\${domain}/dp/\${asin}?tag=\${tag}\`,
      label: \`Amazon \${country.toUpperCase()}\`
    };
  });

  const usTag = tags.US || defaultTag || Object.values(tags)[0];

  return {
    defaultUrl: \`https://amazon.com/dp/\${asin}?tag=\${usTag}\`,
    routes
  };
}

export function validateGeoConfig(config: GeoRouterConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.defaultUrl) {
    errors.push("defaultUrl is required");
  } else {
    try {
      new URL(config.defaultUrl);
    } catch {
      errors.push("defaultUrl is not a valid URL");
    }
  }

  if (!Array.isArray(config.routes)) {
    errors.push("routes must be an array");
  } else {
    config.routes.forEach((route, i) => {
      if (!route.country) {
        errors.push(\`Route \${i}: country is required\`);
      }
      if (!route.url) {
        errors.push(\`Route \${i}: url is required\`);
      } else {
        try {
          new URL(route.url);
        } catch {
          errors.push(\`Route \${i}: url is not a valid URL\`);
        }
      }
    });
  }

  return { valid: errors.length === 0, errors };
}
