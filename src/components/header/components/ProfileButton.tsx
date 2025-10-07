import React from 'react';
import { IconButton, Avatar } from '@mui/material';
import { useAuthStore } from '@/store/authStore';

interface ProfileButtonProps {
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
}

export function ProfileButton({ onClick }: ProfileButtonProps) {
  const { user } = useAuthStore();

  return (
    <IconButton
      onClick={onClick}
      size="small"
      sx={{ ml: 2 }}
    >
      <Avatar
        src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'User'}`}
        alt={user?.displayName || 'User'}
        sx={{ 
          width: 40, 
          height: 40,
          border: 2,
          borderColor: 'common.white'
        }}
      />
    </IconButton>
  );
}