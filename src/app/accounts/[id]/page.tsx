'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
  useMediaQuery,
  Alert,
  Snackbar,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { db, Account, Payment } from '@/lib/database';
import EditPaymentDialog from '@/components/EditPaymentDialog';

export default function AccountDetailsPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [editPaymentOpen, setEditPaymentOpen] = useState(false);
  const [selectedPaymentIndex, setSelectedPaymentIndex] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const params = useParams();
  const accountId = parseInt(params.id as string);

  const loadAccount = async () => {
    try {
      setLoading(true);
      const accountData = await db.getAccount(accountId);
      if (accountData) {
        setAccount(accountData);
        applyFilter(accountData.payments, filter);
      } else {
        router.push('/accounts');
      }
    } catch (error) {
      console.error('Error loading account:', error);
      setSnackbar({
        open: true,
        message: 'حدث خطأ في تحميل بيانات الحساب',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      loadAccount();
    }
  }, [accountId]);

  useEffect(() => {
    if (account) {
      applyFilter(account.payments, filter);
    }
  }, [filter, account]);

  const applyFilter = (payments: Payment[], filterType: string) => {
    const now = new Date();
    let filtered = [...payments];

    switch (filterType) {
      case 'week':
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        filtered = payments.filter(payment => new Date(payment.date) >= oneWeekAgo);
        break;
      case 'month':
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        filtered = payments.filter(payment => new Date(payment.date) >= oneMonthAgo);
        break;
      case 'all':
      default:
        filtered = payments;
        break;
    }

    // ترتيب الدفعات من الأحدث للأقدم
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setFilteredPayments(filtered);
  };

  const handleEditPayment = (index: number) => {
    const originalIndex = account!.payments.findIndex(p => p === filteredPayments[index]);
    setSelectedPaymentIndex(originalIndex);
    setEditPaymentOpen(true);
  };



  const handlePaymentUpdated = () => {
    loadAccount();
    setSnackbar({
      open: true,
      message: 'تم تحديث الدفعة بنجاح',
      severity: 'success'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(amount) + ' ل.س';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  };

  const getFilteredTotal = () => {
    return filteredPayments.reduce((total, payment) => total + payment.amount, 0);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!account) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">لم يتم العثور على الحساب</Alert>
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* زر العودة */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/accounts')}
          sx={{ mb: 3 }}
        >
          العودة للحسابات
        </Button>

        {/* معلومات الحساب */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <AccountBalanceIcon sx={{ fontSize: 48, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {account.entityName}
                </Typography>
                <Chip 
                  label={account.entityType === 'institute' ? 'معهد' : 'مدرسة'}
                  sx={{ 
                    backgroundColor: account.entityType === 'institute' ? '#000' : '#333',
                    color: 'white'
                  }}
                />
              </Box>
            </Box>

            <Box display="flex" flexWrap="wrap" gap={4}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  إجمالي الدفعات
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {formatCurrency(account.totalPayments)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  عدد الدفعات
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {account.payments.length}
                </Typography>
              </Box>
              {account.payments.length > 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    آخر دفعة
                  </Typography>
                  <Typography variant="h6">
                    {formatDate(new Date(Math.max(...account.payments.map(p => new Date(p.date).getTime()))))}
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* فلتر الدفعات */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            سجل الدفعات
          </Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>تصفية</InputLabel>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              label="تصفية"
              startAdornment={<FilterIcon sx={{ mr: 1 }} />}
            >
              <MenuItem value="all">جميع الدفعات</MenuItem>
              <MenuItem value="week">آخر أسبوع</MenuItem>
              <MenuItem value="month">آخر شهر</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* إحصائيات الفلتر */}
        {filter !== 'all' && (
          <Card sx={{ mb: 3, backgroundColor: '#f5f5f5' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="body1">
                <strong>إجمالي الدفعات المفلترة:</strong> {formatCurrency(getFilteredTotal())} 
                ({filteredPayments.length} دفعة)
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* جدول الدفعات */}
        {filteredPayments.length === 0 ? (
          <Card sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              لا توجد دفعات
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filter === 'all' ? 'لم يتم تسجيل أي دفعات لهذا الحساب' : 'لا توجد دفعات في الفترة المحددة'}
            </Typography>
          </Card>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>التاريخ</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>المبلغ</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>الوصف</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>تعديل</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPayments.map((payment, index) => (
                  <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                    <TableCell>{formatDate(payment.date)}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {formatCurrency(payment.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>{payment.description || '-'}</TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleEditPayment(index)}
                        size="small"
                        sx={{ color: '#000' }}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* زر إضافة دفعة */}
        <Fab
          color="primary"
          aria-label="add payment"
          onClick={() => router.push('/accounts')}
          sx={{
            position: 'fixed',
            bottom: isMobile ? 16 : 32,
            right: isMobile ? 16 : 32,
            backgroundColor: '#000',
            '&:hover': {
              backgroundColor: '#333'
            }
          }}
        >
          <AddIcon />
        </Fab>

        {/* نافذة التحرير */}
        {selectedPaymentIndex !== null && (
          <EditPaymentDialog
            open={editPaymentOpen}
            onClose={() => {
              setEditPaymentOpen(false);
              setSelectedPaymentIndex(null);
            }}
            onPaymentUpdated={handlePaymentUpdated}
            accountId={accountId}
            paymentIndex={selectedPaymentIndex}
            payment={account.payments[selectedPaymentIndex]}
          />
        )}

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
      </Container>
    </>
  );
}
