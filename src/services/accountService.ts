// src/services/accountService.ts
import { auth } from "@/lib/firebase";
import logger from "@/utils/logger";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Request account deletion (30-day grace period)
 */
export async function requestAccountDeletion(): Promise<void> {
    try {
        const user = auth.currentUser;

        if (!user) {
            throw new Error("No user signed in");
        }

        const idToken = await user.getIdToken();

        const response = await fetch(`${API_BASE_URL}/user/request-deletion`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${idToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to request account deletion");
        }

        logger.debug("Account deletion requested successfully");

        // Sign out the user
        await auth.signOut();
    } catch (error) {
        logger.error("Error requesting account deletion:", error);
        throw error;
    }
}

/**
 * Cancel account deletion (during 30-day window)
 */
export async function cancelAccountDeletion(): Promise<void> {
    try {
        const user = auth.currentUser;

        if (!user) {
            throw new Error("No user signed in");
        }

        const idToken = await user.getIdToken();

        const response = await fetch(`${API_BASE_URL}/user/cancel-deletion`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${idToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to cancel account deletion");
        }

        logger.debug("Account deletion cancelled successfully");
    } catch (error) {
        logger.error("Error cancelling account deletion:", error);
        throw error;
    }
}

/**
 * Download all user data (GDPR export)
 */
export async function downloadUserData(): Promise<void> {
    try {
        const user = auth.currentUser;

        if (!user) {
            throw new Error("No user signed in");
        }

        const idToken = await user.getIdToken();

        const response = await fetch(`${API_BASE_URL}/user/export-data`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${idToken}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to export user data");
        }

        // Download the ZIP file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `fram3-data-export-${new Date().toISOString().split("T")[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        logger.debug("User data downloaded successfully");
    } catch (error) {
        logger.error("Error downloading user data:", error);
        throw error;
    }
}