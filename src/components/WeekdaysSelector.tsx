'use client';

import React from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Grid
} from '@mui/material';

interface WeekdaysSelectorProps {
  selectedDays: number[];
  onChange: (days: number[]) => void;
}

const WEEKDAYS = [
  { label: 'السبت', value: 0 },
  { label: 'الأحد', value: 1 },
  { label: 'الاثنين', value: 2 },
  { label: 'الثلاثاء', value: 3 },
  { label: 'الأربعاء', value: 4 },
  { label: 'الخميس', value: 5 },
  { label: 'الجمعة', value: 6 }
];

export default function WeekdaysSelector({ 
  selectedDays, 
  onChange 
}: WeekdaysSelectorProps) {
  const handleDayChange = (dayValue: number, checked: boolean) => {
    const currentDays = selectedDays || [];
    if (checked) {
      onChange([...currentDays, dayValue]);
    } else {
      onChange(currentDays.filter(day => day !== dayValue));
    }
  };

  return (
    <Box>
      <Typography variant="body2" fontWeight="bold" mb={2}>
        أيام الأسبوع:
      </Typography>
      
      <Grid container spacing={1}>
        {WEEKDAYS.map((day) => (
          <Grid size={{ xs: 6, sm: 4, md: 3 }} key={day.value}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedDays ? selectedDays.includes(day.value) : false}
                  onChange={(e) => handleDayChange(day.value, e.target.checked)}
                  sx={{
                    color: '#666',
                    '&.Mui-checked': {
                      color: '#000',
                    },
                  }}
                />
              }
              label={
                <Typography variant="body2">
                  {day.label}
                </Typography>
              }
              sx={{
                margin: 0,
                '& .MuiFormControlLabel-label': {
                  fontSize: '0.875rem'
                }
              }}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
