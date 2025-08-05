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
  useTheme,
  useMediaQuery,
  InputAdornment
} from '@mui/material';
import {
  Close as CloseIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { db, Account } from '@/lib/database';

interface AddPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onPaymentAdded: () => void;
}

export default function AddPaymentDialog({ open, onClose, onPaymentAdded }: AddPaymentDialogProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | ''>('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (open) {
      loadAccounts();
      // تعيين التاريخ الحالي كافتراضي
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      setDate(formattedDate);
    }
  }, [open]);

  const loadAccounts = async () => {
    try {
      const accountsData = await db.getAllAccounts();
      setAccounts(accountsData);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const handleClose = () => {
    setSelectedAccountId('');
    setAmount('');
    setDate('');
    setDescription('');
    setErrors({});
    onClose();
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedAccountId) {
      newErrors.account = 'يرجى اختيار الحساب';
    }

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'يرجى إدخال مبلغ صحيح';
    }

    if (!date) {
      newErrors.date = 'يرجى اختيار التاريخ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      await db.addPayment(
        selectedAccountId as number,
        parseFloat(amount),
        description || undefined
      );

      onPaymentAdded();
      handleClose();
    } catch (error) {
      console.error('Error adding payment:', error);
      setErrors({ submit: 'حدث خطأ في إضافة الدفعة' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d.]/g, '');
    return numericValue;
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = formatCurrency(event.target.value);
    setAmount(value);
    if (errors.amount) {
      setErrors({ ...errors, amount: '' });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
          margin: isMobile ? 2 : 3,
          maxHeight: isMobile ? 'calc(100vh - 32px)' : 'calc(100vh - 64px)'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        pb: 2,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <PaymentIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h6" component="div" sx={{ flex: 1 }}>
          إضافة دفعة جديدة
        </Typography>
        <Button
          onClick={handleClose}
          sx={{ minWidth: 'auto', p: 1 }}
          color="inherit"
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* اختيار الحساب */}
          <FormControl fullWidth error={!!errors.account}>
            <InputLabel>اختر الحساب</InputLabel>
            <Select
              value={selectedAccountId}
              onChange={(e) => {
                setSelectedAccountId(e.target.value as number);
                if (errors.account) {
                  setErrors({ ...errors, account: '' });
                }
              }}
              label="اختر الحساب"
            >
              {accounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  <Box>
                    <Typography variant="body1">
                      {account.entityName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {account.entityType === 'institute' ? 'معهد' : 'مدرسة'} -
                      الرصيد الحالي: {new Intl.NumberFormat('en-US', {
                        style: 'decimal',
                        minimumFractionDigits: 0
                      }).format(account.totalPayments)} ل.س
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {errors.account && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {errors.account}
              </Typography>
            )}
          </FormControl>

          {/* مبلغ الدفعة */}
          <TextField
            fullWidth
            label="مبلغ الدفعة"
            value={amount}
            onChange={handleAmountChange}
            error={!!errors.amount}
            helperText={errors.amount}
            type="number"
            inputProps={{ 
              min: 0,
              step: 0.01
            }}
            InputProps={{
              startAdornment: <InputAdornment position="start">ل.س</InputAdornment>
            }}
          />

          {/* تاريخ الدفعة */}
          <TextField
            fullWidth
            label="تاريخ الدفعة"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (errors.date) {
                setErrors({ ...errors, date: '' });
              }
            }}
            error={!!errors.date}
            helperText={errors.date}
            InputLabelProps={{
              shrink: true,
            }}
          />

          {/* وصف الدفعة (اختياري) */}
          <TextField
            fullWidth
            label="وصف الدفعة (اختياري)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            placeholder="مثال: دفعة شهر يناير، رسوم امتحانات، إلخ..."
          />

          {errors.submit && (
            <Typography variant="body2" color="error" sx={{ textAlign: 'center' }}>
              {errors.submit}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{ 
            minWidth: 100,
            borderColor: '#ccc',
            color: '#666',
            '&:hover': {
              borderColor: '#999',
              backgroundColor: '#f5f5f5'
            }
          }}
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
            '&:hover': {
              backgroundColor: '#333'
            }
          }}
        >
          {loading ? 'جاري الإضافة...' : 'إضافة الدفعة'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
