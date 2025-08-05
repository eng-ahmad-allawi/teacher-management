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
  Autocomplete,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ar } from 'date-fns/locale';
import { db } from '@/lib/database';
import type { Subject, Institute, Appointment } from '@/lib/database';

interface EditAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointment: Appointment | null;
}

const DAYS_OF_WEEK = [
  'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
];

const SESSION_TYPES = ['شتوي', 'صيفي', 'مكثفات', 'امتحانية'];

export default function EditAppointmentDialog({
  open,
  onClose,
  onSuccess,
  appointment
}: EditAppointmentDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [formData, setFormData] = useState({
    type: 'private' as 'private' | 'institute' | 'school',
    entityName: '',
    entityId: undefined as number | undefined,
    subjectId: 0,
    startTime: '',
    endTime: '',
    date: '',
    dayOfWeek: 0,
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
      } catch (err) {
        console.error('خطأ في تحميل البيانات:', err);
        setError('حدث خطأ في تحميل البيانات');
      }
    };

    if (open) {
      loadData();
    }
  }, [open]);

  // تحميل بيانات الموعد عند فتح النافذة
  useEffect(() => {
    if (open && appointment) {
      setFormData({
        type: appointment.type,
        entityName: appointment.entityName,
        entityId: appointment.entityId,
        subjectId: appointment.subjectId,
        startTime: appointment.startTime,
        endTime: appointment.endTime || '',
        date: appointment.date || '',
        dayOfWeek: appointment.dayOfWeek || 0,
        isRepeating: appointment.isRepeating,
        repeatStartDate: appointment.repeatStartDate || '',
        repeatEndDate: appointment.repeatEndDate || '',
        sessionType: appointment.sessionType || 'شتوي',
        notes: appointment.notes || ''
      });
      setError(null);
    }
  }, [open, appointment]);

  const handleSubmit = async () => {
    if (!appointment?.id) return;

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

      // التحقق من تعارض المواعيد (باستثناء الموعد الحالي)
      const checkDate = formData.isRepeating ? formData.repeatStartDate : formData.date;
      const hasConflict = await db.checkAppointmentConflict(
        checkDate,
        formData.startTime,
        formData.endTime || formData.startTime,
        appointment.id
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

      // تحديث الموعد
      const updateData: Partial<Appointment> = {
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

      await db.updateAppointment(appointment.id, updateData);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('خطأ في تحديث الموعد:', err);
      setError('حدث خطأ في تحديث الموعد');
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

  if (!appointment) {
    return null;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ar}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
            m: 1
          }
        }}
      >
        <DialogTitle sx={{
          backgroundColor: '#000',
          color: 'white',
          textAlign: 'center',
          py: isMobile ? 2 : 3,
          fontWeight: 'bold',
          fontSize: isMobile ? '1.1rem' : '1.25rem',
          mb: '20px'
        }}>
          تعديل الموعد
        </DialogTitle>

        <DialogContent sx={{
          p: 3,
          pt: 4
        }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={isMobile ? 2 : 3}>
            {/* نوع الموعد */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>نوع الموعد</InputLabel>
                <Select
                  value={formData.type}
                  label="نوع الموعد"
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    type: e.target.value as any,
                    entityName: prev.type === e.target.value ? prev.entityName : '',
                    entityId: prev.type === e.target.value ? prev.entityId : undefined
                  }))}
                >
                  <MenuItem value="private">درس خصوصي</MenuItem>
                  <MenuItem value="institute">معهد</MenuItem>
                  <MenuItem value="school">مدرسة</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* الكيان (طالب/معهد/مدرسة) */}
            <Grid item xs={12}>
              {formData.type === 'private' ? (
                <TextField
                  fullWidth
                  label="اسم الطالب"
                  value={formData.entityName}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    entityName: e.target.value 
                  }))}
                  placeholder="أدخل اسم الطالب"
                />
              ) : (
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
                    />
                  )}
                />
              )}
            </Grid>

            {/* المادة */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>المادة</InputLabel>
                <Select
                  value={formData.subjectId}
                  label="المادة"
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    subjectId: e.target.value as number
                  }))}
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

            {/* الأوقات */}
            <Grid item xs={formData.type === 'private' ? 12 : 6}>
              <TextField
                fullWidth
                label="وقت البداية"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  startTime: e.target.value
                }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* وقت النهاية فقط للمعاهد والمدارس */}
            {formData.type !== 'private' && (
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="وقت النهاية"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    endTime: e.target.value
                  }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}

            {/* التكرار */}
            <Grid item xs={12}>
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
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>يوم الأسبوع</InputLabel>
                    <Select
                      value={formData.dayOfWeek}
                      label="يوم الأسبوع"
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        dayOfWeek: e.target.value as number
                      }))}
                    >
                      {DAYS_OF_WEEK.map((day, index) => (
                        <MenuItem key={index} value={index}>
                          {day}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="تاريخ بدء التكرار"
                    type="date"
                    value={formData.repeatStartDate}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      repeatStartDate: e.target.value
                    }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="تاريخ انتهاء التكرار"
                    type="date"
                    value={formData.repeatEndDate}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      repeatEndDate: e.target.value
                    }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            ) : (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="التاريخ"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    date: e.target.value
                  }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}

            {/* نوع الجلسة للمعاهد والمدارس */}
            {formData.type !== 'private' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>نوع الجلسة</InputLabel>
                  <Select
                    value={formData.sessionType}
                    label="نوع الجلسة"
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      sessionType: e.target.value as any
                    }))}
                  >
                    {SESSION_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* ملاحظات */}
            <Grid item xs={12}>
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
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{
          p: 3,
          gap: 1
        }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{
              minWidth: 100,
              backgroundColor: '#000',
              '&:hover': { backgroundColor: '#333' }
            }}
          >
            {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
