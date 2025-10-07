'use client';

import { useState } from 'react';
import { Autocomplete, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/SearchSharp';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { API_BASE_URL } from '@/config/constants';

interface SearchResult {
  scriptId: string;
  title: string;
  currentVersion: string;
}

export function ProjectSearch() {
  const router = useRouter();
  const [options, setOptions] = useState<SearchResult[]>([]);
  const [inputValue, setInputValue] = useState('');

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm) {
      setOptions([]);
      return;
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(
        `${API_BASE_URL}/scripts/auto-complete?query=${searchTerm}&limit=15`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const { data } = await response.json();
        setOptions(data || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      setOptions([]);
    }
  };

  return (
    <Autocomplete
      sx={{ width: 300 }}
      options={options}
      getOptionLabel={(option) => option.title}
      inputValue={inputValue}
      onInputChange={(_, newValue) => {
        setInputValue(newValue);
        handleSearch(newValue);
      }}
      onChange={(_, value) => {
        if (value) {
          router.push(
            `/dashboard/story/${value.scriptId}/version/${value.currentVersion}/3`
          );
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          size="small"
          placeholder="Search projects..."
          sx={{
            bgcolor: 'background.paper',
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'secondary.light',
              },
              '&:hover fieldset': {
                borderColor: 'secondary.dark',
              },
            },
          }}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'primary' }} />
              </InputAdornment>
            ),
          }}
        />
      )}
    />
  );
}