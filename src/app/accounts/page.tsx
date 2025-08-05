'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Fab,
  Chip,
  Button,
  useTheme,
  useMediaQuery,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Payment as PaymentIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { db, Account } from '@/lib/database';
import AddPaymentDialog from '@/components/AddPaymentDialog';

interface AccountWithStats extends Account {
  recentPayments: number;
  lastPaymentDate?: Date;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const accountsData = await db.getAccountsWithPaymentStats();
      // ترتيب الحسابات حسب تاريخ الإنشاء (الأحدث أولاً)
      const sortedAccounts = accountsData.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAccounts(sortedAccounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setSnackbar({
        open: true,
        message: 'حدث خطأ في تحميل الحسابات',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleAddPayment = () => {
    setAddPaymentOpen(true);
  };

  const handlePaymentAdded = () => {
    loadAccounts();
    setSnackbar({
      open: true,
      message: 'تم إضافة الدفعة بنجاح',
      severity: 'success'
    });
  };



  const handleViewAccount = (accountId: number) => {
    router.push(`/accounts/${accountId}`);
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
    }).format(date);
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

  return (
    <>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* بطاقة عدد الحسابات */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
          <Card sx={{
            backgroundColor: '#f5f5f5',
            color: '#333',
            border: '1px solid #e0e0e0',
            width: { xs: '95%', md: '400px' },
            maxWidth: '400px'
          }}>
            <CardContent sx={{ textAlign: 'center', p: { xs: 4, md: 3 } }}>
              <PaymentIcon sx={{ fontSize: { xs: 64, md: 48 }, mb: 2, color: '#666' }} />
              <Typography variant="h6" gutterBottom sx={{ color: '#333', fontSize: { xs: '1.25rem', md: '1.125rem' } }}>
                عدد الحسابات
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#000', fontSize: { xs: '2.5rem', md: '2rem' } }}>
                {accounts.length}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* زر إضافة دفعة */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddPayment}
            sx={{
              backgroundColor: '#000',
              color: 'white',
              fontSize: { xs: '1.125rem', md: '1rem' },
              py: { xs: 2, md: 1.5 },
              px: { xs: 6, md: 4 },
              width: { xs: '90%', md: 'auto' },
              minWidth: { md: '200px' },
              '&:hover': {
                backgroundColor: '#333'
              }
            }}
          >
            إضافة دفعة
          </Button>
        </Box>

        {/* قائمة الحسابات */}
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
          الحسابات المالية
        </Typography>

        {accounts.length === 0 ? (
          <Card sx={{ textAlign: 'center', p: 4 }}>
            <AccountBalanceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              لا توجد حسابات مالية
            </Typography>
            <Typography variant="body2" color="text.secondary">
              سيتم إنشاء الحسابات تلقائياً عند إضافة معاهد أو مدارس
            </Typography>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Grid container spacing={3} sx={{ maxWidth: { xs: '100%', md: '1200px' }, justifyContent: 'center' }}>
              {accounts.map((account) => (
                <Grid item xs={12} md={6} lg={4} key={account.id} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Card sx={{
                    height: '100%',
                    transition: 'all 0.3s ease',
                    width: { xs: '95%', md: '100%' },
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #e0e0e0',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6
                    }
                  }}>
                    <CardContent sx={{ p: { xs: 3, md: 3 }, textAlign: 'center' }}>
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
                        {account.entityName}
                      </Typography>

                      <Chip
                        label={account.entityType === 'institute' ? 'معهد' : 'مدرسة'}
                        size="medium"
                        sx={{
                          backgroundColor: account.entityType === 'institute' ? '#000' : '#333',
                          color: 'white',
                          fontSize: '0.875rem',
                          mb: 3
                        }}
                      />

                      <Button
                        variant="contained"
                        onClick={() => handleViewAccount(account.id!)}
                        sx={{
                          width: '100%',
                          py: 1.5,
                          backgroundColor: '#000',
                          color: 'white',
                          fontSize: { xs: '1rem', md: '0.875rem' },
                          '&:hover': {
                            backgroundColor: '#333'
                          }
                        }}
                      >
                        عرض التفاصيل
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}



        {/* زر إضافة دفعة */}
        <Fab
          color="primary"
          aria-label="add payment"
          onClick={handleAddPayment}
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

        {/* نافذة إضافة دفعة */}
        <AddPaymentDialog
          open={addPaymentOpen}
          onClose={() => setAddPaymentOpen(false)}
          onPaymentAdded={handlePaymentAdded}
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


      </Container>
    </>
  );
}
