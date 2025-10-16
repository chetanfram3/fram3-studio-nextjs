import logger from '@/utils/logger';
import { UserProfile, ApiResponse } from '@/types/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { getIdToken } from 'firebase/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Check if user profile exists in backend
 */
export async function checkUserProfile(idToken: string): Promise<boolean> {
  try {
    logger.debug('Checking if user profile exists in backend');

    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      logger.debug('User profile not found (404)');
      return false;
    }

    if (!response.ok) {
      logger.warn('Profile check returned non-OK status:', response.status);
      return false;
    }

    logger.debug('User profile exists in backend');
    return true;
  } catch (error) {
    logger.error('Error checking user profile:', error);
    // Assume profile doesn't exist if there's an error
    return false;
  }
}

/**
 * Create user profile in backend
 */
export async function createUserProfile(
  idToken: string,
  userData: Partial<UserProfile>
): Promise<ApiResponse<UserProfile>> {
  try {
    logger.debug('Creating user profile in backend:', userData.email);

    const response = await fetch(`${API_BASE_URL}/user/add`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('Failed to create user profile:', data);
      throw new Error(data.message || data.error || 'Failed to create user profile');
    }

    logger.debug('User profile created successfully:', data);

    return {
      success: true,
      data: data,
      message: 'Profile created successfully',
    };
  } catch (error) {
    logger.error('Error creating user profile:', error);
    throw error;
  }
}

/**
 * Get user profile from backend
 */
export async function getUserProfile(idToken: string): Promise<UserProfile> {
  try {
    logger.debug('Fetching user profile from backend');

    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch user profile');
    }

    const profile = await response.json();
    logger.debug('User profile fetched successfully');

    return profile;
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Update user profile in backend
 */
export async function updateUserProfile(
  idToken: string,
  updates: Partial<UserProfile>
): Promise<ApiResponse<UserProfile>> {
  try {
    logger.debug('Updating user profile in backend');

    const response = await fetch(`${API_BASE_URL}/user/update`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update user profile');
    }

    logger.debug('User profile updated successfully');

    return {
      success: true,
      data: data,
      message: 'Profile updated successfully',
    };
  } catch (error) {
    logger.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Delete user profile from backend
 */
export async function deleteUserProfile(idToken: string): Promise<ApiResponse> {
  try {
    logger.debug('Deleting user profile from backend');

    const response = await fetch(`${API_BASE_URL}/user/delete`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete user profile');
    }

    logger.debug('User profile deleted successfully');

    return {
      success: true,
      message: 'Profile deleted successfully',
    };
  } catch (error) {
    logger.error('Error deleting user profile:', error);
    throw error;
  }
}

/**
 * Get user by ID (admin function)
 */
export async function getUserById(
  idToken: string,
  userId: string
): Promise<UserProfile> {
  try {
    logger.debug('Fetching user by ID:', userId);

    const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch user');
    }

    const user = await response.json();
    logger.debug('User fetched successfully');

    return user;
  } catch (error) {
    logger.error('Error fetching user by ID:', error);
    throw error;
  }
}

/**
 * Search users (admin function)
 */
export async function searchUsers(
  idToken: string,
  query: string
): Promise<UserProfile[]> {
  try {
    logger.debug('Searching users with query:', query);

    const response = await fetch(`${API_BASE_URL}/user/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to search users');
    }

    const users = await response.json();
    logger.debug('Users search completed');

    return users;
  } catch (error) {
    logger.error('Error searching users:', error);
    throw error;
  }
}

/**
 * Upload profile picture
 */
export async function uploadProfilePicture(
  idToken: string,
  file: File
): Promise<ApiResponse<{ url: string }>> {
  try {
    logger.debug('Uploading profile picture');

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/user/upload-profile-pic`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to upload profile picture');
    }

    logger.debug('Profile picture uploaded successfully');

    return {
      success: true,
      data: { url: data.url },
      message: 'Profile picture uploaded successfully',
    };
  } catch (error) {
    logger.error('Error uploading profile picture:', error);
    throw error;
  }
}

/**
 * Extract claims from token
 */
const extractTokenClaims = async () => {
  try {
    if (!auth.currentUser) return null;

    const token = await getIdToken(auth.currentUser, false);
    if (!token) return null;

    const payload = token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payload));

    return {
      access_level: decodedPayload.access_level,
      subscription: decodedPayload.subscription,
      is_enabled: decodedPayload.is_enabled,
      isNewUser: decodedPayload.isNewUser ?? true,
    };
  } catch (error) {
    logger.error('Error extracting token claims:', error);
    return null;
  }
};


/**
 * Mark user as completed onboarding (updates isNewUser claim)
 * ✅ Manually updates claims after token refresh
 */
export async function completeOnboarding(): Promise<ApiResponse<{ message: string }>> {
  try {
    logger.debug('Marking user onboarding as complete');

    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/user/complete-onboarding`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to complete onboarding');
    }

    logger.debug('Backend onboarding update successful');

    // Force token refresh to get updated claims from backend
    await auth.currentUser?.getIdToken(true);
    logger.debug('Token refreshed with new claims');

    // 🔥 KEY FIX: Immediately extract and update claims in the store
    // Since onIdTokenChanged doesn't fire on manual refresh, we do it manually
    const newClaims = await extractTokenClaims();
    if (newClaims) {
      const { setClaims } = useAuthStore.getState();
      setClaims(newClaims);
      logger.debug('Claims manually updated after onboarding completion', {
        isNewUser: newClaims.isNewUser
      });
    }

    logger.debug('Onboarding marked as complete successfully');

    return {
      success: true,
      data: data,
      message: 'Onboarding completed successfully',
    };
  } catch (error) {
    logger.error('Error completing onboarding:', error);
    throw error;
  }
}