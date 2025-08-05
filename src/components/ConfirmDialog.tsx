'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  severity?: 'warning' | 'error' | 'info';
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  onConfirm,
  onCancel,
  severity = 'warning'
}: ConfirmDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getIcon = () => {
    switch (severity) {
      case 'warning':
        return <WarningIcon sx={{ fontSize: 48, color: 'warning.main' }} />;
      case 'error':
        return <WarningIcon sx={{ fontSize: 48, color: 'error.main' }} />;
      case 'info':
        return <WarningIcon sx={{ fontSize: 48, color: 'info.main' }} />;
      default:
        return <WarningIcon sx={{ fontSize: 48, color: 'warning.main' }} />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
          m: { xs: 2, md: 2 },
          width: { xs: 'calc(100% - 32px)', md: 'auto' },
          maxHeight: { xs: '70vh', md: 'auto' }
        }
      }}
    >
      <DialogTitle sx={{ 
        textAlign: 'center', 
        pt: 3,
        fontSize: { xs: '1.125rem', md: '1.25rem' }
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {getIcon()}
          {title}
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ textAlign: 'center', px: { xs: 2, md: 3 } }}>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
        >
          {message}
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ 
        justifyContent: 'center', 
        gap: 2, 
        px: { xs: 2, md: 3 }, 
        pb: 3 
      }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          size={isMobile ? 'medium' : 'large'}
          sx={{ minWidth: 100 }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={severity === 'error' ? 'error' : 'primary'}
          size={isMobile ? 'medium' : 'large'}
          sx={{ minWidth: 100 }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
