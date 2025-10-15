export interface GeneratorResponse {
    message: string;
  }
  
  export interface GeneratorParams {
    userId: string;
    scriptId: string;
    versionId: string;
    analysisType: string;
  }
  
  export interface GeneratorButtonProps {
    scriptId: string;
    versionId: string;
    onStatusChange: (success: boolean) => void;
  }