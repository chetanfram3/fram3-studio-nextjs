import { FormValues } from "../types";

/**
 * Save form values to localStorage
 * @param formValues The current form values to save
 */
export const saveFormToLocalStorage = (formValues: FormValues): void => {
  try {
    localStorage.setItem("adScriptGeneratorCurrentForm", JSON.stringify(formValues));
  } catch (error) {
    console.error("Failed to save form to localStorage:", error);
  }
};

/**
 * Load the last saved form values from localStorage
 * @returns The saved form values or null if none exists
 */
export const loadFormFromLocalStorage = (): FormValues | null => {
  try {
    const savedForm = localStorage.getItem("adScriptGeneratorCurrentForm");
    if (savedForm) {
      return JSON.parse(savedForm);
    }
  } catch (error) {
    console.error("Failed to load form from localStorage:", error);
  }
  return null;
};

/**
 * Validate if an object conforms to the FormValues structure
 * @param data Any data object to check
 * @returns True if the object looks like a valid FormValues object
 */
export const validateFormValuesFormat = (data: any): boolean => {
  // Basic validation of required fields
  if (!data || typeof data !== 'object') return false;
  
  // Check for essential form structure
  const hasBasicProperties = (
    'projectName' in data &&
    'brandName' in data &&
    'productName' in data &&
    'formatAndCTA' in data &&
    'ui' in data
  );
  
  // Check for nested structure
  const hasNestedStructure = (
    data.audienceDetails &&
    data.storyDetails &&
    data.brandDetails &&
    data.productDetails &&
    data.campaignDetails &&
    data.executionReference
  );
  
  return hasBasicProperties && hasNestedStructure;
};

/**
 * Export the current form values to a downloadable JSON file
 * @param formValues The current form values
 * @param filename Optional custom filename
 */
export const exportFormValues = (formValues: FormValues, filename?: string): void => {
  const dataStr = JSON.stringify(formValues, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.download = filename || `adscript-form-${new Date().toISOString().split('T')[0]}.json`;
  link.href = url;
  link.click();
  
  URL.revokeObjectURL(url);
};

/**
 * Auto-save middleware function to call whenever form values change
 * @param formValues Current form values
 */
export const autoSaveForm = (formValues: FormValues): void => {
  // Use debouncing in a real implementation
  saveFormToLocalStorage(formValues);
};

/**
 * Initialize form with either saved values or defaults
 * @param defaultValues The default form values
 * @returns FormValues to initialize the form with
 */
export const initializeFormValues = (defaultValues: FormValues): FormValues => {
  const savedValues = loadFormFromLocalStorage();
  return savedValues || defaultValues;
};

/**
 * Updates the form's extraction notes with uploaded file information
 * @param extractionNotes - The extraction notes entered by the user
 * @param fileUrls - Array of uploaded file URLs
 * @param formValues - Current form values
 * @returns Updated form values with extraction notes and file references
 */
export const updateFormWithUploadedFiles = (
  extractionNotes: string,
  fileUrls: string[],
  formValues: FormValues
): FormValues => {
  const updatedFormValues = { ...formValues };
  
  // Update the extraction notes
  if (extractionNotes.trim()) {
    updatedFormValues.executionReference.referenceFiles.extractionNotes = 
      updatedFormValues.executionReference.referenceFiles.extractionNotes
        ? `${updatedFormValues.executionReference.referenceFiles.extractionNotes}\n\n${extractionNotes}`
        : extractionNotes;
  }
  
  // In a real implementation, you might want to store the file URLs somewhere
  // For example, you could add a new field to store them, or send them to the backend
  // For now, we'll just add them to the extraction notes if they're not already there
  if (fileUrls.length > 0) {
    const fileUrlsText = `Uploaded Files:\n${fileUrls.map(url => `- ${url}`).join('\n')}`;
    
    if (!updatedFormValues.executionReference.referenceFiles.extractionNotes?.includes('Uploaded Files:')) {
      updatedFormValues.executionReference.referenceFiles.extractionNotes = 
        updatedFormValues.executionReference.referenceFiles.extractionNotes
          ? `${updatedFormValues.executionReference.referenceFiles.extractionNotes}\n\n${fileUrlsText}`
          : fileUrlsText;
    }
  }
  
  return updatedFormValues;
};