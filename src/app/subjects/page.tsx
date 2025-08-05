'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Fab,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Subject as SubjectIcon
} from '@mui/icons-material';
import { db, Subject } from '@/lib/database';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function SubjectsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, subject: null as Subject | null });

  // تحميل المواد عند بدء التطبيق
  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const allSubjects = await db.getAllSubjects();
      setSubjects(allSubjects);
    } catch (error) {
      console.error('Error loading subjects:', error);
      showSnackbar('خطأ في تحميل المواد', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setSubjectName(subject.name);
    } else {
      setEditingSubject(null);
      setSubjectName('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSubject(null);
    setSubjectName('');
  };

  const handleSaveSubject = async () => {
    if (!subjectName.trim()) {
      showSnackbar('يرجى إدخال اسم المادة', 'error');
      return;
    }

    try {
      if (editingSubject) {
        // تحديث مادة موجودة
        await db.subjects.update(editingSubject.id!, { name: subjectName.trim() });
        showSnackbar('تم تحديث المادة بنجاح', 'success');
      } else {
        // إضافة مادة جديدة
        await db.addSubject(subjectName.trim());
        showSnackbar('تم إضافة المادة بنجاح', 'success');
      }
      
      handleCloseDialog();
      loadSubjects();
    } catch (error) {
      console.error('Error saving subject:', error);
      showSnackbar('خطأ في حفظ المادة', 'error');
    }
  };

  const handleDeleteSubject = (subject: Subject) => {
    setConfirmDialog({ open: true, subject });
  };

  const handleConfirmDelete = async () => {
    if (confirmDialog.subject) {
      try {
        await db.deleteSubject(confirmDialog.subject.id!);
        showSnackbar('تم حذف المادة بنجاح', 'success');
        loadSubjects();
      } catch (error) {
        console.error('Error deleting subject:', error);
        showSnackbar('خطأ في حذف المادة', 'error');
      }
    }
    setConfirmDialog({ open: false, subject: null });
  };

  const handleCancelDelete = () => {
    setConfirmDialog({ open: false, subject: null });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          جاري التحميل...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
      {/* العنوان الرئيسي */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 3, md: 4 } }}>
        <SubjectIcon sx={{ fontSize: { xs: 32, md: 40 }, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
          إدارة المواد الدراسية
        </Typography>
      </Box>

      {/* إحصائيات سريعة */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card className="card-elegant">
            <CardContent sx={{ textAlign: 'center', p: { xs: 2, md: 3 } }}>
              <Typography variant="h3" color="primary.main" gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
                {subjects.length}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                إجمالي المواد
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* قائمة المواد */}
      <Card className="card-elegant">
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 },
            mb: 2
          }}>
            <Typography variant="h6" sx={{ fontSize: { xs: '1.125rem', md: '1.25rem' } }}>
              قائمة المواد
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              size={isMobile ? 'small' : 'medium'}
              fullWidth={isMobile}
              sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
            >
              إضافة مادة جديدة
            </Button>
          </Box>

          {subjects.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: { xs: 3, md: 4 } }}>
              <SubjectIcon sx={{ fontSize: { xs: 48, md: 64 }, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                لا توجد مواد مضافة بعد
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                ابدأ بإضافة المواد الدراسية التي تقوم بتدريسها
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {subjects.map((subject) => (
                <ListItem
                  key={subject.id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    p: { xs: 1.5, md: 2 },
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemText
                    primary={subject.name}
                    secondary={`تم الإنشاء: ${new Date(subject.createdAt).toLocaleDateString('en-GB')}`}
                    primaryTypographyProps={{
                      fontSize: { xs: '1rem', md: '1.125rem' },
                      fontWeight: 500
                    }}
                    secondaryTypographyProps={{
                      fontSize: { xs: '0.75rem', md: '0.875rem' }
                    }}
                  />
                  <ListItemSecondaryAction sx={{ right: { xs: 8, md: 16 } }}>
                    <IconButton
                      edge="end"
                      aria-label="تعديل"
                      onClick={() => handleOpenDialog(subject)}
                      sx={{ mr: { xs: 0.5, md: 1 } }}
                      size={isMobile ? 'small' : 'medium'}
                    >
                      <EditIcon fontSize={isMobile ? 'small' : 'medium'} />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="حذف"
                      onClick={() => handleDeleteSubject(subject)}
                      color="error"
                      size={isMobile ? 'small' : 'medium'}
                    >
                      <DeleteIcon fontSize={isMobile ? 'small' : 'medium'} />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* زر الإضافة العائم */}
      <Fab
        color="primary"
        aria-label="إضافة مادة"
        sx={{
          position: 'fixed',
          bottom: { xs: 16, md: 24 },
          right: { xs: 16, md: 24 },
          size: { xs: 'medium', md: 'large' }
        }}
        onClick={() => handleOpenDialog()}
        size={isMobile ? 'medium' : 'large'}
      >
        <AddIcon />
      </Fab>

      {/* نافذة إضافة/تعديل المادة */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            m: { xs: 2, md: 2 },
            width: { xs: 'calc(100% - 32px)', md: 'auto' },
            maxHeight: { xs: '80vh', md: 'auto' }
          }
        }}
      >
        <DialogTitle sx={{ fontSize: { xs: '1.125rem', md: '1.25rem' } }}>
          {editingSubject ? 'تعديل المادة' : 'إضافة مادة جديدة'}
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, md: 3 } }}>
          <TextField
            autoFocus
            margin="dense"
            label="اسم المادة"
            fullWidth
            variant="outlined"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            placeholder="مثال: الرياضيات، الفيزياء، الكيمياء..."
            sx={{
              mt: 2,
              '& .MuiInputBase-input': {
                fontSize: { xs: '1rem', md: '1.125rem' }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, md: 3 }, pb: { xs: 2, md: 3 } }}>
          <Button
            onClick={handleCloseDialog}
            size={isMobile ? 'medium' : 'large'}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSaveSubject}
            variant="contained"
            size={isMobile ? 'medium' : 'large'}
          >
            {editingSubject ? 'تحديث' : 'إضافة'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* رسائل التنبيه */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* نافذة تأكيد الحذف */}
      <ConfirmDialog
        open={confirmDialog.open}
        title="تأكيد حذف المادة"
        message={`هل أنت متأكد من حذف المادة "${confirmDialog.subject?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف"
        cancelText="إلغاء"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        severity="error"
      />
    </Container>
  );
}
