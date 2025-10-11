"use client";

import { Box, Typography } from "@mui/material";
import { Slider } from "./Slider";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const handleSliderChange = (value: number[]) => {
    if (value.length > 0) {
      onPageChange(value[0]);
    }
  };

  return (
    <Box sx={{ width: "100%", mt: 3 }}>
      <Slider
        value={[currentPage]}
        max={totalPages}
        min={1}
        step={1}
        onValueChange={handleSliderChange}
        aria-label="Page navigation slider"
      />
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 2,
        }}
      >
        <Typography variant="body2">Drag to see more projects</Typography>
        <Typography variant="body2">
          Page {currentPage} of {totalPages}
        </Typography>
      </Box>
    </Box>
  );
}
