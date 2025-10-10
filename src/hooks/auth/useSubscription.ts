'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { SubscriptionLevels, AccessLevels } from '@/config/constants';

export function useSubscription() {
    const { claims } = useAuthStore();

    const subscription = useMemo(
        () => claims?.subscription || SubscriptionLevels.STARTER,
        [claims?.subscription]
    );

    const accessLevel = useMemo(
        () => claims?.access_level || AccessLevels.USER,
        [claims?.access_level]
    );

    const isEnabled = useMemo(
        () => claims?.is_enabled ?? false,
        [claims?.is_enabled]
    );

    const isAdmin = useMemo(
        () =>
            accessLevel === AccessLevels.ADMIN ||
            accessLevel === AccessLevels.TEAM_ADMIN,
        [accessLevel]
    );

    const isSuperAdmin = useMemo(
        () => accessLevel === AccessLevels.SUPER_ADMIN,
        [accessLevel]
    );

    const hasFeatureAccess = (requiredLevel: string) => {
        const levels = Object.values(SubscriptionLevels) as string[];
        const currentIndex = levels.indexOf(subscription);
        const requiredIndex = levels.indexOf(requiredLevel);
        return currentIndex >= requiredIndex;
    };

    return {
        subscription,
        accessLevel,
        isEnabled,
        isAdmin,
        isSuperAdmin,
        hasFeatureAccess,
        claims,
    };
}