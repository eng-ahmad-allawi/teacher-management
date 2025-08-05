'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Grid,
  Alert,
  Chip,
  Autocomplete,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ar } from 'date-fns/locale';
import { db } from '@/lib/database';
import type { Subject, Institute, Appointment } from '@/lib/database';
import TimeSelector from './TimeSelector';
import DateSelector from './DateSelector';
import WeekdaysSelector from './WeekdaysSelector';

interface AddAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedDate?: string; // التاريخ المحدد مسبقاً
}

const DAYS_OF_WEEK = [
  'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
];

const SESSION_TYPES = ['شتوي', 'صيفي', 'مكثفات', 'امتحانية'];

export default function AddAppointmentDialog({
  open,
  onClose,
  onSuccess,
  selectedDate
}: AddAppointmentDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [formData, setFormData] = useState({
    type: 'private' as 'private' | 'institute' | 'school',
    entityName: '',
    entityId: undefined as number | undefined,
    subjectId: 0,
    startTime: '',
    endTime: '',
    date: selectedDate || '',
    dayOfWeek: 0,
    selectedDays: [] as number[],
    isRepeating: false,
    repeatStartDate: '',
    repeatEndDate: '',
    sessionType: 'شتوي' as 'شتوي' | 'صيفي' | 'مكثفات' | 'امتحانية',
    notes: ''
  });

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // تحميل البيانات المطلوبة
  useEffect(() => {
    const loadData = async () => {
      try {
        const [subjectsData, institutesData] = await Promise.all([
          db.getAllSubjects(),
          db.getAllInstitutes()
        ]);
        setSubjects(subjectsData);
        setInstitutes(institutesData);

        // تعيين أول مادة تلقائياً
        if (subjectsData.length > 0 && formData.subjectId === 0) {
          setFormData(prev => ({
            ...prev,
            subjectId: subjectsData[0].id!
          }));
        }
      } catch (err) {
        console.error('خطأ في تحميل البيانات:', err);
        setError('حدث خطأ في تحميل البيانات');
      }
    };

    if (open) {
      loadData();
    }
  }, [open, formData.subjectId]);

  // إعادة تعيين النموذج عند الإغلاق
  useEffect(() => {
    if (!open) {
      setFormData({
        type: 'private',
        entityName: '',
        entityId: undefined,
        subjectId: 0,
        startTime: '',
        endTime: '',
        date: selectedDate || '',
        dayOfWeek: 0,
        selectedDays: [],
        isRepeating: false,
        repeatStartDate: '',
        repeatEndDate: '',
        sessionType: 'شتوي',
        notes: ''
      });
      setError(null);
    }
  }, [open, selectedDate]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // التحقق من صحة البيانات
      if (!formData.entityName.trim()) {
        setError('يرجى إدخال اسم الطالب أو اختيار المعهد/المدرسة');
        return;
      }

      if (!formData.subjectId) {
        setError('يرجى اختيار المادة');
        return;
      }

      if (!formData.startTime) {
        setError('يرجى تحديد وقت البداية');
        return;
      }

      // التحقق من وقت النهاية للمعاهد والمدارس
      if (formData.type !== 'private' && !formData.endTime) {
        setError('يرجى تحديد وقت النهاية للمعاهد والمدارس');
        return;
      }

      if (!formData.isRepeating && !formData.date) {
        setError('يرجى تحديد التاريخ للمواعيد غير المتكررة');
        return;
      }

      if (formData.isRepeating && (!formData.repeatStartDate || !formData.repeatEndDate)) {
        setError('يرجى تحديد فترة التكرار');
        return;
      }

      // التحقق من تعارض المواعيد
      const checkDate = formData.isRepeating ? formData.repeatStartDate : formData.date;
      const hasConflict = await db.checkAppointmentConflict(
        checkDate,
        formData.startTime,
        formData.endTime || formData.startTime
      );

      if (hasConflict) {
        setError('يوجد تعارض مع موعد آخر في نفس الوقت');
        return;
      }

      // العثور على اسم المادة
      const subject = subjects.find(s => s.id === formData.subjectId);
      if (!subject) {
        setError('المادة المحددة غير موجودة');
        return;
      }

      // إنشاء الموعد
      const appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'> = {
        type: formData.type,
        entityName: formData.entityName,
        entityId: formData.entityId,
        subjectId: formData.subjectId,
        subjectName: subject.name,
        startTime: formData.startTime,
        endTime: formData.endTime || undefined,
        date: formData.isRepeating ? undefined : formData.date,
        dayOfWeek: formData.isRepeating ? formData.dayOfWeek : undefined,
        isRepeating: formData.isRepeating,
        repeatStartDate: formData.isRepeating ? formData.repeatStartDate : undefined,
        repeatEndDate: formData.isRepeating ? formData.repeatEndDate : undefined,
        sessionType: formData.type !== 'private' ? formData.sessionType : undefined,
        notes: formData.notes || undefined
      };

      await db.addAppointment(appointmentData);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('خطأ في إضافة الموعد:', err);
      setError('حدث خطأ في إضافة الموعد');
    } finally {
      setLoading(false);
    }
  };

  const handleEntityChange = (value: string | Institute | null) => {
    if (typeof value === 'string') {
      // درس خصوصي - إدخال يدوي
      setFormData(prev => ({
        ...prev,
        entityName: value,
        entityId: undefined
      }));
    } else if (value) {
      // معهد أو مدرسة
      setFormData(prev => ({
        ...prev,
        entityName: value.name,
        entityId: value.id
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        entityName: '',
        entityId: undefined
      }));
    }
  };

  const getEntityOptions = () => {
    if (formData.type === 'private') {
      return [];
    }
    return institutes.filter(institute => institute.type === formData.type);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ar}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth={isMobile ? "sm" : "md"}
        fullWidth
        fullScreen={false}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: isMobile ? '85vh' : '90vh',
            m: isMobile ? 1 : 1,
            width: isMobile ? 'calc(100% - 32px)' : 'auto',
            maxWidth: isMobile ? '500px' : 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: open ? 'scaleIn 0.3s ease-out' : undefined,
          }
        }}
        sx={{
          '& .MuiBackdrop-root': {
            transition: 'opacity 0.3s ease',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        <DialogTitle sx={{
          backgroundColor: '#000',
          color: 'white',
          textAlign: 'center',
          py: isMobile ? 2.5 : 3,
          fontWeight: 'bold',
          fontSize: isMobile ? '1.1rem' : '1.25rem',
          borderRadius: '8px 8px 0 0'
        }}>
          إضافة موعد جديد
        </DialogTitle>

        <DialogContent sx={{
          p: isMobile ? 2.5 : 3,
          pt: isMobile ? 2.5 : 3,
          pb: isMobile ? 1 : 3,
          maxHeight: isMobile ? 'calc(85vh - 140px)' : 'auto',
          overflowY: 'auto'
        }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={isMobile ? 2.5 : 3}>
            {formData.type === 'private' ? (
              // تخطيط للدروس الخصوصية: نوع الموعد والمادة في نفس الصف (حتى على الموبايل)
              <>
                <Grid size={6}>
                  <FormControl fullWidth>
                    <InputLabel>نوع الموعد</InputLabel>
                    <Select
                      value={formData.type}
                      label="نوع الموعد"
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        type: e.target.value as any,
                        entityName: '',
                        entityId: undefined
                      }))}
                      sx={{
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        '& .MuiSelect-select': {
                          py: isMobile ? 1.2 : 1.5
                        }
                      }}
                    >
                      <MenuItem value="private">درس خصوصي</MenuItem>
                      <MenuItem value="institute">معهد</MenuItem>
                      <MenuItem value="school">مدرسة</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={6}>
                  <FormControl fullWidth>
                    <InputLabel>المادة</InputLabel>
                    <Select
                      value={formData.subjectId}
                      label="المادة"
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        subjectId: e.target.value as number
                      }))}
                      sx={{
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        '& .MuiSelect-select': {
                          py: isMobile ? 1.2 : 1.5
                        }
                      }}
                    >
                      <MenuItem value={0} disabled>اختر المادة</MenuItem>
                      {subjects.map((subject) => (
                        <MenuItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* اسم الطالب */}
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="اسم الطالب"
                    value={formData.entityName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      entityName: e.target.value
                    }))}
                    placeholder="أدخل اسم الطالب"
                    sx={{
                      '& .MuiInputBase-input': {
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        py: isMobile ? 1.2 : 1.5
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: isMobile ? '0.9rem' : '1rem'
                      }
                    }}
                  />
                </Grid>
              </>
            ) : (
              // تخطيط للمعاهد والمدارس: نوع الموعد واختيار المعهد/المدرسة في نفس الصف (حتى على الموبايل)
              <>
                <Grid size={6}>
                  <FormControl fullWidth>
                    <InputLabel>نوع الموعد</InputLabel>
                    <Select
                      value={formData.type}
                      label="نوع الموعد"
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        type: e.target.value as any,
                        entityName: '',
                        entityId: undefined
                      }))}
                      sx={{
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        '& .MuiSelect-select': {
                          py: isMobile ? 1.2 : 1.5
                        }
                      }}
                    >
                      <MenuItem value="private">درس خصوصي</MenuItem>
                      <MenuItem value="institute">معهد</MenuItem>
                      <MenuItem value="school">مدرسة</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={6}>
                  <Autocomplete
                    options={getEntityOptions()}
                    getOptionLabel={(option) => option.name}
                    value={getEntityOptions().find(opt => opt.id === formData.entityId) || null}
                    onChange={(_, value) => handleEntityChange(value)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={formData.type === 'institute' ? 'اختر المعهد' : 'اختر المدرسة'}
                        placeholder={formData.type === 'institute' ? 'ابحث عن معهد...' : 'ابحث عن مدرسة...'}
                        sx={{
                          '& .MuiInputBase-input': {
                            fontSize: isMobile ? '0.9rem' : '1rem',
                            py: isMobile ? 1.2 : 1.5
                          },
                          '& .MuiInputLabel-root': {
                            fontSize: isMobile ? '0.9rem' : '1rem'
                          }
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* المادة ونوع الجلسة في نفس الصف (حتى على الموبايل) */}
                <Grid size={6}>
                  <FormControl fullWidth>
                    <InputLabel>المادة</InputLabel>
                    <Select
                      value={formData.subjectId}
                      label="المادة"
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        subjectId: e.target.value as number
                      }))}
                      sx={{
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        '& .MuiSelect-select': {
                          py: isMobile ? 1.2 : 1.5
                        }
                      }}
                    >
                      <MenuItem value={0} disabled>اختر المادة</MenuItem>
                      {subjects.map((subject) => (
                        <MenuItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={6}>
                  <FormControl fullWidth>
                    <InputLabel>نوع الجلسة</InputLabel>
                    <Select
                      value={formData.sessionType}
                      label="نوع الجلسة"
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        sessionType: e.target.value as any
                      }))}
                      sx={{
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        '& .MuiSelect-select': {
                          py: isMobile ? 1.2 : 1.5
                        }
                      }}
                    >
                      {SESSION_TYPES.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

            {/* الأوقات */}
            <Grid size={formData.type === 'private' ? 12 : 6}>
              <Box sx={{ mb: isMobile ? 1 : 0 }}>
                <TimeSelector
                  label="من:"
                  value={formData.startTime}
                  onChange={(time) => setFormData(prev => ({
                    ...prev,
                    startTime: time
                  }))}
                  required
                />
              </Box>
            </Grid>

            {/* وقت النهاية فقط للمعاهد والمدارس */}
            {formData.type !== 'private' && (
              <Grid size={6}>
                <Box sx={{ mb: isMobile ? 1 : 0 }}>
                  <TimeSelector
                    label="إلى:"
                    value={formData.endTime}
                    onChange={(time) => setFormData(prev => ({
                      ...prev,
                      endTime: time
                    }))}
                    required
                    optional
                  />
                </Box>
              </Grid>
            )}

            {/* التكرار */}
            <Grid size={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isRepeating}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      isRepeating: e.target.checked
                    }))}
                  />
                }
                label="موعد متكرر أسبوعياً"
              />
            </Grid>

            {/* تفاصيل التكرار أو التاريخ الفردي */}
            {formData.isRepeating ? (
              <>
                <Grid size={12}>
                  <WeekdaysSelector
                    selectedDays={formData.selectedDays}
                    onChange={(days) => setFormData(prev => ({
                      ...prev,
                      selectedDays: days
                    }))}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <DateSelector
                    label="تاريخ البداية:"
                    value={formData.repeatStartDate}
                    onChange={(date) => setFormData(prev => ({
                      ...prev,
                      repeatStartDate: date
                    }))}
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <DateSelector
                    label="تاريخ النهاية:"
                    value={formData.repeatEndDate}
                    onChange={(date) => setFormData(prev => ({
                      ...prev,
                      repeatEndDate: date
                    }))}
                    required
                  />
                </Grid>
              </>
            ) : (
              <Grid size={12}>
                <DateSelector
                  label="تاريخ الدرس:"
                  value={formData.date}
                  onChange={(date) => setFormData(prev => ({
                    ...prev,
                    date: date
                  }))}
                  required
                />
              </Grid>
            )}



            {/* ملاحظات */}
            <Grid size={12}>
              <TextField
                fullWidth
                label="ملاحظات (اختياري)"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
                placeholder="أضف أي ملاحظات إضافية..."
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: isMobile ? '0.9rem' : '1rem'
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: isMobile ? '0.9rem' : '1rem'
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{
          p: isMobile ? 2.5 : 3,
          gap: isMobile ? 1.5 : 1,
          flexDirection: isMobile ? 'column-reverse' : 'row',
          backgroundColor: '#f9f9f9',
          borderTop: '1px solid #e0e0e0',
          borderRadius: '0 0 8px 8px'
        }}>
          <Button
            onClick={onClose}
            variant="outlined"
            fullWidth={isMobile}
            className="btn-animated btn-press transition-all hover-lift"
            sx={{
              minWidth: isMobile ? '100%' : 100,
              py: isMobile ? 1.2 : 1,
              fontSize: isMobile ? '1rem' : '1rem',
              borderColor: '#ccc',
              color: '#666',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                borderColor: '#999',
                backgroundColor: '#f5f5f5',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              },
              '&:active': {
                transform: 'scale(0.95)'
              }
            }}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            fullWidth={isMobile}
            className="btn-animated btn-press transition-all hover-lift"
            sx={{
              minWidth: isMobile ? '100%' : 120,
              py: isMobile ? 1.2 : 1,
              fontSize: isMobile ? '1rem' : '1rem',
              backgroundColor: '#000',
              color: 'white',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: '#333',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
              },
              '&:active': {
                transform: 'scale(0.95)'
              },
              '&:disabled': {
                backgroundColor: '#ccc',
                transform: 'none',
                boxShadow: 'none'
              }
            }}
          >
            {loading ? 'جاري الحفظ...' : 'حفظ الموعد'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
