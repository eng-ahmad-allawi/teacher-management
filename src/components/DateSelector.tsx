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

interface DateSelectorProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
  required?: boolean;
}

const ARABIC_MONTHS = [
  'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
  'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'
];

export default function DateSelector({ 
  label, 
  value, 
  onChange, 
  required = false 
}: DateSelectorProps) {
  // تحليل التاريخ من YYYY-MM-DD
  const parseDate = (dateString: string) => {
    if (!dateString) {
      const today = new Date();
      return {
        day: today.getDate().toString(),
        month: (today.getMonth() + 1).toString(),
        year: today.getFullYear().toString()
      };
    }
    
    const [year, month, day] = dateString.split('-');
    return {
      day: parseInt(day, 10).toString(),
      month: parseInt(month, 10).toString(),
      year
    };
  };

  // تكوين التاريخ إلى YYYY-MM-DD
  const formatDate = (day: string, month: string, year: string) => {
    if (!day || !month || !year) return '';
    
    const dayPadded = day.padStart(2, '0');
    const monthPadded = month.padStart(2, '0');
    
    return `${year}-${monthPadded}-${dayPadded}`;
  };

  const currentDate = parseDate(value);

  const handleDateChange = (field: 'day' | 'month' | 'year', newValue: string) => {
    const updatedDate = { ...currentDate, [field]: newValue };
    const formattedDate = formatDate(updatedDate.day, updatedDate.month, updatedDate.year);
    onChange(formattedDate);
  };

  // الحصول على عدد الأيام في الشهر
  const getDaysInMonth = (month: string, year: string) => {
    if (!month || !year) return 31;
    return new Date(parseInt(year), parseInt(month), 0).getDate();
  };

  // إنشاء قائمة السنوات (السنة الحالية ± 5 سنوات)
  const getYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

  const daysInMonth = getDaysInMonth(currentDate.month, currentDate.year);

  return (
    <Box>
      <Typography variant="body2" fontWeight="bold" mb={1}>
        {label}
      </Typography>
      
      <Grid container spacing={1} alignItems="center">
        {/* اختيار اليوم */}
        <Grid item xs={4}>
          <FormControl fullWidth size="small">
            <Select
              value={currentDate.day}
              onChange={(e) => handleDateChange('day', e.target.value)}
              required={required}
            >
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
                <MenuItem key={day} value={day.toString()}>
                  {day}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* اختيار الشهر */}
        <Grid item xs={4}>
          <FormControl fullWidth size="small">
            <Select
              value={currentDate.month}
              onChange={(e) => handleDateChange('month', e.target.value)}
              required={required}
            >
              {ARABIC_MONTHS.map((month, index) => (
                <MenuItem key={index + 1} value={(index + 1).toString()}>
                  {month}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* اختيار السنة */}
        <Grid item xs={4}>
          <FormControl fullWidth size="small">
            <Select
              value={currentDate.year}
              onChange={(e) => handleDateChange('year', e.target.value)}
              required={required}
            >
              {getYears().map((year) => (
                <MenuItem key={year} value={year.toString()}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
}
