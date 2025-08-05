'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Grid,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { db, Institute } from '@/lib/database';
import ConfirmDialog from '@/components/ConfirmDialog';
import ClientOnly from '@/components/ClientOnly';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function InstitutesSchoolsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [schools, setSchools] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Institute | null>(null);
  const [newName, setNewName] = useState('');
  const [selectedType, setSelectedType] = useState<'institute' | 'school'>('institute');
  const [tabValue, setTabValue] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; item: Institute | null }>({
    open: false,
    item: null
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const allInstitutes = await db.getAllInstitutes();
      setInstitutes(allInstitutes.filter(item => item.type === 'institute'));
      setSchools(allInstitutes.filter(item => item.type === 'school'));
    } catch (error) {
      console.error('Error loading data:', error);
      showSnackbar('حدث خطأ في تحميل البيانات', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleOpenDialog = (type: 'institute' | 'school', item?: Institute) => {
    setSelectedType(type);
    setEditingItem(item || null);
    setNewName(item?.name || '');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setNewName('');
  };

  const handleSave = async () => {
    if (!newName.trim()) {
      showSnackbar('يرجى إدخال اسم صحيح', 'warning');
      return;
    }

    try {
      if (editingItem) {
        // تعديل موجود
        await db.updateInstitute(editingItem.id!, newName.trim());
        showSnackbar('تم تحديث البيانات بنجاح', 'success');
      } else {
        // إضافة جديد
        if (selectedType === 'institute') {
          await db.addInstitute(newName.trim(), 'institute');
          showSnackbar('تم إضافة المعهد بنجاح مع إنشاء حساب مالي تلقائياً', 'success');
        } else {
          await db.addSchool(newName.trim());
          showSnackbar('تم إضافة المدرسة بنجاح مع إنشاء حساب مالي تلقائياً', 'success');
        }
      }
      
      handleCloseDialog();
      await loadData();
    } catch (error) {
      console.error('Error saving:', error);
      showSnackbar('حدث خطأ في الحفظ', 'error');
    }
  };

  const handleDeleteClick = (item: Institute) => {
    setDeleteConfirm({ open: true, item });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.item) return;

    try {
      await db.deleteInstitute(deleteConfirm.item.id!);
      showSnackbar('تم حذف البيانات والحساب المرتبط بنجاح', 'success');
      setDeleteConfirm({ open: false, item: null });
      await loadData();
    } catch (error) {
      console.error('Error deleting:', error);
      showSnackbar('حدث خطأ في الحذف', 'error');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ open: false, item: null });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const renderList = (items: Institute[], type: 'institute' | 'school') => {
    if (items.length === 0) {
      return (
        <Card sx={{ textAlign: 'center', p: 4, backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0' }}>
          {type === 'institute' ? (
            <BusinessIcon sx={{ fontSize: 64, color: '#666', mb: 2 }} />
          ) : (
            <SchoolIcon sx={{ fontSize: 64, color: '#666', mb: 2 }} />
          )}
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {type === 'institute' ? 'لا توجد معاهد مضافة' : 'لا توجد مدارس مضافة'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {type === 'institute' ? 'ابدأ بإضافة معهد جديد' : 'ابدأ بإضافة مدرسة جديدة'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog(type)}
            sx={{
              backgroundColor: '#000',
              '&:hover': {
                backgroundColor: '#333'
              }
            }}
          >
            {type === 'institute' ? 'إضافة معهد' : 'إضافة مدرسة'}
          </Button>
        </Card>
      );
    }

    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Grid container spacing={3} sx={{ maxWidth: { xs: '100%', md: '1200px' }, justifyContent: 'center' }}>
          {items.map((item) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={item.id} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Card sx={{
                height: '100%',
                width: { xs: '95%', md: '100%' },
                backgroundColor: '#f5f5f5',
                border: '1px solid #e0e0e0',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}>
                <CardContent sx={{ p: { xs: 3, md: 3 }, textAlign: 'center' }}>
                  {type === 'institute' ? (
                    <BusinessIcon sx={{ fontSize: 48, color: '#666', mb: 2 }} />
                  ) : (
                    <SchoolIcon sx={{ fontSize: 48, color: '#666', mb: 2 }} />
                  )}

                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{
                      fontWeight: 'bold',
                      fontSize: { xs: '1.5rem', md: '1.25rem' },
                      mb: 2,
                      color: '#333'
                    }}
                  >
                    {item.name}
                  </Typography>

                  <Chip
                    label={type === 'institute' ? 'معهد' : 'مدرسة'}
                    size="medium"
                    sx={{
                      backgroundColor: type === 'institute' ? '#000' : '#333',
                      color: 'white',
                      fontSize: '0.875rem',
                      mb: 3
                    }}
                  />

                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Button
                      variant="outlined"
                      onClick={() => handleOpenDialog(type, item)}
                      sx={{
                        borderColor: '#000',
                        color: '#000',
                        fontSize: '0.875rem',
                        minWidth: '80px',
                        '&:hover': {
                          borderColor: '#333',
                          backgroundColor: '#f5f5f5'
                        }
                      }}
                    >
                      تعديل
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => handleDeleteClick(item)}
                      sx={{
                        borderColor: '#d32f2f',
                        color: '#d32f2f',
                        fontSize: '0.875rem',
                        minWidth: '80px',
                        '&:hover': {
                          borderColor: '#b71c1c',
                          backgroundColor: '#ffebee'
                        }
                      }}
                    >
                      حذف
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <Typography>جاري التحميل...</Typography>
      </Container>
    );
  }

  return (
    <ClientOnly>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
        <Box sx={{ mb: { xs: 3, md: 4 } }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}
          >
            إدارة المعاهد والمدارس
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
          >
            إضافة وإدارة المعاهد والمدارس مع إنشاء حسابات مالية تلقائية
          </Typography>
        </Box>

        <Card className="card-elegant" sx={{ mb: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="institute school tabs">
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon />
                    <span>المعاهد ({institutes.length})</span>
                  </Box>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SchoolIcon />
                    <span>المدارس ({schools.length})</span>
                  </Box>
                }
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog('institute')}
                sx={{
                  backgroundColor: '#000',
                  color: 'white',
                  fontSize: { xs: '1rem', md: '0.875rem' },
                  py: { xs: 1.5, md: 1 },
                  px: { xs: 4, md: 3 },
                  '&:hover': {
                    backgroundColor: '#333'
                  }
                }}
              >
                إضافة معهد جديد
              </Button>
            </Box>
            {renderList(institutes, 'institute')}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog('school')}
                sx={{
                  backgroundColor: '#000',
                  color: 'white',
                  fontSize: { xs: '1rem', md: '0.875rem' },
                  py: { xs: 1.5, md: 1 },
                  px: { xs: 4, md: 3 },
                  '&:hover': {
                    backgroundColor: '#333'
                  }
                }}
              >
                إضافة مدرسة جديدة
              </Button>
            </Box>
            {renderList(schools, 'school')}
          </TabPanel>
        </Card>

        {/* Dialog للإضافة والتعديل */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              margin: { xs: 2, sm: 3 },
              maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' }
            }
          }}
        >
          <DialogTitle>
            {editingItem
              ? `تعديل ${selectedType === 'institute' ? 'المعهد' : 'المدرسة'}`
              : `إضافة ${selectedType === 'institute' ? 'معهد' : 'مدرسة'} جديد`
            }
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label={`اسم ${selectedType === 'institute' ? 'المعهد' : 'المدرسة'}`}
              fullWidth
              variant="outlined"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              sx={{ mt: 2 }}
            />
            {!editingItem && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                سيتم إنشاء حساب مالي تلقائياً عند الإضافة
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseDialog}>إلغاء</Button>
            <Button onClick={handleSave} variant="contained">
              {editingItem ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog تأكيد الحذف */}
        <ConfirmDialog
          open={deleteConfirm.open}
          title="تأكيد الحذف"
          message={`هل أنت متأكد من حذف "${deleteConfirm.item?.name}"؟ سيتم حذف الحساب المالي المرتبط أيضاً.`}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />

        {/* Snackbar للإشعارات */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={2000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </ClientOnly>
  );
}
