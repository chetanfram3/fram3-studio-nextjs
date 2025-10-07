// src/types/profile.ts

export interface UserProfile {
  uid: string;
  email: string;
  phoneNumber?: string;
  emailVerified: boolean;
  displayName: string;
  photoURL: string;
  providerData: Array<{
    uid: string;
    displayName: string;
    email: string;
    phoneNumber?: string;
    photoURL: string;
    providerId: string;
  }>;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
    lastRefreshTime: string;
  };
  extendedInfo: {
    details: {
      firstName: string;
      lastName: string;
      dob: string | null;
      address: Address;
      gstin?: {
        number: string;
        companyName: string;
      } | null;
      preferences: Preferences;
      genre: string[];
      expertise: string[];
    };
  };
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface Preferences {
  theme: string;
  language: string;
}

export interface APIINFO {
  version: string;
  subscription: string;
  region: string;
}

// Export type for create user payload
export interface CreateUserPayload {
  uid: string;
  email: string;
  displayName: string;
  profilePic?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  emailVerified: boolean;
  role?: string;
  status?: string;
  providerUserInfo?: Array<{
    providerId: string;
    email: string;
    federatedId?: string;
    rawId?: string;
  }>;
}