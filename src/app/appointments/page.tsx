'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  IconButton,
  Fab,
  Chip,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Checkbox,
  Autocomplete,
  Collapse,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DeleteSweep as DeleteSweepIcon
} from '@mui/icons-material';
import { db } from '@/lib/database';
import type { Appointment, Subject, Institute } from '@/lib/database';
import EditAppointmentDialog from '@/components/EditAppointmentDialog';
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import TimeSelector from '@/components/TimeSelector';
import DateSelector from '@/components/DateSelector';

// أسماء الأيام بالعربية (تبدأ من السبت)
const DAYS_OF_WEEK = [
  'السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'
];

// ألوان المواعيد حسب النوع
const APPOINTMENT_COLORS = {
  private: '#1976d2', // أزرق للدروس الخصوصية
  institute: '#388e3c', // أخضر للمعاهد
  school: '#f57c00' // برتقالي للمدارس
};

interface WeekData {
  startDate: Date;
  endDate: Date;
  days: Date[];
}

export default function AppointmentsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // دالة لتحويل الوقت من 24 ساعة إلى 12 ساعة مع ص/م
  const formatTime12Hour = (time24: string): string => {
    if (!time24) return '';

    const [hours, minutes] = time24.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const period = hour24 < 12 ? 'ص' : 'م';

    // التأكد من عرض الدقائق بصفرين
    const formattedMinutes = minutes.padStart(2, '0');

    return `${hour12}:${formattedMinutes} ${period}`;
  };

  // دالة لتحويل الوقت إلى دقائق للمقارنة
  const timeToMinutes = (time: string): number => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // دالة للتحقق من تضارب المواعيد
  const checkAppointmentConflict = async (newAppointment: any): Promise<string | null> => {
    try {
      const appointmentsOnDate = await db.getAppointmentsForDate(newAppointment.date);

      const newStart = timeToMinutes(newAppointment.startTime);
      const newEnd = newAppointment.endTime ? timeToMinutes(newAppointment.endTime) : newStart + 60; // افتراض ساعة واحدة للدروس الخصوصية

      for (const existing of appointmentsOnDate) {
        const existingStart = timeToMinutes(existing.startTime);
        const existingEnd = existing.endTime ? timeToMinutes(existing.endTime) : existingStart + 60;

        // التحقق من التداخل
        if ((newStart < existingEnd && newEnd > existingStart)) {
          const conflictType = existing.type === 'private' ? 'درس خصوصي' :
                              existing.type === 'institute' ? 'معهد' : 'مدرسة';
          return `يتضارب هذا الموعد مع ${conflictType} موجود من ${formatTime12Hour(existing.startTime)}${existing.endTime ? ` إلى ${formatTime12Hour(existing.endTime)}` : ''}`;
        }
      }

      return null; // لا يوجد تضارب
    } catch (error) {
      console.error('خطأ في التحقق من التضارب:', error);
      return null;
    }
  };
  
  const [currentWeek, setCurrentWeek] = useState<WeekData>(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    // تعديل لجعل الأسبوع يبدأ من السبت
    const dayOfWeek = today.getDay(); // 0=الأحد, 6=السبت
    const daysFromSaturday = dayOfWeek === 6 ? 0 : dayOfWeek + 1; // المسافة من السبت
    startOfWeek.setDate(today.getDate() - daysFromSaturday); // السبت

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // الجمعة

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    return { startDate: startOfWeek, endDate: endOfWeek, days };
  });
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // بيانات النموذج
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [formData, setFormData] = useState({
    type: 'private' as 'private' | 'institute' | 'school',
    entityName: '',
    entityId: undefined as number | undefined,
    subjectId: 0,
    startTime: '',
    endTime: '',
    date: '',
    dayOfWeek: 0,
    selectedDays: [] as number[],
    isRepeating: false,
    repeatStartDate: '',
    repeatEndDate: '',
    sessionType: 'شتوي' as 'شتوي' | 'صيفي' | 'مكثفات' | 'امتحانية',
    notes: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // حالات الانيميشن
  const [isWeekTransitioning, setIsWeekTransitioning] = useState(false);
  const [weekTransitionDirection, setWeekTransitionDirection] = useState<'next' | 'prev'>('next');
  const [isDayTransitioning, setIsDayTransitioning] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // تحميل المواعيد للأسبوع الحالي
  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const startDateString = currentWeek.startDate.toISOString().split('T')[0];
      const weekAppointments = await db.getAppointmentsForWeek(startDateString);
      
      setAppointments(weekAppointments);
    } catch (err) {
      console.error('خطأ في تحميل المواعيد:', err);
      setError('حدث خطأ في تحميل المواعيد');
    } finally {
      setLoading(false);
    }
  };

  // تحميل البيانات المطلوبة للنموذج
  const loadFormData = async () => {
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
      setFormError('حدث خطأ في تحميل البيانات');
    }
  };

  useEffect(() => {
    loadAppointments();
    loadFormData();
  }, [currentWeek]);

  // دوال معالجة النموذج
  const handleEntityChange = (value: any) => {
    if (value) {
      setFormData(prev => ({
        ...prev,
        entityId: value.id,
        entityName: value.name
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        entityId: undefined,
        entityName: ''
      }));
    }
  };

  const getEntityOptions = () => {
    return institutes.filter(inst => inst.type === formData.type);
  };

  const resetForm = () => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    setFormData({
      type: 'private',
      entityName: '',
      entityId: undefined,
      subjectId: subjects.length > 0 ? subjects[0].id! : 0,
      startTime: '',
      endTime: '',
      date: selectedDay ? selectedDay.toISOString().split('T')[0] : todayString,
      dayOfWeek: selectedDay ? (selectedDay.getDay() === 6 ? 0 : selectedDay.getDay() + 1) : 0,
      selectedDays: [],
      isRepeating: false,
      repeatStartDate: todayString,
      repeatEndDate: '',
      sessionType: 'شتوي',
      notes: ''
    });

    // مسح رسائل الخطأ
    setFormError(null);
    setFormLoading(false);
  };

  // دالة لفتح النموذج مع إعادة تعيين كاملة
  const openAddForm = () => {
    // إعادة تعيين النموذج أولاً
    resetForm();

    // إظهار النموذج
    setShowAddForm(true);

    // التمرير إلى قسم إضافة الموعد مع انيميشن محسن
    setTimeout(() => {
      const addSection = document.getElementById('add-appointment-section');
      if (addSection) {
        addSection.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 300);
  };

  // دالة لإغلاق النموذج مع إعادة تعيين كاملة
  const closeAddForm = () => {
    setShowAddForm(false);
    resetForm();
  };

  const handleSubmitForm = async () => {
    try {
      setFormLoading(true);
      setFormError(null);

      // تعيين التاريخ المحدد تلقائياً إذا لم يكن متكرراً
      let finalFormData = { ...formData };
      if (!finalFormData.isRepeating && selectedDay && !finalFormData.date) {
        finalFormData.date = selectedDay.toISOString().split('T')[0];
      }

      // التحقق من صحة البيانات - تحسين شامل

      // 1. التحقق من اختيار المادة (إجباري لجميع الأنواع)
      if (!finalFormData.subjectId || finalFormData.subjectId === 0) {
        setFormError('يرجى اختيار المادة قبل حفظ الموعد');
        return;
      }

      // 2. التحقق من اسم الطالب للدروس الخصوصية
      if (finalFormData.type === 'private') {
        if (!finalFormData.entityName.trim()) {
          setFormError('يرجى إدخال اسم الطالب للدروس الخصوصية');
          return;
        }
      } else {
        // 3. التحقق من اختيار المعهد/المدرسة للمواعيد غير الخصوصية
        if (!finalFormData.entityId || !finalFormData.entityName.trim()) {
          const entityType = finalFormData.type === 'institute' ? 'المعهد' : 'المدرسة';
          setFormError(`يرجى اختيار ${entityType} من القائمة`);
          return;
        }
      }

      // 4. التحقق من وقت البداية
      if (!finalFormData.startTime) {
        setFormError('يرجى تحديد وقت البداية');
        return;
      }

      // 5. التحقق من وقت النهاية للمعاهد والمدارس
      if (finalFormData.type !== 'private' && !finalFormData.endTime) {
        setFormError('يرجى تحديد وقت النهاية للمعاهد والمدارس');
        return;
      }

      // 6. التحقق من التاريخ للمواعيد غير المتكررة
      if (!finalFormData.isRepeating && !finalFormData.date) {
        setFormError('يرجى تحديد التاريخ للمواعيد غير المتكررة');
        return;
      }

      // 7. التحقق من فترة التكرار للمواعيد المتكررة
      if (finalFormData.isRepeating && (!finalFormData.repeatStartDate || !finalFormData.repeatEndDate)) {
        setFormError('يرجى تحديد فترة التكرار للمواعيد المتكررة');
        return;
      }

      // 7.5. التحقق من اختيار أيام الأسبوع للمواعيد المتكررة
      if (finalFormData.isRepeating && finalFormData.selectedDays.length === 0) {
        setFormError('يرجى اختيار يوم واحد على الأقل من أيام الأسبوع');
        return;
      }

      // 8. التحقق من وجود المادة في قاعدة البيانات
      const subject = subjects.find(s => s.id === finalFormData.subjectId);
      if (!subject) {
        setFormError('المادة المحددة غير موجودة، يرجى اختيار مادة صحيحة');
        return;
      }

      // 9. التحقق من تضارب المواعيد
      const conflictMessage = await checkAppointmentConflict(finalFormData);
      if (conflictMessage) {
        setFormError(conflictMessage);
        return;
      }

      // إنشاء المواعيد
      if (finalFormData.isRepeating && finalFormData.selectedDays.length > 0) {
        // إنشاء موعد لكل يوم محدد
        for (const dayIndex of finalFormData.selectedDays) {
          const appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'> = {
            type: finalFormData.type,
            entityName: finalFormData.entityName,
            entityId: finalFormData.entityId,
            subjectId: finalFormData.subjectId,
            subjectName: subject.name,
            startTime: finalFormData.startTime,
            endTime: finalFormData.endTime || undefined,
            date: undefined,
            dayOfWeek: dayIndex,
            isRepeating: true,
            repeatStartDate: finalFormData.repeatStartDate,
            repeatEndDate: finalFormData.repeatEndDate,
            sessionType: finalFormData.type !== 'private' ? finalFormData.sessionType : undefined,
            notes: finalFormData.notes || undefined
          };

          await db.addAppointment(appointmentData);
        }
      } else {
        // إنشاء موعد واحد غير متكرر
        const appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'> = {
          type: finalFormData.type,
          entityName: finalFormData.entityName,
          entityId: finalFormData.entityId,
          subjectId: finalFormData.subjectId,
          subjectName: subject.name,
          startTime: finalFormData.startTime,
          endTime: finalFormData.endTime || undefined,
          date: finalFormData.date,
          dayOfWeek: undefined,
          isRepeating: false,
          repeatStartDate: undefined,
          repeatEndDate: undefined,
          sessionType: finalFormData.type !== 'private' ? finalFormData.sessionType : undefined,
          notes: finalFormData.notes || undefined
        };

        await db.addAppointment(appointmentData);
      }

      // تحديث فوري للمواعيد لضمان ظهورها في التقويم
      await loadAppointments();

      // إعادة تعيين النموذج وإخفاؤه
      resetForm();
      setShowAddForm(false);

      // تحديث إضافي بعد تأخير قصير للتأكد من التحديث
      setTimeout(async () => {
        await loadAppointments();
      }, 100);

    } catch (err) {
      console.error('خطأ في حفظ الموعد:', err);
      setFormError('حدث خطأ في حفظ الموعد');
    } finally {
      setFormLoading(false);
    }
  };

  // دوال التعديل والحذف
  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditDialogOpen(true);
  };

  const handleDeleteAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedAppointment?.id) return;

    try {
      await db.deleteAppointment(selectedAppointment.id);
      await loadAppointments();
      setDeleteDialogOpen(false);
      setSelectedAppointment(null);
    } catch (err) {
      console.error('خطأ في حذف الموعد:', err);
      setError('حدث خطأ في حذف الموعد');
    }
  };

  // التنقل بين الأسابيع مع الانيميشن
  const navigateWeek = (direction: 'prev' | 'next') => {
    if (isWeekTransitioning) return; // منع التنقل أثناء الانيميشن

    setIsWeekTransitioning(true);
    setWeekTransitionDirection(direction);

    // تأخير قصير لبدء الانيميشن
    setTimeout(() => {
      const newStartDate = new Date(currentWeek.startDate);
      newStartDate.setDate(newStartDate.getDate() + (direction === 'next' ? 7 : -7));

      const newEndDate = new Date(newStartDate);
      newEndDate.setDate(newStartDate.getDate() + 6);

      const newDays = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(newStartDate);
        day.setDate(newStartDate.getDate() + i);
        newDays.push(day);
      }

      setCurrentWeek({ startDate: newStartDate, endDate: newEndDate, days: newDays });

      // إنهاء الانيميشن بعد تحديث البيانات
      setTimeout(() => {
        setIsWeekTransitioning(false);
      }, 100);
    }, 250);
  };

  // الحصول على مواعيد يوم معين مع التصفية
  const getAppointmentsForDay = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();

    // تحويل dayOfWeek ليتوافق مع الترتيب الجديد (السبت=0, الأحد=1, إلخ)
    const adjustedDayOfWeek = dayOfWeek === 6 ? 0 : dayOfWeek + 1;

    let dayAppointments = appointments.filter(appointment => {
      if (appointment.isRepeating) {
        return appointment.dayOfWeek === adjustedDayOfWeek;
      } else {
        return appointment.date === dateString;
      }
    });

    // تطبيق التصفية حسب النوع
    if (filterType !== 'all') {
      dayAppointments = dayAppointments.filter(appointment => appointment.type === filterType);
    }

    return dayAppointments;
  };

  // تنسيق التاريخ
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // تنسيق نطاق الأسبوع
  const formatWeekRange = (startDate: Date, endDate: Date) => {
    const start = startDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const end = endDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    return `${start} - ${end}`;
  };

  // حذف جميع المواعيد
  const handleDeleteAllAppointments = async () => {
    try {
      setDeleteLoading(true);
      await db.clearAllAppointments();
      await loadAppointments();
      setSelectedDay(null); // إخفاء جدول اليوم المحدد
      setDeleteDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'تم حذف جميع المواعيد بنجاح',
        severity: 'success'
      });
    } catch (error) {
      console.error('خطأ في حذف المواعيد:', error);
      setSnackbar({
        open: true,
        message: 'حدث خطأ أثناء حذف المواعيد',
        severity: 'error'
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // الحصول على أيقونة نوع الموعد
  const getAppointmentIcon = (type: string) => {
    switch (type) {
      case 'private':
        return <PersonIcon fontSize="small" />;
      case 'institute':
        return <BusinessIcon fontSize="small" />;
      case 'school':
        return <SchoolIcon fontSize="small" />;
      default:
        return <PersonIcon fontSize="small" />;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          جاري تحميل المواعيد...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* رأس الصفحة */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          mb: 3, 
          background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
          color: 'white'
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" sx={{ color: 'white' }}>
              إدارة المواعيد
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.8, mt: 1, color: 'white' }}>
              {formatWeekRange(currentWeek.startDate, currentWeek.endDate)}
            </Typography>
          </Box>

          {/* أزرار التنقل */}
          <Box display="flex" alignItems="center" gap={0.5}>
            <IconButton
              onClick={() => navigateWeek('prev')}
              disabled={isWeekTransitioning}
              className="btn-animated btn-press transition-all hover-scale"
              sx={{
                color: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  transform: 'scale(1.1)',
                  boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)'
                },
                '&:active': {
                  transform: 'scale(0.95)'
                },
                '&:disabled': {
                  opacity: 0.5,
                  transform: 'none'
                }
              }}
            >
              <ChevronRightIcon />
            </IconButton>

            <Typography variant="body2" sx={{ mx: 1, minWidth: '60px', textAlign: 'center', color: 'white' }}>
              الأسبوع
            </Typography>

            <IconButton
              onClick={() => navigateWeek('next')}
              disabled={isWeekTransitioning}
              className="btn-animated btn-press transition-all hover-scale"
              sx={{
                color: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  transform: 'scale(1.1)',
                  boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)'
                },
                '&:active': {
                  transform: 'scale(0.95)'
                },
                '&:disabled': {
                  opacity: 0.5,
                  transform: 'none'
                }
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* أزرار التصفية */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <Typography variant="body2" fontWeight="bold" sx={{ mr: 1 }}>
            تصفية حسب النوع:
          </Typography>

          <Chip
            label="الكل"
            onClick={() => setFilterType('all')}
            color={filterType === 'all' ? 'primary' : 'default'}
            variant={filterType === 'all' ? 'filled' : 'outlined'}
            sx={{
              backgroundColor: filterType === 'all' ? '#000' : 'transparent',
              color: filterType === 'all' ? 'white' : 'inherit',
              '&:hover': {
                backgroundColor: filterType === 'all' ? '#333' : 'rgba(0,0,0,0.1)'
              }
            }}
          />

          <Chip
            label="دروس خصوصية"
            onClick={() => setFilterType('private')}
            color={filterType === 'private' ? 'primary' : 'default'}
            variant={filterType === 'private' ? 'filled' : 'outlined'}
            sx={{
              backgroundColor: filterType === 'private' ? APPOINTMENT_COLORS.private : 'transparent',
              color: filterType === 'private' ? 'white' : 'inherit',
              '&:hover': {
                backgroundColor: filterType === 'private' ? APPOINTMENT_COLORS.private : 'rgba(25,118,210,0.1)'
              }
            }}
          />

          <Chip
            label="معاهد"
            onClick={() => setFilterType('institute')}
            color={filterType === 'institute' ? 'primary' : 'default'}
            variant={filterType === 'institute' ? 'filled' : 'outlined'}
            sx={{
              backgroundColor: filterType === 'institute' ? APPOINTMENT_COLORS.institute : 'transparent',
              color: filterType === 'institute' ? 'white' : 'inherit',
              '&:hover': {
                backgroundColor: filterType === 'institute' ? APPOINTMENT_COLORS.institute : 'rgba(56,142,60,0.1)'
              }
            }}
          />

          <Chip
            label="مدارس"
            onClick={() => setFilterType('school')}
            color={filterType === 'school' ? 'primary' : 'default'}
            variant={filterType === 'school' ? 'filled' : 'outlined'}
            sx={{
              backgroundColor: filterType === 'school' ? APPOINTMENT_COLORS.school : 'transparent',
              color: filterType === 'school' ? 'white' : 'inherit',
              '&:hover': {
                backgroundColor: filterType === 'school' ? APPOINTMENT_COLORS.school : 'rgba(245,124,0,0.1)'
              }
            }}
          />
        </Box>
      </Paper>

      {/* بطاقات الأيام */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
        <Box
          sx={{
            width: '100%',
            maxWidth: isMobile ? '100%' : '800px',
            transition: 'all 0.5s ease',
            opacity: isWeekTransitioning ? 0 : 1,
            transform: isWeekTransitioning
              ? `translateX(${weekTransitionDirection === 'next' ? '50px' : '-50px'})`
              : 'translateX(0)'
          }}
          className={isWeekTransitioning ? 'week-transitioning' : ''}
        >
          {/* الصف الأول: السبت إلى الثلاثاء */}
          <Grid container spacing={isMobile ? 0.5 : 2} sx={{ mb: isMobile ? 1 : 2 }} justifyContent="center">
            {currentWeek.days.slice(0, 4).map((day, index) => {
              const dayAppointments = getAppointmentsForDay(day);
              const isToday = day.toDateString() === new Date().toDateString();
              const isSelected = selectedDay?.toDateString() === day.toDateString();

              return (
                <Grid item xs={3} sm={3} md={3} key={index}>
                  <Card
                    elevation={isSelected ? 4 : (isToday ? 2 : 1)}
                    className={`day-card ${isSelected ? 'selected' : ''} transition-all hover-lift`}
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: isSelected ? '2px solid #f5f5f5' : (isToday ? '2px solid #000' : 'none'),
                      backgroundColor: isSelected ? '#f5f5f5' : 'white',
                      color: isSelected ? '#333' : 'inherit',
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                      '&:hover': {
                        transform: isSelected ? 'scale(1.02) translateY(-3px)' : 'translateY(-3px)',
                        boxShadow: isSelected ? 6 : 4
                      },
                      '&:active': {
                        transform: 'scale(0.98)',
                        transition: 'transform 0.1s ease'
                      }
                    }}
                    onClick={() => {
                      setIsDayTransitioning(true);
                      setTimeout(() => {
                        setSelectedDay(day);
                        setIsDayTransitioning(false);
                      }, 150);
                    }}
                  >
                    <CardContent sx={{
                      p: isMobile ? 1 : 2,
                      textAlign: 'center',
                      '&:last-child': { pb: isMobile ? 1 : 2 }
                    }}>
                      <Typography
                        variant={isMobile ? "body2" : "h6"}
                        fontWeight="bold"
                        sx={{ mb: 0.5 }}
                      >
                        {DAYS_OF_WEEK[index]}
                      </Typography>
                      <Typography
                        variant={isMobile ? "caption" : "body2"}
                        sx={{
                          opacity: isSelected ? 0.8 : 0.7,
                          fontSize: isMobile ? '0.7rem' : '0.875rem'
                        }}
                      >
                        {formatDate(day)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* الصف الثاني: الأربعاء والخميس والجمعة */}
          <Grid container spacing={isMobile ? 0.5 : 2} justifyContent="center">
            {currentWeek.days.slice(4, 7).map((day, index) => {
              const dayAppointments = getAppointmentsForDay(day);
              const isToday = day.toDateString() === new Date().toDateString();
              const isSelected = selectedDay?.toDateString() === day.toDateString();
              const actualIndex = index + 4; // للحصول على الفهرس الصحيح في DAYS_OF_WEEK

              return (
                <Grid item xs={4} sm={4} md={3} key={actualIndex}>
                  <Card
                    elevation={isSelected ? 4 : (isToday ? 2 : 1)}
                    className={`day-card ${isSelected ? 'selected' : ''} transition-all hover-lift`}
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: isSelected ? '2px solid #f5f5f5' : (isToday ? '2px solid #000' : 'none'),
                      backgroundColor: isSelected ? '#f5f5f5' : 'white',
                      color: isSelected ? '#333' : 'inherit',
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                      '&:hover': {
                        transform: isSelected ? 'scale(1.02) translateY(-3px)' : 'translateY(-3px)',
                        boxShadow: isSelected ? 6 : 4
                      },
                      '&:active': {
                        transform: 'scale(0.98)',
                        transition: 'transform 0.1s ease'
                      }
                    }}
                    onClick={() => {
                      setIsDayTransitioning(true);
                      setTimeout(() => {
                        setSelectedDay(day);
                        setIsDayTransitioning(false);
                      }, 150);
                    }}
                  >
                    <CardContent sx={{
                      p: isMobile ? 1 : 2,
                      textAlign: 'center',
                      '&:last-child': { pb: isMobile ? 1 : 2 }
                    }}>
                      <Typography
                        variant={isMobile ? "body2" : "h6"}
                        fontWeight="bold"
                        sx={{ mb: 0.5 }}
                      >
                        {DAYS_OF_WEEK[actualIndex]}
                      </Typography>
                      <Typography
                        variant={isMobile ? "caption" : "body2"}
                        sx={{
                          opacity: isSelected ? 0.8 : 0.7,
                          fontSize: isMobile ? '0.7rem' : '0.875rem'
                        }}
                      >
                        {formatDate(day)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Box>



      {/* جدول مواعيد اليوم المحدد */}
      {selectedDay && (
        <Paper
          elevation={2}
          sx={{
            mb: 3,
            overflow: 'hidden',
            opacity: isDayTransitioning ? 0 : 1,
            transform: isDayTransitioning ? 'translateY(20px)' : 'translateY(0)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          className="day-appointments-container fade-in"
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              p: 3,
              backgroundColor: '#f5f5f5',
              borderBottom: '1px solid #e0e0e0'
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              مواعيد يوم {DAYS_OF_WEEK[selectedDay.getDay() === 6 ? 0 : selectedDay.getDay() + 1]}
            </Typography>
            <Button
              variant="contained"
              onClick={openAddForm}
              className="btn-animated btn-press transition-all hover-lift"
              sx={{
                backgroundColor: '#000',
                '&:hover': {
                  backgroundColor: '#333',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                },
                '&:active': {
                  transform: 'scale(0.95)'
                },
                whiteSpace: 'nowrap',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              إضافة موعد
            </Button>
          </Box>

          {(() => {
            const dayAppointments = getAppointmentsForDay(selectedDay)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            if (dayAppointments.length === 0) {
              return (
                <Box textAlign="center" py={6}>
                  <Typography variant="body1" color="text.secondary" mb={2}>
                    لا توجد مواعيد في هذا اليوم
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={openAddForm}
                  >
                    إضافة أول موعد
                  </Button>
                </Box>
              );
            }

            return (
              <TableContainer
                sx={{
                  overflowX: 'auto',
                  '& .MuiTable-root': {
                    minWidth: isMobile ? '100%' : '650px'
                  }
                }}
              >
                <Table
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    '& .MuiTableCell-root': {
                      borderBottom: '1px solid #e0e0e0'
                    }
                  }}
                >
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          fontSize: isMobile ? '0.75rem' : '1rem',
                          padding: isMobile ? '8px 4px' : '16px',
                          width: isMobile ? '20%' : 'auto'
                        }}
                      >
                        الوقت
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          fontSize: isMobile ? '0.75rem' : '1rem',
                          padding: isMobile ? '8px 4px' : '16px',
                          width: isMobile ? '25%' : 'auto',
                          textAlign: 'center'
                        }}
                      >
                        النوع
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          fontSize: isMobile ? '0.75rem' : '1rem',
                          padding: isMobile ? '8px 4px' : '16px',
                          width: isMobile ? '35%' : 'auto',
                          textAlign: 'center'
                        }}
                      >
                        الاسم
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          fontSize: isMobile ? '0.75rem' : '1rem',
                          padding: isMobile ? '8px 4px' : '16px',
                          width: isMobile ? '20%' : 'auto'
                        }}
                      >
                        الإجراءات
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dayAppointments.map((appointment, idx) => (
                      <TableRow
                        key={`${appointment.id}-${idx}`}
                        sx={{
                          '&:hover': { backgroundColor: '#f5f5f5' },
                          borderLeft: `4px solid ${APPOINTMENT_COLORS[appointment.type]}`
                        }}
                      >
                        <TableCell
                          sx={{
                            padding: isMobile ? '8px 4px' : '16px',
                            fontSize: isMobile ? '0.75rem' : '1rem',
                            width: isMobile ? '20%' : 'auto'
                          }}
                        >
                          <Box>
                            {appointment.type === 'private' ? (
                              // عرض وقت واحد للدروس الخصوصية
                              <Typography
                                variant={isMobile ? "body2" : "body1"}
                                fontWeight="bold"
                                sx={{ fontSize: isMobile ? '0.7rem' : '1rem' }}
                              >
                                {formatTime12Hour(appointment.startTime)}
                              </Typography>
                            ) : (
                              // عرض وقت البداية والانتهاء في سطرين منفصلين للمعاهد والمدارس
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                <Typography
                                  variant={isMobile ? "caption" : "body2"}
                                  fontWeight="bold"
                                  sx={{ fontSize: isMobile ? '0.65rem' : '0.875rem' }}
                                >
                                  {formatTime12Hour(appointment.startTime)}
                                </Typography>
                                {appointment.endTime && (
                                  <Typography
                                    variant={isMobile ? "caption" : "body2"}
                                    fontWeight="bold"
                                    sx={{ fontSize: isMobile ? '0.65rem' : '0.875rem' }}
                                  >
                                    {formatTime12Hour(appointment.endTime)}
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </Box>
                        </TableCell>

                        <TableCell
                          sx={{
                            padding: isMobile ? '8px 4px' : '16px',
                            width: isMobile ? '25%' : 'auto',
                            textAlign: 'center'
                          }}
                        >
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Chip
                              label={appointment.type === 'private' ? 'خصوصي' :
                                    appointment.type === 'institute' ? 'معهد' : 'مدرسة'}
                              size={isMobile ? "small" : "medium"}
                              sx={{
                                backgroundColor: APPOINTMENT_COLORS[appointment.type] + '20',
                                color: APPOINTMENT_COLORS[appointment.type],
                                fontWeight: 'bold',
                                fontSize: isMobile ? '0.6rem' : '0.75rem',
                                height: isMobile ? '18px' : 'auto',
                                minWidth: isMobile ? '50px' : 'auto'
                              }}
                            />
                            {appointment.sessionType && (
                              <Chip
                                label={appointment.sessionType}
                                size={isMobile ? "small" : "medium"}
                                variant="outlined"
                                sx={{
                                  mt: '5px',
                                  fontSize: isMobile ? '0.6rem' : '0.75rem',
                                  height: isMobile ? '18px' : 'auto',
                                  minWidth: isMobile ? '50px' : 'auto'
                                }}
                              />
                            )}
                          </Box>
                        </TableCell>

                        <TableCell
                          sx={{
                            padding: isMobile ? '8px 4px' : '16px',
                            width: isMobile ? '35%' : 'auto',
                            textAlign: 'center'
                          }}
                        >
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography
                              variant={isMobile ? "body2" : "body1"}
                              fontWeight="bold"
                              sx={{ fontSize: isMobile ? '0.7rem' : '1rem' }}
                            >
                              {appointment.entityName}
                            </Typography>
                            <Typography
                              variant={isMobile ? "caption" : "body2"}
                              color="text.secondary"
                              sx={{ fontSize: isMobile ? '0.6rem' : '0.875rem' }}
                            >
                              {appointment.subjectName}
                            </Typography>
                            {appointment.notes && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontSize: isMobile ? '0.55rem' : '0.75rem' }}
                              >
                                {appointment.notes}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>

                        <TableCell
                          sx={{
                            padding: isMobile ? '8px 4px' : '16px',
                          }}
                        >
                          <Box display="flex" gap={isMobile ? 0.25 : 0.5}>
                            <IconButton
                              size={isMobile ? "small" : "medium"}
                              onClick={() => handleEditAppointment(appointment)}
                              sx={{
                                backgroundColor: 'rgba(0,0,0,0.1)',
                                '&:hover': { backgroundColor: 'rgba(0,0,0,0.2)' },
                                width: isMobile ? '28px' : 'auto',
                                height: isMobile ? '28px' : 'auto'
                              }}
                            >
                              <EditIcon fontSize={isMobile ? "small" : "medium"} />
                            </IconButton>
                            <IconButton
                              size={isMobile ? "small" : "medium"}
                              onClick={() => handleDeleteAppointment(appointment)}
                              sx={{
                                backgroundColor: 'rgba(244,67,54,0.1)',
                                color: '#f44336',
                                '&:hover': { backgroundColor: 'rgba(244,67,54,0.2)' },
                                width: isMobile ? '28px' : 'auto',
                                height: isMobile ? '28px' : 'auto'
                              }}
                            >
                              <DeleteIcon fontSize={isMobile ? "small" : "medium"} />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            );
          })()}
        </Paper>
      )}

      {/* زر حذف جميع المواعيد */}
      {appointments.length > 0 && (
        <Box sx={{ mt: 3, mb: 2, textAlign: 'center' }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={deleteLoading ? <CircularProgress size={20} /> : undefined}
            onClick={() => setDeleteDialogOpen(true)}
            disabled={deleteLoading}
            className="btn-animated btn-press transition-all hover-lift"
            sx={{
              borderColor: '#d32f2f',
              color: '#d32f2f',
              px: { xs: 2, md: 3 },
              py: { xs: 1, md: 1.2 },
              fontSize: { xs: '0.875rem', md: '1rem' },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                borderColor: '#b71c1c',
                backgroundColor: 'rgba(211, 47, 47, 0.04)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(211, 47, 47, 0.2)'
              },
              '&:active': {
                transform: 'scale(0.95)'
              },
              '&:disabled': {
                borderColor: '#ccc',
                color: '#ccc',
                transform: 'none'
              }
            }}
          >
            {deleteLoading ? 'جاري الحذف...' : 'حذف جميع المواعيد'}
          </Button>
        </Box>
      )}

      {/* قسم إضافة موعد جديد */}
      <Collapse in={showAddForm}>
        <Paper elevation={2} sx={{ mb: 3, overflow: 'hidden' }} id="add-appointment-section">
          <Box
            sx={{
              p: 3,
              backgroundColor: '#000',
              color: 'white',
              textAlign: 'center'
            }}
          >
            <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
              إضافة موعد جديد
            </Typography>
          </Box>

          <Box sx={{ p: 3 }}>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}

            <Grid container spacing={3}>
              {formData.type === 'private' ? (
                // تخطيط للدروس الخصوصية
                <>
                  {/* الصف الأول: نوع الموعد والمادة */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Box sx={{ width: '100%', maxWidth: '800px' }}>
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
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
                              >
                                <MenuItem value="private">درس خصوصي</MenuItem>
                                <MenuItem value="institute">معهد</MenuItem>
                                <MenuItem value="school">مدرسة</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <FormControl
                              fullWidth
                              error={!formData.subjectId || formData.subjectId === 0}
                              required
                            >
                              <InputLabel>
                                <Box component="span">
                                  المادة
                                  <Box component="span" sx={{ color: 'red', ml: 0.5 }}>*</Box>
                                </Box>
                              </InputLabel>
                              <Select
                                value={formData.subjectId}
                                label="المادة *"
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
                              {(!formData.subjectId || formData.subjectId === 0) && (
                                <Box sx={{ color: '#d32f2f', fontSize: '0.75rem', mt: 0.5, ml: 2 }}>
                                  هذا الحقل مطلوب
                                </Box>
                              )}
                            </FormControl>
                          </Grid>
                        </Grid>
                      </Box>
                    </Box>
                  </Grid>

                  {/* الصف الثاني: اسم الطالب */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Box sx={{ width: '100%', maxWidth: '800px' }}>
                        <TextField
                          fullWidth
                          label={
                            <Box component="span">
                              اسم الطالب
                              <Box component="span" sx={{ color: 'red', ml: 0.5 }}>*</Box>
                            </Box>
                          }
                          value={formData.entityName}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            entityName: e.target.value
                          }))}
                          placeholder="أدخل اسم الطالب"
                          required
                          error={formData.type === 'private' && !formData.entityName.trim()}
                          helperText={
                            formData.type === 'private' && !formData.entityName.trim()
                              ? 'هذا الحقل مطلوب'
                              : ''
                          }
                        />
                      </Box>
                    </Box>
                  </Grid>
                </>
              ) : (
                // تخطيط للمعاهد والمدارس
                <>
                  {/* الصف الأول: نوع الموعد واسم المعهد/المدرسة */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Box sx={{ width: '100%', maxWidth: '800px' }}>
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
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
                              >
                                <MenuItem value="private">درس خصوصي</MenuItem>
                                <MenuItem value="institute">معهد</MenuItem>
                                <MenuItem value="school">مدرسة</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Autocomplete
                              options={getEntityOptions()}
                              getOptionLabel={(option) => option.name}
                              value={getEntityOptions().find(opt => opt.id === formData.entityId) || null}
                              onChange={(_, value) => handleEntityChange(value)}
                              sx={{
                                '& .MuiAutocomplete-inputRoot': {
                                  paddingRight: '60px !important'
                                },
                                '& .MuiInputBase-input': {
                                  paddingRight: '60px !important'
                                }
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label={
                                    <Box component="span">
                                      {formData.type === 'institute' ? 'اختر المعهد' : 'اختر المدرسة'}
                                      <Box component="span" sx={{ color: 'red', ml: 0.5 }}>*</Box>
                                    </Box>
                                  }
                                  placeholder={formData.type === 'institute' ? 'ابحث عن معهد...' : 'ابحث عن مدرسة...'}
                                  required
                                  error={formData.type !== 'private' && (!formData.entityId || !formData.entityName.trim())}
                                  helperText={
                                    formData.type !== 'private' && (!formData.entityId || !formData.entityName.trim())
                                      ? 'هذا الحقل مطلوب'
                                      : ''
                                  }
                                />
                              )}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    </Box>
                  </Grid>

                  {/* الصف الثاني: المادة ونوع الجلسة */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Box sx={{ width: '100%', maxWidth: '800px' }}>
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <FormControl
                              fullWidth
                              error={!formData.subjectId || formData.subjectId === 0}
                              required
                            >
                              <InputLabel>
                                <Box component="span">
                                  المادة
                                  <Box component="span" sx={{ color: 'red', ml: 0.5 }}>*</Box>
                                </Box>
                              </InputLabel>
                              <Select
                                value={formData.subjectId}
                                label="المادة *"
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
                              {(!formData.subjectId || formData.subjectId === 0) && (
                                <Box sx={{ color: '#d32f2f', fontSize: '0.75rem', mt: 0.5, ml: 2 }}>
                                  هذا الحقل مطلوب
                                </Box>
                              )}
                            </FormControl>
                          </Grid>

                          <Grid item xs={12} md={6}>
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
                                <MenuItem value="شتوي">شتوي</MenuItem>
                                <MenuItem value="صيفي">صيفي</MenuItem>
                                <MenuItem value="مكثفات">مكثفات</MenuItem>
                                <MenuItem value="امتحانية">امتحانية</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                        </Grid>
                      </Box>
                    </Box>
                  </Grid>
                </>
              )}

              {/* قسم الأوقات */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ width: '100%', maxWidth: '800px' }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={formData.type === 'private' ? 12 : 6}>
                        <TimeSelector
                          label="من:"
                          value={formData.startTime}
                          onChange={(time) => setFormData(prev => ({
                            ...prev,
                            startTime: time
                          }))}
                          required
                        />
                      </Grid>

                      {/* وقت النهاية للمعاهد والمدارس */}
                      {formData.type !== 'private' && (
                        <Grid item xs={12} md={6}>
                          <TimeSelector
                            label="إلى:"
                            value={formData.endTime}
                            onChange={(time) => setFormData(prev => ({
                              ...prev,
                              endTime: time
                            }))}
                            defaultPeriod="PM"
                          />
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </Box>
              </Grid>

              {/* التكرار - فقط للمعاهد والمدارس */}
              {formData.type !== 'private' && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Box sx={{ width: '100%', maxWidth: '800px' }}>
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
                    </Box>
                  </Box>
                </Grid>
              )}

              {/* التاريخ أو يوم الأسبوع */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ width: '100%', maxWidth: '800px' }}>
                    {!formData.isRepeating ? (
                      <DateSelector
                        label="التاريخ"
                        value={formData.date}
                        onChange={(date) => setFormData(prev => ({
                          ...prev,
                          date: date
                        }))}
                        required
                      />
                    ) : (
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <Box>
                            <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                              اختر أيام الأسبوع
                            </Typography>
                            <Grid container spacing={1}>
                              {DAYS_OF_WEEK.map((day, index) => (
                                <Grid item xs={6} sm={4} md={3} key={index}>
                                  <FormControlLabel
                                    control={
                                      <Checkbox
                                        checked={formData.selectedDays.includes(index)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setFormData(prev => ({
                                              ...prev,
                                              selectedDays: [...prev.selectedDays, index]
                                            }));
                                          } else {
                                            setFormData(prev => ({
                                              ...prev,
                                              selectedDays: prev.selectedDays.filter(d => d !== index)
                                            }));
                                          }
                                        }}
                                      />
                                    }
                                    label={day}
                                    sx={{
                                      width: '100%',
                                      margin: 0,
                                      '& .MuiFormControlLabel-label': {
                                        fontSize: { xs: '0.875rem', sm: '1rem' }
                                      }
                                    }}
                                  />
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <DateSelector
                            label="من تاريخ"
                            value={formData.repeatStartDate}
                            onChange={(date) => setFormData(prev => ({
                              ...prev,
                              repeatStartDate: date
                            }))}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <DateSelector
                            label="إلى تاريخ"
                            value={formData.repeatEndDate}
                            onChange={(date) => setFormData(prev => ({
                              ...prev,
                              repeatEndDate: date
                            }))}
                            required
                          />
                        </Grid>
                      </Grid>
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* أزرار الحفظ والإلغاء */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={handleSubmitForm}
                disabled={formLoading}
                sx={{
                  backgroundColor: '#000',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  '&:hover': { backgroundColor: '#333' }
                }}
              >
                {formLoading ? 'جاري الحفظ...' : 'حفظ الموعد'}
              </Button>
              <Button
                variant="outlined"
                onClick={closeAddForm}
                sx={{
                  borderColor: '#ccc',
                  color: '#666',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    borderColor: '#999',
                    backgroundColor: '#f5f5f5'
                  }
                }}
              >
                إلغاء
              </Button>
            </Box>
          </Box>
        </Paper>
      </Collapse>

      {/* زر إضافة موعد جديد */}
      <Fab
        color="primary"
        aria-label="إضافة موعد"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          backgroundColor: '#000',
          '&:hover': {
            backgroundColor: '#333'
          }
        }}
        onClick={openAddForm}
      >
        <AddIcon />
      </Fab>

      {/* نافذة تعديل موعد */}
      <EditAppointmentDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedAppointment(null);
        }}
        onSuccess={loadAppointments}
        appointment={selectedAppointment}
      />

      {/* نافذة تأكيد الحذف */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedAppointment(null);
        }}
        onConfirm={confirmDelete}
        title="حذف الموعد"
        message={`هل أنت متأكد من حذف موعد "${selectedAppointment?.entityName}" في مادة "${selectedAppointment?.subjectName}"؟`}
      />

      {/* إشعارات */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* مودال تأكيد حذف جميع المواعيد */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => !deleteLoading && setDeleteDialogOpen(false)}
        onConfirm={handleDeleteAllAppointments}
        title="حذف جميع المواعيد"
        description="هل أنت متأكد من حذف جميع المواعيد؟"
        itemsToDelete={[
          'جميع المواعيد الفردية',
          'جميع المواعيد المتكررة',
          'جميع الجلسات المجدولة'
        ]}
        loading={deleteLoading}
        confirmButtonText="حذف جميع المواعيد"
      />
    </Container>
  );
}
