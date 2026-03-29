import { google } from "googleapis";
import { getDb } from "./db";
import { cloudStorageCredentials } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Cloud Storage Integration Module
 * Handles OAuth authentication and file uploads to Google Drive and OneDrive
 */

// Google Drive OAuth configuration
const googleAuth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL}/api/oauth/google-drive/callback`
);

// OneDrive OAuth configuration (using Microsoft Graph)
const microsoftAuthUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const microsoftTokenUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/token";

/**
 * Get Google Drive OAuth URL for user authorization
 */
export function getGoogleDriveAuthUrl(userId: number): string {
  const scopes = [
    "https://www.googleapis.com/auth/drive.file",
  ];

  const url = googleAuth.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state: `google-drive-${userId}`,
  });

  return url;
}

/**
 * Get OneDrive OAuth URL for user authorization
 */
export function getOneDriveAuthUrl(userId: number): string {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID || "",
    redirect_uri: `${process.env.APP_URL}/api/oauth/onedrive/callback`,
    response_type: "code",
    scope: "Files.ReadWrite.All offline_access",
    state: `onedrive-${userId}`,
  });

  return `${microsoftAuthUrl}?${params.toString()}`;
}

/**
 * Handle Google Drive OAuth callback
 */
export async function handleGoogleDriveCallback(
  userId: number,
  code: string
): Promise<void> {
  try {
    const { tokens } = await googleAuth.getToken(code);
    googleAuth.setCredentials(tokens);

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Save credentials to database
    await db
      .insert(cloudStorageCredentials)
      .values({
        userId,
        provider: "googleDrive",
        accessToken: tokens.access_token || "",
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        rootFolderId: "root", // Default to root folder
      })
      .onDuplicateKeyUpdate({
        set: {
          accessToken: tokens.access_token || "",
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        },
      });

    console.log(`[Google Drive] OAuth callback successful for user ${userId}`);
  } catch (error) {
    console.error("[Google Drive] OAuth callback error:", error);
    throw error;
  }
}

/**
 * Handle OneDrive OAuth callback
 */
export async function handleOneDriveCallback(
  userId: number,
  code: string
): Promise<void> {
  try {
    const params = new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID || "",
      client_secret: process.env.MICROSOFT_CLIENT_SECRET || "",
      code,
      redirect_uri: `${process.env.APP_URL}/api/oauth/onedrive/callback`,
      grant_type: "authorization_code",
    });

    const response = await fetch(microsoftTokenUrl, {
      method: "POST",
      body: params.toString(),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!response.ok) {
      throw new Error(`OneDrive token request failed: ${response.statusText}`);
    }

    const tokens = await response.json();

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Save credentials to database
    await db
      .insert(cloudStorageCredentials)
      .values({
        userId,
        provider: "oneDrive",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined,
        rootFolderId: "root",
      })
      .onDuplicateKeyUpdate({
        set: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined,
        },
      });

    console.log(`[OneDrive] OAuth callback successful for user ${userId}`);
  } catch (error) {
    console.error("[OneDrive] OAuth callback error:", error);
    throw error;
  }
}

/**
 * Upload file to Google Drive
 */
export async function uploadToGoogleDrive(
  userId: number,
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get user's Google Drive credentials
    const creds = await db
      .select()
      .from(cloudStorageCredentials)
      .where(
        and(
          eq(cloudStorageCredentials.userId, userId),
          eq(cloudStorageCredentials.provider, "googleDrive")
        )
      )
      .limit(1);

    if (!creds || creds.length === 0) {
      throw new Error("Google Drive credentials not found");
    }

    const credential = creds[0];

    // Refresh token if expired
    if (credential.expiresAt && credential.expiresAt < new Date()) {
      if (!credential.refreshToken) {
        throw new Error("Refresh token not available");
      }

      const refreshResponse = await googleAuth.refreshAccessToken();
      const tokens = refreshResponse.credentials;
      googleAuth.setCredentials(tokens);

      // Update credentials in database
      await db
        .update(cloudStorageCredentials)
        .set({
          accessToken: tokens.access_token || "",
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        })
        .where(eq(cloudStorageCredentials.id, credential.id));
    } else {
      googleAuth.setCredentials({
        access_token: credential.accessToken,
        refresh_token: credential.refreshToken,
      });
    }

    // Upload file to Google Drive
    const drive = google.drive({ version: "v3", auth: googleAuth });

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType,
        parents: [credential.rootFolderId || "root"],
      },
      media: {
        mimeType,
        body: fileBuffer as any,
      },
    });

    if (!response.data.id) {
      throw new Error("Failed to upload file to Google Drive");
    }

    const fileUrl = `https://drive.google.com/file/d/${response.data.id}/view`;
    console.log(`[Google Drive] File uploaded: ${fileUrl}`);

    return fileUrl;
  } catch (error) {
    console.error("[Google Drive] Upload error:", error);
    throw error;
  }
}

/**
 * Upload file to OneDrive
 */
export async function uploadToOneDrive(
  userId: number,
  fileName: string,
  fileBuffer: Buffer
): Promise<string> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get user's OneDrive credentials
    const creds = await db
      .select()
      .from(cloudStorageCredentials)
      .where(
        and(
          eq(cloudStorageCredentials.userId, userId),
          eq(cloudStorageCredentials.provider, "oneDrive")
        )
      )
      .limit(1);

    if (!creds || creds.length === 0) {
      throw new Error("OneDrive credentials not found");
    }

    const credential = creds[0];
    let accessToken = credential.accessToken;

    // Refresh token if expired
    if (credential.expiresAt && credential.expiresAt < new Date()) {
      if (!credential.refreshToken) {
        throw new Error("Refresh token not available");
      }

      const params = new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID || "",
        client_secret: process.env.MICROSOFT_CLIENT_SECRET || "",
        refresh_token: credential.refreshToken,
        grant_type: "refresh_token",
      });

      const response = await fetch(microsoftTokenUrl, {
        method: "POST",
        body: params.toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (!response.ok) {
        throw new Error(`OneDrive token refresh failed: ${response.statusText}`);
      }

      const tokens = await response.json();
      accessToken = tokens.access_token;

      // Update credentials in database
      await db
        .update(cloudStorageCredentials)
        .set({
          accessToken: tokens.access_token,
          expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined,
        })
        .where(eq(cloudStorageCredentials.id, credential.id));
    }

    // Upload file to OneDrive
    const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/${fileName}:/content`;

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/octet-stream",
      },
      body: fileBuffer as any,
    });

    if (!uploadResponse.ok) {
      throw new Error(`OneDrive upload failed: ${uploadResponse.statusText}`);
    }

    const uploadedFile = await uploadResponse.json();
    const fileUrl = uploadedFile.webUrl;

    console.log(`[OneDrive] File uploaded: ${fileUrl}`);

    return fileUrl;
  } catch (error) {
    console.error("[OneDrive] Upload error:", error);
    throw error;
  }
}

/**
 * Disconnect cloud storage account
 */
export async function disconnectCloudStorage(
  userId: number,
  provider: "googleDrive" | "oneDrive"
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .delete(cloudStorageCredentials)
      .where(
        and(
          eq(cloudStorageCredentials.userId, userId),
          eq(cloudStorageCredentials.provider, provider)
        )
      );

    console.log(`[Cloud Storage] Disconnected ${provider} for user ${userId}`);
  } catch (error) {
    console.error("[Cloud Storage] Disconnect error:", error);
    throw error;
  }
}
