// components/scripts/ScriptEditor.tsx
"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Box, Paper, Fab, alpha, Typography, Button } from "@mui/material";
import {
  Message as MessageIcon,
  Description,
  Timer,
} from "@mui/icons-material";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import {
  Table,
  TableRow,
  TableCell,
  TableHeader,
} from "@tiptap/extension-table";
import { Node } from "@tiptap/core";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import EditorHeader from "./components/EditorHeader";
import EditorSidebar from "./components/EditorSidebar";
import EditorToolbar from "./components/EditorToolBar";
import FeedbackDialog from "./components/FeedbackDialog";
import CustomToast from "@/components/common/CustomToast";
import VideoProgressIndicator from "./components/VideoGeneratorDialog";
import { exportScriptToPDF } from "./components/pdfExportUtil";
import type { ScriptData } from "./types";
import DisclaimerDialog from "./components/DisclaimerDialog";
import VideoGenerationControls from "./components/VideoGenerationControls";
import type {
  ProcessingMode,
  AspectRatio,
  ModelTierConfig,
} from "@/components/common/ProcessingModeSelector";
import { processorSteps } from "@/config/constants";
import logger from "@/utils/logger";

// Custom node definitions for Tiptap
const SceneHeading = Node.create({
  name: "sceneHeading",
  content: "inline*",
  group: "block",
  defining: true,
  parseHTML() {
    return [{ tag: "div.scene-heading" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, class: "scene-heading" }, 0];
  },
});

const Character = Node.create({
  name: "character",
  content: "inline*",
  group: "block",
  defining: true,
  parseHTML() {
    return [{ tag: "div.character" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, class: "character" }, 0];
  },
});

const Dialogue = Node.create({
  name: "dialogue",
  content: "inline*",
  group: "block",
  defining: true,
  parseHTML() {
    return [{ tag: "div.dialogue" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, class: "dialogue" }, 0];
  },
});

const Parenthetical = Node.create({
  name: "parenthetical",
  content: "inline*",
  group: "block",
  defining: true,
  parseHTML() {
    return [{ tag: "div.parenthetical" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, class: "parenthetical" }, 0];
  },
});

const Transition = Node.create({
  name: "transition",
  content: "inline*",
  group: "block",
  defining: true,
  parseHTML() {
    return [{ tag: "div.transition" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, class: "transition" }, 0];
  },
});

type ScriptVersion = {
  version: number;
  date: string;
  content: string;
};

interface ScriptEditorProps {
  scriptData: Partial<ScriptData>;
  onSave?: (content: string, title: string) => Promise<boolean | void>;
  genScriptId?: string;
  versions?: Array<{
    versionNumber: number;
    scriptTitle: string;
    scriptAV: string;
    scriptNarrativeParagraph: string;
    createdAt: string;
    changeNotes: string;
    wordCount: number;
    narrativeWordCount?: number;
    estimatedDuration?: number;
    analysisGenerated?: boolean;
    analyzedScriptId?: string;
    analyzedVersionId?: string;
  }>;
  currentVersionNumber?: number;
  requestedVersionNumber?: number;
}

interface ScriptStats {
  words: number;
  characters: number;
  scenes: number;
  dialogues: number;
  pages: number;
  duration: number;
  brandNameMentioned?: boolean | null;
  ctaMentioned?: boolean | null;
  mandatoriesMentioned?: boolean | null;
}

type FeedbackSentiment = "positive" | "neutral" | "negative" | null;

const deserialize = (text: string | undefined): string => {
  if (!text || text.trim() === "") return "<p><br></p>";

  const processedContent = text
    .split("\n")
    .map((line) => {
      line = line.trim();
      if (line.match(/^(INT|EXT|INT\/EXT|SCENE)[\s.]/i))
        return `<div class="scene-heading">${line}</div>`;
      if (line.match(/^[A-Z][A-Z\s]+:?$/))
        return `<div class="character">${line}</div>`;
      if (line.match(/^\([^)]+\)$/))
        return `<div class="parenthetical">${line}</div>`;
      if (line.match(/TO:$/i)) return `<div class="transition">${line}</div>`;
      return `<p>${line}</p>`;
    })
    .join("");

  return processedContent.endsWith("</p>")
    ? processedContent
    : processedContent + "<p><br></p>";
};

const serialize = (html: string): string => {
  return html.replace(/<div class="([^"]+)">([^<]+)<\/div>/g, "$2\n").trim();
};

export default function ScriptEditor({
  scriptData,
  onSave,
  genScriptId,
  versions: propVersions,
  currentVersionNumber,
  requestedVersionNumber,
}: ScriptEditorProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  const [processingMode, setProcessingMode] =
    useState<ProcessingMode>("normal");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [pauseBeforeSettings, setPauseBeforeSettings] = useState<string[]>([
    ...processorSteps.images,
    ...processorSteps.scenes,
    ...processorSteps.audio,
    ...processorSteps.video,
  ]);
  const [modelTiers, setModelTiers] = useState<ModelTierConfig>({
    image: 4,
    audio: 4,
    video: 4,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const editorContentRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  const getInitialContent = useCallback((): string => {
    return scriptData.scriptNarrativeParagraph || "";
  }, [scriptData.scriptNarrativeParagraph]);

  const editor = useEditor({
    immediatelyRender: false, // Prevent SSR hydration mismatches
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      SceneHeading,
      Character,
      Dialogue,
      Parenthetical,
      Transition,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: deserialize(getInitialContent()),
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setValue(html);
      updateScriptStats(html);
      setHasUnsavedChanges(true);
    },
  });

  useEffect(() => {
    if (editor) {
      editor.commands.focus();
    }
  }, [editor]);

  const [value, setValue] = useState<string>(deserialize(getInitialContent()));
  const [title, setTitle] = useState(
    scriptData.scriptTitle || "Untitled Script"
  );
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeTab, setActiveTab] = useState("styles");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>("Never");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [scriptStats, setScriptStats] = useState<ScriptStats>({
    words: 0,
    characters: 0,
    scenes: 0,
    dialogues: 0,
    pages: 0,
    duration: 0,
    brandNameMentioned: undefined,
    ctaMentioned: undefined,
    mandatoriesMentioned: undefined,
  });

  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [scriptContent, setScriptContent] = useState("");
  const [scriptVersion, setScriptVersion] = useState(
    requestedVersionNumber || currentVersionNumber || 1
  );
  const [localScriptVersions, setLocalScriptVersions] = useState<
    ScriptVersion[]
  >([
    {
      version: 1,
      date: new Date().toLocaleDateString(),
      content: deserialize(getInitialContent()),
    },
  ]);

  const scriptVersions = useMemo(
    () =>
      genScriptId && propVersions
        ? propVersions.map((v) => ({
            version: v.versionNumber,
            date: new Date(v.createdAt).toLocaleDateString(),
            content: deserialize(
              v.scriptNarrativeParagraph || v.scriptAV || ""
            ),
          }))
        : localScriptVersions,
    [genScriptId, propVersions, localScriptVersions]
  );

  const setScriptVersions = useCallback(
    (updater: any) => {
      if (!genScriptId) {
        setLocalScriptVersions(updater);
      }
    },
    [genScriptId]
  );

  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackSentiment, setFeedbackSentiment] =
    useState<FeedbackSentiment>(null);
  const [references, setReferences] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] =
    useState<NodeJS.Timeout | null>(null);

  const currentVersionData = useMemo(
    () => propVersions?.find((v) => v.versionNumber === scriptVersion),
    [propVersions, scriptVersion]
  );

  const handleProcessingOptionsChange = useCallback(
    (
      mode: ProcessingMode,
      ratio: AspectRatio,
      pauseBefore: string[],
      tiers: ModelTierConfig
    ) => {
      setProcessingMode(mode);
      setAspectRatio(ratio);
      setPauseBeforeSettings(pauseBefore);
      setModelTiers(tiers);
    },
    []
  );

  // Note: localStorage is used here for disclaimer acknowledgment tracking
  // This is acceptable as it's for UI preference, not critical data storage
  const hasAcknowledgedDisclaimer = useCallback(
    (scriptId: string | null | undefined) => {
      if (!scriptId) return false;

      try {
        const acknowledgedScripts = JSON.parse(
          localStorage.getItem("acknowledgedDisclaimers") || "[]"
        );
        return acknowledgedScripts.includes(scriptId);
      } catch (error) {
        logger.error("Error checking disclaimer acknowledgment", { error });
        return false;
      }
    },
    []
  );

  const [disclaimerOpen, setDisclaimerOpen] = useState(
    !!scriptData.disclaimer &&
      !hasAcknowledgedDisclaimer(scriptData.scriptTitle)
  );

  useEffect(() => {
    if (
      scriptData.disclaimer &&
      !hasAcknowledgedDisclaimer(scriptData.scriptTitle)
    ) {
      setDisclaimerOpen(true);
    } else {
      setDisclaimerOpen(false);
    }
  }, [
    scriptData.disclaimer,
    scriptData.scriptTitle,
    hasAcknowledgedDisclaimer,
  ]);

  useEffect(() => {
    if (editor) {
      const content = scriptData.scriptNarrativeParagraph || "";
      editor.commands.setContent(deserialize(content));
      setValue(deserialize(content));
      setHasUnsavedChanges(false);
    }
  }, [editor, scriptData]);

  useEffect(() => {
    if (editorContentRef.current) {
      const style = document.createElement("style");
      style.textContent = `
        .ProseMirror {
          font-family: ${brand.fonts.body};
          font-size: ${Math.max(14, Math.round((14 * zoomLevel) / 100))}px;
          line-height: 1.6;
          color: ${theme.palette.text.primary};
        }
        .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
          margin: 10px 0;
        }
        .ProseMirror td, .ProseMirror th {
          border: 1px solid ${theme.palette.divider};
          padding: 8px;
          min-width: 50px;
          min-height: 30px;
          text-align: left;
          color: ${theme.palette.text.primary};
        }
        .ProseMirror th {
          background-color: ${theme.palette.background.default};
          font-weight: 600;
        }
        .ProseMirror .tableWrapper {
          overflow-x: auto;
        }
        .ProseMirror .scene-heading {
          font-weight: 600;
          text-transform: uppercase;
          margin: 16px 0 8px 0;
          color: ${theme.palette.text.primary};
        }
        .ProseMirror .character {
          text-align: center;
          text-transform: uppercase;
          margin: 8px 0;
          font-weight: 600;
          color: ${theme.palette.text.primary};
        }
        .ProseMirror .dialogue {
          margin: 4px 0;
          padding-left: 20%;
          padding-right: 20%;
          color: ${theme.palette.text.primary};
        }
        .ProseMirror .parenthetical {
          text-align: center;
          font-style: italic;
          margin: 4px 0;
          color: ${theme.palette.text.secondary};
        }
        .ProseMirror .transition {
          text-align: right;
          text-transform: uppercase;
          margin: 8px 0;
          font-weight: 600;
          color: ${theme.palette.text.primary};
        }
      `;
      editorContentRef.current.appendChild(style);
      styleRef.current = style;

      return () => {
        if (
          styleRef.current &&
          editorContentRef.current?.contains(styleRef.current)
        ) {
          editorContentRef.current.removeChild(styleRef.current);
        }
        styleRef.current = null;
      };
    }
  }, [editorContentRef, theme, zoomLevel, brand.fonts.body]);

  useEffect(() => {
    // Only update version if we're NOT viewing a specific version from URL
    if (!requestedVersionNumber && currentVersionNumber && propVersions) {
      const latestVersion = Math.max(
        ...propVersions.map((v) => v.versionNumber)
      );
      if (latestVersion > scriptVersion) {
        setScriptVersion(latestVersion);

        // Update the content to the latest version
        const newVersion = propVersions.find(
          (v) => v.versionNumber === latestVersion
        );
        if (newVersion) {
          const content = deserialize(
            newVersion.scriptNarrativeParagraph || newVersion.scriptAV || ""
          );
          setValue(content);
          editor?.commands.setContent(content);
          setTitle(newVersion.scriptTitle);
        }
      }
    }
  }, [
    propVersions,
    currentVersionNumber,
    requestedVersionNumber,
    scriptVersion,
    editor,
  ]);

  const updateScriptStats = useCallback(
    (html: string) => {
      const text = serialize(html);
      const words = text.split(/\s+/).filter(Boolean).length;
      const characters = text.length;
      const scenes = (html.match(/<div class="scene-heading">/g) || []).length;
      const dialogues = (html.match(/<div class="dialogue">/g) || []).length;
      const pages = Math.ceil(words / 250);
      const duration = Math.round(words / 15);

      let brandNameMentioned: boolean | null = null;
      let ctaMentioned: boolean | null = null;
      let mandatoriesMentioned: boolean | null = null;

      const potentialBrandSources = [
        scriptData.strategicContextSummary?.inferredBrandArchetype,
        scriptData.conceptSummary?.productRole,
        scriptData.scriptTitle,
      ];

      const potentialBrands = potentialBrandSources
        .filter((source) => !!source)
        .map((source) => {
          const match = String(source).match(/^([A-Za-z0-9]+)/);
          return match ? match[1] : null;
        })
        .filter((brand) => !!brand);

      if (potentialBrands.length > 0) {
        if (
          potentialBrands.some(
            (brand) => brand && text.toLowerCase().includes(brand.toLowerCase())
          )
        ) {
          brandNameMentioned = true;
        }
      }

      const ctaPhrases = [
        "call now",
        "visit",
        "click",
        "buy now",
        "order",
        "learn more",
        "sign up",
      ];
      if (ctaPhrases.some((phrase) => text.toLowerCase().includes(phrase))) {
        ctaMentioned = true;
      }

      const legalPatterns = [
        "terms and conditions",
        "restrictions apply",
        "limited time",
        "see details",
        "while supplies last",
        "*",
        "† ",
        "‡",
        "©",
      ];
      if (
        legalPatterns.some((pattern) => text.toLowerCase().includes(pattern))
      ) {
        mandatoriesMentioned = true;
      }

      const updatedStats: ScriptStats = {
        words,
        characters,
        scenes,
        dialogues,
        pages,
        duration,
        brandNameMentioned,
        ctaMentioned,
        mandatoriesMentioned,
      };

      setScriptStats(updatedStats);
    },
    [
      scriptData.strategicContextSummary,
      scriptData.conceptSummary,
      scriptData.scriptTitle,
    ]
  );

  useEffect(() => {
    updateScriptStats(value);
  }, [value, updateScriptStats]);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(e.target.value);
    },
    []
  );

  const handleTitleSubmit = useCallback(() => {
    setIsEditingTitle(false);
    if (title.trim() === "") setTitle("Untitled Script");
  }, [title]);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") handleTitleSubmit();
      else if (e.key === "Escape") {
        setIsEditingTitle(false);
        setTitle(scriptData.scriptTitle || "Untitled Script");
      }
    },
    [handleTitleSubmit, scriptData.scriptTitle]
  );

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current
        .requestFullscreen()
        .catch((err) =>
          logger.error("Error enabling fullscreen", { error: err.message })
        );
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, []);

  const handleSave = useCallback(async (): Promise<boolean> => {
    const plainTextContent = editor?.getText() || "";

    const lastVersionContent =
      scriptVersions.find((v) => v.version === scriptVersion)?.content || "";

    const lastVersionPlainText = (() => {
      const temp = document.createElement("div");
      temp.innerHTML = lastVersionContent;
      return temp.textContent || temp.innerText || "";
    })();

    if (plainTextContent.trim() === lastVersionPlainText.trim()) {
      CustomToast("info", "No changes to save");
      return false;
    }

    setIsSaving(true);

    try {
      if (genScriptId && onSave) {
        const success = await onSave(plainTextContent, title);
        const saveSucceeded = success ?? true;

        if (saveSucceeded) {
          setHasUnsavedChanges(false);
          CustomToast("success", "Changes saved successfully");
        } else {
          CustomToast("error", "Failed to save changes");
        }

        setLastSaved(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        );

        return saveSucceeded;
      } else {
        setScriptVersions((prev: ScriptVersion[]) =>
          prev.map((v) =>
            v.version === scriptVersion
              ? {
                  ...v,
                  content: value,
                  date: new Date().toLocaleDateString(),
                }
              : v
          )
        );

        if (onSave) {
          const result = await onSave(plainTextContent, title);
          const saveSucceeded = result ?? true;

          if (!saveSucceeded) {
            return false;
          }
        }

        setHasUnsavedChanges(false);
        CustomToast("success", "Changes saved successfully");

        setLastSaved(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        );

        return true;
      }
    } catch (error) {
      CustomToast("error", "Failed to save changes");
      logger.error("Error saving script", { error });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [
    editor,
    scriptVersions,
    scriptVersion,
    genScriptId,
    onSave,
    title,
    value,
    setScriptVersions,
  ]);

  const handleCreateNewVersion = useCallback(async () => {
    if (!hasUnsavedChanges) {
      CustomToast("info", "No changes to create a new version");
      return;
    }

    setIsSaving(true);

    try {
      const plainTextContent = editor?.getText() || "";

      if (genScriptId && onSave) {
        await onSave(plainTextContent, title);
        setHasUnsavedChanges(false);
        CustomToast("success", "New version created successfully");
      } else {
        const newVersion = scriptVersion + 1;

        setScriptVersions((prev: ScriptVersion[]) => [
          ...prev,
          {
            version: newVersion,
            date: new Date().toLocaleDateString(),
            content: value,
          },
        ]);

        setScriptVersion(newVersion);
        setLastSaved(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        );

        if (onSave) {
          onSave(plainTextContent, title);
        }

        setHasUnsavedChanges(false);
        CustomToast("success", `New version ${newVersion} created`);
      }
    } catch (error) {
      CustomToast("error", "Failed to create new version");
      logger.error("Error creating new version", { error });
    } finally {
      setIsSaving(false);
    }
  }, [
    hasUnsavedChanges,
    editor,
    genScriptId,
    onSave,
    title,
    scriptVersion,
    value,
    setScriptVersions,
  ]);

  const handleVersionChange = useCallback(
    (version: number) => {
      if (hasUnsavedChanges) {
        const confirmSwitch = window.confirm(
          "You have unsaved changes. Switching versions will discard these changes. Continue?"
        );
        if (!confirmSwitch) return;
      }

      const selectedVersion = propVersions?.find(
        (v) => v.versionNumber === version
      );
      if (selectedVersion) {
        setScriptVersion(version);
        const content = deserialize(
          selectedVersion.scriptNarrativeParagraph || selectedVersion.scriptAV
        );
        setValue(content);
        editor?.commands.setContent(content);
        setTitle(selectedVersion.scriptTitle);
        setHasUnsavedChanges(false);
        CustomToast("info", `Switched to Version ${version}`);
      }
    },
    [hasUnsavedChanges, propVersions, editor]
  );

  const handleFormatClick = useCallback(
    (format: string) => {
      if (!editor) return;
      switch (format) {
        case "bold":
          editor.chain().focus().toggleBold().run();
          break;
        case "italic":
          editor.chain().focus().toggleItalic().run();
          break;
        case "underline":
          editor.chain().focus().toggleUnderline().run();
          break;
        case "strikethrough":
          editor.chain().focus().toggleStrike().run();
          break;
        case "scene-heading":
          editor.chain().focus().setNode("sceneHeading").run();
          break;
        case "character":
          editor.chain().focus().setNode("character").run();
          break;
        case "dialogue":
          editor.chain().focus().setNode("dialogue").run();
          break;
        case "parenthetical":
          editor.chain().focus().setNode("parenthetical").run();
          break;
        case "transition":
          editor.chain().focus().setNode("transition").run();
          break;
        case "align-left":
          editor.chain().focus().setTextAlign("left").run();
          break;
        case "align-center":
          editor.chain().focus().setTextAlign("center").run();
          break;
        case "align-right":
          editor.chain().focus().setTextAlign("right").run();
          break;
        case "bullet-list":
          editor.chain().focus().toggleBulletList().run();
          break;
        case "ordered-list":
          editor.chain().focus().toggleOrderedList().run();
          break;
        case "create-table":
          if (editor.isActive("paragraph")) {
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run();
          } else {
            editor.commands.setNode("paragraph");
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run();
            CustomToast(
              "info",
              "Inserted table after switching to paragraph node."
            );
          }
          break;
        case "add-row":
          if (editor.isActive("table")) {
            editor.chain().focus().addRowAfter().run();
          }
          break;
        case "add-column":
          if (editor.isActive("table")) {
            editor.chain().focus().addColumnAfter().run();
          }
          break;
      }
    },
    [editor]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!editor) return;
      if (event.key === "Tab") {
        event.preventDefault();
      }
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "b":
            event.preventDefault();
            editor.chain().focus().toggleBold().run();
            break;
          case "i":
            event.preventDefault();
            editor.chain().focus().toggleItalic().run();
            break;
          case "u":
            event.preventDefault();
            editor.chain().focus().toggleUnderline().run();
            break;
          case "s":
            event.preventDefault();
            handleSave();
            break;
        }
      }
    },
    [editor, handleSave]
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    return () => {
      if (recordingInterval) clearInterval(recordingInterval);
    };
  }, [recordingInterval]);

  useEffect(() => {
    if (requestedVersionNumber && requestedVersionNumber !== scriptVersion) {
      const requestedVersionData = propVersions?.find(
        (v) => v.versionNumber === requestedVersionNumber
      );

      if (requestedVersionData) {
        setScriptVersion(requestedVersionNumber);
        const content = deserialize(
          requestedVersionData.scriptNarrativeParagraph ||
            requestedVersionData.scriptAV ||
            ""
        );
        setValue(content);
        editor?.commands.setContent(content);
        setTitle(requestedVersionData.scriptTitle);
        setHasUnsavedChanges(false);
      }
    }
  }, [requestedVersionNumber, propVersions, editor, scriptVersion]);

  const handleOpenFeedbackDialog = useCallback(
    () => setFeedbackDialogOpen(true),
    []
  );
  const handleCloseFeedbackDialog = useCallback(
    () => setFeedbackDialogOpen(false),
    []
  );

  const handleSentimentSelect = useCallback((sentiment: FeedbackSentiment) => {
    setFeedbackSentiment(sentiment);
    const messages = {
      positive: "Positive feedback recorded. What specifically did you like?",
      neutral: "Neutral feedback recorded. What could be improved?",
      negative: "Negative feedback recorded. What issues did you encounter?",
    };
    if (sentiment) CustomToast("info", messages[sentiment]);
  }, []);

  const handleAddReference = useCallback(
    () => fileInputRef.current?.click(),
    []
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const newFiles = Array.from(e.target.files);
        setReferences((prev) => [...prev, ...newFiles]);
        CustomToast("success", `${newFiles.length} reference file(s) added`);
      }
    },
    []
  );

  const handleRemoveReference = useCallback((index: number) => {
    setReferences((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const toggleVoiceRecording = useCallback(() => {
    if (isRecording) {
      setIsRecording(false);
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
      setFeedback(
        (prev) =>
          prev +
          (prev ? "\n\n" : "") +
          `[Voice note - ${recordingTime.toFixed(
            1
          )}s]: AI transcription would appear here.`
      );
      setRecordingTime(0);
      CustomToast("success", "Voice note added");
    } else {
      setIsRecording(true);
      const interval = setInterval(() => {
        setRecordingTime((prev) => prev + 0.1);
      }, 100);
      setRecordingInterval(interval);
      CustomToast("info", "Recording started");
    }
  }, [isRecording, recordingInterval, recordingTime]);

  const handleSubmitFeedback = useCallback(() => {
    if (!feedback && references.length === 0 && !feedbackSentiment) {
      CustomToast("info", "Please provide feedback, sentiment, or references");
      return;
    }
    CustomToast("success", "Feedback submitted successfully");
    setFeedbackDialogOpen(false);
    setFeedback("");
    setReferences([]);
    setFeedbackSentiment(null);
  }, [feedback, references, feedbackSentiment]);

  const handleExportPDF = useCallback(() => {
    if (isSaving) {
      CustomToast(
        "info",
        "Please wait until saving is complete before exporting"
      );
      return;
    }

    try {
      exportScriptToPDF(title, value, scriptStats, scriptVersion);
      CustomToast("success", "Script exported as PDF");
    } catch (error) {
      logger.error("PDF export error", { error });
      CustomToast("error", "Failed to export PDF. Please try again.");
    }
  }, [isSaving, title, value, scriptStats, scriptVersion]);

  const storeDisclaimerAcknowledgment = useCallback(
    (scriptId: string | null | undefined) => {
      if (!scriptId) return;

      try {
        const acknowledgedScripts = JSON.parse(
          localStorage.getItem("acknowledgedDisclaimers") || "[]"
        );

        if (!acknowledgedScripts.includes(scriptId)) {
          acknowledgedScripts.push(scriptId);
          localStorage.setItem(
            "acknowledgedDisclaimers",
            JSON.stringify(acknowledgedScripts)
          );
        }
      } catch (error) {
        logger.error("Error saving disclaimer acknowledgment", { error });
      }
    },
    []
  );

  const handleExportText = useCallback(() => {
    const serialized = serialize(value);
    const blob = new Blob([serialized], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}_v${scriptVersion}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    CustomToast("success", "Script exported as text file");
  }, [value, title, scriptVersion]);

  const handleGenerateVideo = useCallback(async () => {
    if (isSaving) {
      CustomToast("info", "Please wait until saving is complete");
      return;
    }

    const plainTextContent = editor?.getText() || "";

    if (!plainTextContent.trim()) {
      CustomToast(
        "info",
        "Please add content to your script before generating a video"
      );
      return;
    }

    if (hasUnsavedChanges) {
      try {
        const saveSuccess = await handleSave();

        if (!saveSuccess) {
          CustomToast(
            "error",
            "Failed to save script. Please save before generating video."
          );
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 500));

        setScriptContent(plainTextContent);
        setIsVideoDialogOpen(true);
      } catch (error) {
        logger.error("Error saving script", { error });
        CustomToast("error", "Failed to save script. Please try again.");
        return;
      }
    } else {
      setScriptContent(plainTextContent);
      setIsVideoDialogOpen(true);
    }
  }, [isSaving, editor, hasUnsavedChanges, handleSave]);

  const handleCloseDisclaimer = useCallback(() => {
    setDisclaimerOpen(false);
    storeDisclaimerAcknowledgment(scriptData.scriptTitle);
  }, [scriptData.scriptTitle, storeDisclaimerAcknowledgment]);

  return (
    <Box
      ref={containerRef}
      sx={{
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <Box sx={{ flex: "0 0 auto" }}>
        <Paper
          elevation={2}
          sx={{
            display: "flex",
            flexDirection: "column",
            borderRadius: `${brand.borderRadius}px`,
            overflow: "hidden",
            bgcolor: "background.default",
            minHeight: "500px",
            border: 1,
            borderColor: "divider",
          }}
        >
          <EditorHeader
            title={title}
            scriptType={scriptData.mode || "TV Commercial"}
            scriptVersion={scriptVersion}
            lastSaved={lastSaved}
            isSaving={isSaving}
            isFullScreen={isFullScreen}
            showSidebar={showSidebar}
            isEditingTitle={isEditingTitle}
            titleInputRef={titleInputRef}
            setShowSidebar={setShowSidebar}
            handleTitleChange={handleTitleChange}
            handleTitleSubmit={handleTitleSubmit}
            handleTitleKeyDown={handleTitleKeyDown}
            setIsEditingTitle={setIsEditingTitle}
            toggleFullScreen={toggleFullScreen}
            handleSave={handleSave}
            handleCreateNewVersion={handleCreateNewVersion}
            hasUnsavedChanges={hasUnsavedChanges}
            analysisGenerated={currentVersionData?.analysisGenerated}
            analyzedScriptId={currentVersionData?.analyzedScriptId}
            analyzedVersionId={currentVersionData?.analyzedVersionId}
          />

          <Box sx={{ display: "flex", flexGrow: 1, overflow: "hidden" }}>
            {showSidebar && (
              <EditorSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                handleFormatClick={handleFormatClick}
                handleExportText={handleExportText}
                handleExportPDF={handleExportPDF}
                scriptStats={scriptStats}
                scriptVersion={scriptVersion}
                scriptVersions={scriptVersions}
                handleVersionChange={handleVersionChange}
                scriptType={scriptData.mode || "TV Commercial"}
                conceptSummary={scriptData.conceptSummary}
                basicAnalysis={{
                  brandNameMentioned: scriptStats.brandNameMentioned || false,
                  ctaMentioned: scriptStats.ctaMentioned || false,
                  mandatoriesMentioned:
                    scriptStats.mandatoriesMentioned || false,
                  wordCount: scriptStats.words,
                  estimatedCharacterCount: scriptStats.characters,
                }}
                suggestedVisualElements={
                  scriptData.suggestedVisualElements || []
                }
                suggestedAudioCues={scriptData.suggestedAudioCues || []}
                synthesizedInputs={scriptData.synthesizedInputs}
                strategicContextSummary={scriptData.strategicContextSummary}
                isRevision={scriptData.isRevision}
                revisionSummary={scriptData.revisionSummary}
                scriptDuration={
                  scriptData.estimatedDuration || scriptData.scriptDuration
                }
              />
            )}

            <Box
              sx={{
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                width: "100%",
              }}
            >
              {editor && (
                <>
                  <EditorToolbar
                    editor={editor}
                    sx={{ flexShrink: 0, width: "100%" }}
                  />

                  <EditorContent
                    editor={editor}
                    onKeyDown={handleKeyDown}
                    ref={editorContentRef}
                    style={{
                      flexGrow: 1,
                      overflow: "auto",
                      padding: "16px",
                      backgroundColor: theme.palette.background.default,
                      minHeight: "400px",
                      maxHeight: "70vh",
                      width: "100%",
                    }}
                  />

                  <Box
                    sx={{
                      borderTop: 1,
                      borderColor: "divider",
                      display: "flex",
                      justifyContent: "space-between",
                      p: 1,
                      bgcolor: alpha(theme.palette.background.default, 0.5),
                      flexShrink: 0,
                      width: "100%",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          display: "flex",
                          alignItems: "center",
                          fontFamily: brand.fonts.body,
                        }}
                      >
                        <Description
                          fontSize="small"
                          sx={{ mr: 0.5, fontSize: 16 }}
                        />
                        {scriptStats.words} words
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          display: "flex",
                          alignItems: "center",
                          fontFamily: brand.fonts.body,
                        }}
                      >
                        <Timer
                          fontSize="small"
                          sx={{ mr: 0.5, fontSize: 16 }}
                        />
                        ~{scriptStats.duration} seconds
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          fontFamily: brand.fonts.body,
                        }}
                      >
                        Zoom:
                      </Typography>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() =>
                          setZoomLevel(Math.max(50, zoomLevel - 10))
                        }
                        sx={{
                          minWidth: 0,
                          p: 0.5,
                          color: "primary.main",
                          fontFamily: brand.fonts.body,
                        }}
                      >
                        -
                      </Button>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: brand.fonts.body }}
                      >
                        {zoomLevel}%
                      </Typography>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() =>
                          setZoomLevel(Math.min(200, zoomLevel + 10))
                        }
                        sx={{
                          minWidth: 0,
                          p: 0.5,
                          color: "primary.main",
                          fontFamily: brand.fonts.body,
                        }}
                      >
                        +
                      </Button>
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Video Generation Controls */}
      <VideoGenerationControls
        processingMode={processingMode}
        aspectRatio={aspectRatio}
        pauseBeforeSettings={pauseBeforeSettings}
        modelTiers={modelTiers}
        onProcessingOptionsChange={handleProcessingOptionsChange}
        onGenerateVideo={handleGenerateVideo}
        isSaving={isSaving}
      />

      <Fab
        color="primary"
        aria-label="feedback"
        sx={{
          position: "fixed",
          bottom: 24,
          right: 14,
          boxShadow: theme.shadows[6],
          "&:hover": {
            transform: "scale(1.05)",
            transition: theme.transitions.create("transform", {
              duration: theme.transitions.duration.short,
            }),
          },
        }}
        onClick={handleOpenFeedbackDialog}
      >
        <MessageIcon />
      </Fab>

      <FeedbackDialog
        open={feedbackDialogOpen}
        onClose={handleCloseFeedbackDialog}
        feedback={feedback}
        setFeedback={setFeedback}
        feedbackSentiment={feedbackSentiment}
        handleSentimentSelect={handleSentimentSelect}
        isRecording={isRecording}
        recordingTime={recordingTime}
        toggleVoiceRecording={toggleVoiceRecording}
        handleAddReference={handleAddReference}
        references={references}
        handleRemoveReference={handleRemoveReference}
        handleSubmitFeedback={handleSubmitFeedback}
      />

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileInputChange}
        multiple
      />

      <VideoProgressIndicator
        open={isVideoDialogOpen}
        onClose={() => setIsVideoDialogOpen(false)}
        scriptContent={scriptContent}
        processingMode={processingMode}
        aspectRatio={aspectRatio}
        pauseBeforeSettings={pauseBeforeSettings}
        modelTiers={modelTiers}
        genScriptId={genScriptId}
        currentVersionNumber={currentVersionNumber}
      />

      <DisclaimerDialog
        open={disclaimerOpen}
        onClose={handleCloseDisclaimer}
        disclaimer={scriptData.disclaimer as string | undefined}
      />
    </Box>
  );
}
