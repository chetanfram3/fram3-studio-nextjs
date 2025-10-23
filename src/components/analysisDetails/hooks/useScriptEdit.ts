import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useScriptMutation } from "@/hooks/scripts/useScriptMutation";
import logger from "@/utils/logger";
import type { UseScriptEditOptions, UseScriptEditReturn } from "./types";

/**
 * useScriptEdit - Manages script editing state and operations
 * 
 * Encapsulates all editing logic in a single reusable hook
 */
export function useScriptEdit({
    scriptId,
    versionId,
    initialContent = "",
}: UseScriptEditOptions): UseScriptEditReturn {
    const router = useRouter();
    const { updateScript, isUpdating, error } = useScriptMutation();

    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState("");

    // Convert Error object to string
    const updateError = error instanceof Error ? error.message : error;

    // Initialize content when it changes
    useEffect(() => {
        if (initialContent && !isEditing) {
            setEditedContent(initialContent);
        }
    }, [initialContent, isEditing]);

    const handleEdit = useCallback(() => {
        setEditedContent(initialContent);
        setIsEditing(true);
        logger.debug("Started editing script", { scriptId, versionId });
    }, [initialContent, scriptId, versionId]);

    const handleCancel = useCallback(() => {
        setIsEditing(false);
        setEditedContent(initialContent);
        logger.debug("Cancelled editing script", { scriptId, versionId });
    }, [initialContent, scriptId, versionId]);

    const handleUpdate = useCallback(async () => {
        if (!scriptId || !editedContent.trim()) {
            logger.warn("Cannot update script - invalid data", {
                scriptId,
                hasContent: !!editedContent.trim(),
            });
            return;
        }

        logger.info("Updating script", { scriptId, versionId });

        updateScript(
            {
                scriptId,
                scriptContent: editedContent,
            },
            {
                onSuccess: (data) => {
                    setIsEditing(false);
                    logger.info("Script updated successfully", {
                        scriptId,
                        newVersionId: data.versionId,
                    });

                    // Navigate to the new version
                    router.push(`/dashboard/scripts/${scriptId}/version/${data.versionId}`);
                },
                onError: (error) => {
                    logger.error("Failed to update script", { scriptId, error });
                },
            }
        );
    }, [scriptId, versionId, editedContent, updateScript, router]);

    const handleContentChange = useCallback((content: string) => {
        setEditedContent(content);
    }, []);

    return {
        isEditing,
        editedContent,
        isUpdating,
        updateError,
        handleEdit,
        handleCancel,
        handleUpdate,
        handleContentChange,
    };
}