'use client';

import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Grid
} from '@mui/material';

interface TimeSelectorProps {
  label: string;
  value: string;
  onChange: (time: string) => void;
  required?: boolean;
  optional?: boolean;
  defaultPeriod?: 'AM' | 'PM';
}

export default function TimeSelector({
  label,
  value,
  onChange,
  required = false,
  optional = false,
  defaultPeriod
}: TimeSelectorProps) {
  // تحويل الوقت من 24 ساعة إلى 12 ساعة
  const parseTime = (time24: string) => {
    if (!time24) return { hour: '', minute: '00', period: defaultPeriod || 'AM' };

    const [hours, minutes] = time24.split(':');
    const hour24 = parseInt(hours, 10);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const period = hour24 >= 12 ? 'PM' : 'AM';

    return {
      hour: hour12.toString(),
      minute: minutes,
      period
    };
  };

  // تحويل الوقت من 12 ساعة إلى 24 ساعة
  const formatTime = (hour: string, minute: string, period: string) => {
    if (!hour || !minute || !period) return '';
    
    let hour24 = parseInt(hour, 10);
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minute}`;
  };

  const currentTime = parseTime(value);

  const handleTimeChange = (field: 'hour' | 'minute' | 'period', newValue: string) => {
    const updatedTime = { ...currentTime, [field]: newValue };
    const time24 = formatTime(updatedTime.hour, updatedTime.minute, updatedTime.period);
    onChange(time24);
  };

  return (
    <Box>
      <Typography variant="body2" fontWeight="bold" mb={1}>
        {label}
      </Typography>
      
      <Grid container spacing={1} alignItems="center">
        {/* اختيار الساعة */}
        <Grid size={4}>
          <FormControl fullWidth size="small">
            <Select
              value={currentTime.hour}
              onChange={(e) => handleTimeChange('hour', e.target.value)}
              displayEmpty
              required={required}
            >
              <MenuItem value="" disabled>الساعة</MenuItem>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                <MenuItem key={hour} value={hour.toString()}>
                  {hour}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* اختيار الدقيقة */}
        <Grid size={3}>
          <FormControl fullWidth size="small">
            <Select
              value={currentTime.minute}
              onChange={(e) => handleTimeChange('minute', e.target.value)}
              required={required}
            >
              <MenuItem value="00">00</MenuItem>
              <MenuItem value="15">15</MenuItem>
              <MenuItem value="30">30</MenuItem>
              <MenuItem value="45">45</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* اختيار الفترة */}
        <Grid size={5}>
          <FormControl fullWidth size="small">
            <Select
              value={currentTime.period}
              onChange={(e) => handleTimeChange('period', e.target.value)}
              required={required}
              sx={{
                '& .MuiSelect-select': {
                  minWidth: '80px', // ضمان عرض كافي لعرض النص كاملاً
                  whiteSpace: 'nowrap'
                }
              }}
            >
              <MenuItem value="AM">صباحًا</MenuItem>
              <MenuItem value="PM">مساءً</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
}
