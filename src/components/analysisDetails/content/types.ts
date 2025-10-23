// src/components/analysisDetails/content/types.ts

export interface ScriptContentSectionProps {
  content: string;
  isEditing: boolean;
  isUpdating: boolean;
  editedContent: string;
  updateError: string | null;
  onEdit: () => void;
  onCancel: () => void;
  onUpdate: () => void;
  onContentChange: (content: string) => void;
}

export interface ScriptContentProps {
  content: string;
  onEdit: () => void;
}

export interface ScriptEditorProps {
  content: string;
  isUpdating: boolean;
  onCancel: () => void;
  onUpdate: () => void;
  onContentChange: (content: string) => void;
}