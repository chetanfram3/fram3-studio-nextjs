import { auth } from '@/lib/firebase';
import { API_BASE_URL } from '@/config/constants';
import type { AnalysisStatusResponse } from '@/types/analysisStatus';

/**
 * Fetch analysis status with enhanced error handling and logging
 */
export async function fetchAnalysisStatus(
  scriptId: string,
  versionId: string
): Promise<AnalysisStatusResponse> {
  console.log('🔍 Fetching analysis status:', { scriptId, versionId });

  // Check if user is authenticated
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error('❌ No authenticated user');
    throw new Error('Authentication required - please sign in');
  }

  // Get token
  const token = await currentUser.getIdToken().catch((error) => {
    console.error('❌ Failed to get auth token:', error);
    throw new Error('Failed to get authentication token');
  });

  if (!token) {
    console.error('❌ Token is null or undefined');
    throw new Error('Authentication token is missing');
  }

  // Log the API URL being called
  const url = `${API_BASE_URL}/scripts/get-analysis-status?scriptId=${scriptId}&versionId=${versionId}`;
  console.log('🌐 Calling API:', url);

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('📡 Response status:', response.status, response.statusText);

    if (!response.ok) {
      // Try to get error details from response
      const errorText = await response.text();
      console.error('❌ API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      // Parse error message if JSON
      let errorMessage = 'Failed to fetch analysis status';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If not JSON, use the text directly if it's not too long
        if (errorText.length < 200) {
          errorMessage = errorText || errorMessage;
        }
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ Analysis status fetched successfully:', {
      hasStatuses: !!data.statuses,
      statusCount: data.statuses ? Object.keys(data.statuses).length : 0,
    });

    return data;
  } catch (error) {
    console.error('❌ Fetch error:', error);
    
    // Check for network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error - please check your connection');
    }

    throw error;
  }
}

/**
 * Delete analysis with enhanced error handling
 */
export async function deleteAnalysis(
  scriptId: string,
  versionId: string,
  analysisType: string
): Promise<{ success: boolean; message: string }> {
  console.log('🗑️ Deleting analysis:', { scriptId, versionId, analysisType });

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required - please sign in');
  }

  const token = await currentUser.getIdToken().catch((error) => {
    console.error('❌ Failed to get auth token:', error);
    throw new Error('Failed to get authentication token');
  });

  if (!token) {
    throw new Error('Authentication token is missing');
  }

  const url = `${API_BASE_URL}/scripts/delete-analysis`;
  console.log('🌐 Calling API:', url);

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scriptId,
        versionId,
        analysisType,
      }),
    });

    console.log('📡 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      let errorMessage = 'Failed to delete analysis';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        if (errorText.length < 200) {
          errorMessage = errorText || errorMessage;
        }
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ Analysis deleted successfully');

    return data;
  } catch (error) {
    console.error('❌ Delete error:', error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error - please check your connection');
    }

    throw error;
  }
}