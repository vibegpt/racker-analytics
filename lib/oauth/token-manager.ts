import { db } from "@/lib/db";
import { refreshAccessToken } from "./utils";
import { Platform } from "./config";

/**
 * Token expiration buffer - refresh tokens this many minutes before they expire
 */
const TOKEN_EXPIRATION_BUFFER_MINUTES = 10;

/**
 * Check if an access token is expired or about to expire
 */
export function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) {
    // If no expiration date, assume it doesn't expire (some platforms)
    return false;
  }

  const now = new Date();
  const bufferMs = TOKEN_EXPIRATION_BUFFER_MINUTES * 60 * 1000;
  const expirationWithBuffer = new Date(expiresAt.getTime() - bufferMs);

  return now >= expirationWithBuffer;
}

/**
 * Get a valid access token for a social account, refreshing if necessary
 */
export async function getValidAccessToken(
  accountId: string
): Promise<{ accessToken: string; wasRefreshed: boolean }> {
  const account = await db.socialAccount.findUnique({
    where: { id: accountId },
    select: {
      id: true,
      platform: true,
      accessToken: true,
      refreshToken: true,
      expiresAt: true,
      syncStatus: true,
    },
  });

  if (!account) {
    throw new Error("Social account not found");
  }

  if (!account.accessToken) {
    throw new Error("No access token available");
  }

  if (account.syncStatus === "revoked") {
    throw new Error("Account has been revoked - re-authentication required");
  }

  // Check if token needs refresh
  if (isTokenExpired(account.expiresAt)) {
    // Token is expired or about to expire - refresh it
    if (!account.refreshToken) {
      // No refresh token available - mark as revoked
      await db.socialAccount.update({
        where: { id: accountId },
        data: {
          syncStatus: "revoked",
          syncError: "Access token expired and no refresh token available",
        },
      });
      throw new Error("Access token expired and no refresh token available");
    }

    try {
      // Refresh the token
      const tokenData = await refreshAccessToken(
        account.platform as Platform,
        account.refreshToken
      );

      // Update account with new tokens
      await db.socialAccount.update({
        where: { id: accountId },
        data: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || account.refreshToken, // Some platforms don't return new refresh token
          expiresAt: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000)
            : account.expiresAt,
          syncStatus: "active",
          syncError: null,
        },
      });

      return {
        accessToken: tokenData.access_token,
        wasRefreshed: true,
      };
    } catch (error) {
      // Refresh failed - mark account as having an error
      await db.socialAccount.update({
        where: { id: accountId },
        data: {
          syncStatus: "error",
          syncError: `Token refresh failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      });

      throw new Error(
        `Failed to refresh access token: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  // Token is still valid
  return {
    accessToken: account.accessToken,
    wasRefreshed: false,
  };
}

/**
 * Batch refresh tokens for accounts that are about to expire
 * Useful for background jobs
 */
export async function refreshExpiringTokens(userId?: string): Promise<{
  refreshed: number;
  failed: number;
  errors: Array<{ accountId: string; error: string }>;
}> {
  const now = new Date();
  const bufferMs = TOKEN_EXPIRATION_BUFFER_MINUTES * 60 * 1000;
  const expirationThreshold = new Date(now.getTime() + bufferMs);

  // Find accounts with expiring tokens
  const whereClause: any = {
    expiresAt: {
      lte: expirationThreshold,
      not: null,
    },
    refreshToken: {
      not: null,
    },
    syncStatus: {
      not: "revoked",
    },
  };

  if (userId) {
    whereClause.userId = userId;
  }

  const accounts = await db.socialAccount.findMany({
    where: whereClause,
    select: {
      id: true,
      platform: true,
      refreshToken: true,
    },
  });

  let refreshed = 0;
  let failed = 0;
  const errors: Array<{ accountId: string; error: string }> = [];

  for (const account of accounts) {
    try {
      const tokenData = await refreshAccessToken(
        account.platform as Platform,
        account.refreshToken!
      );

      await db.socialAccount.update({
        where: { id: account.id },
        data: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || account.refreshToken,
          expiresAt: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000)
            : null,
          syncStatus: "active",
          syncError: null,
        },
      });

      refreshed++;
    } catch (error) {
      failed++;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      errors.push({
        accountId: account.id,
        error: errorMessage,
      });

      await db.socialAccount.update({
        where: { id: account.id },
        data: {
          syncStatus: "error",
          syncError: `Token refresh failed: ${errorMessage}`,
        },
      });
    }
  }

  return { refreshed, failed, errors };
}

/**
 * Revoke a token and mark account as disconnected
 */
export async function revokeToken(accountId: string): Promise<void> {
  await db.socialAccount.update({
    where: { id: accountId },
    data: {
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      syncStatus: "revoked",
      syncError: "Token manually revoked by user",
    },
  });
}

/**
 * Check token health for an account
 */
export async function checkTokenHealth(accountId: string): Promise<{
  isValid: boolean;
  expiresIn: number | null; // minutes until expiration
  needsRefresh: boolean;
  status: "valid" | "expiring_soon" | "expired" | "no_token" | "revoked";
}> {
  const account = await db.socialAccount.findUnique({
    where: { id: accountId },
    select: {
      accessToken: true,
      expiresAt: true,
      syncStatus: true,
    },
  });

  if (!account) {
    throw new Error("Social account not found");
  }

  if (account.syncStatus === "revoked") {
    return {
      isValid: false,
      expiresIn: null,
      needsRefresh: false,
      status: "revoked",
    };
  }

  if (!account.accessToken) {
    return {
      isValid: false,
      expiresIn: null,
      needsRefresh: false,
      status: "no_token",
    };
  }

  if (!account.expiresAt) {
    // Token doesn't expire (some platforms)
    return {
      isValid: true,
      expiresIn: null,
      needsRefresh: false,
      status: "valid",
    };
  }

  const now = new Date();
  const expiresInMs = account.expiresAt.getTime() - now.getTime();
  const expiresInMinutes = Math.floor(expiresInMs / (60 * 1000));

  if (expiresInMs <= 0) {
    return {
      isValid: false,
      expiresIn: 0,
      needsRefresh: true,
      status: "expired",
    };
  }

  const bufferMs = TOKEN_EXPIRATION_BUFFER_MINUTES * 60 * 1000;
  if (expiresInMs <= bufferMs) {
    return {
      isValid: true,
      expiresIn: expiresInMinutes,
      needsRefresh: true,
      status: "expiring_soon",
    };
  }

  return {
    isValid: true,
    expiresIn: expiresInMinutes,
    needsRefresh: false,
    status: "valid",
  };
}
