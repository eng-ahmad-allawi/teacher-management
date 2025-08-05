'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  CircularProgress
} from '@mui/material';
import {
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

interface ConfirmDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemsToDelete: string[];
  loading?: boolean;
  confirmButtonText?: string;
}

export default function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  itemsToDelete,
  loading = false,
  confirmButtonText = 'حذف'
}: ConfirmDeleteDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Dialog
      open={open}
      onClose={!loading ? onClose : undefined}
      maxWidth="sm"
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
      <DialogTitle 
        sx={{
          backgroundColor: '#d32f2f',
          color: 'white',
          textAlign: 'center',
          py: isMobile ? 2.5 : 3,
          fontWeight: 'bold',
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          borderRadius: '8px 8px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1
        }}
      >
        <WarningIcon sx={{ fontSize: isMobile ? '1.5rem' : '1.75rem' }} />
        {title}
      </DialogTitle>

      <DialogContent sx={{
        p: isMobile ? 2.5 : 3,
        pt: isMobile ? 2.5 : 3,
        pb: isMobile ? 1 : 2
      }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography 
            variant="body1" 
            sx={{ 
              fontSize: isMobile ? '1rem' : '1.125rem',
              fontWeight: 500,
              mb: 2,
              color: '#333'
            }}
          >
            {description}
          </Typography>
          
          <Typography 
            variant="body2" 
            color="error" 
            sx={{ 
              fontSize: isMobile ? '0.875rem' : '1rem',
              fontWeight: 600,
              backgroundColor: 'rgba(211, 47, 47, 0.1)',
              p: 1.5,
              borderRadius: 1,
              border: '1px solid rgba(211, 47, 47, 0.3)'
            }}
          >
            ⚠️ هذا الإجراء لا يمكن التراجع عنه!
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontSize: isMobile ? '0.875rem' : '1rem',
              fontWeight: 600,
              mb: 1.5,
              color: '#555'
            }}
          >
            سيتم حذف:
          </Typography>
          
          <List dense sx={{ 
            backgroundColor: '#f8f9fa',
            borderRadius: 1,
            border: '1px solid #e9ecef',
            py: 1
          }}>
            {itemsToDelete.map((item, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <DeleteIcon sx={{ 
                    fontSize: '1rem', 
                    color: '#d32f2f' 
                  }} />
                </ListItemIcon>
                <ListItemText 
                  primary={item}
                  primaryTypographyProps={{
                    fontSize: isMobile ? '0.875rem' : '1rem',
                    color: '#333'
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
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
          disabled={loading}
          fullWidth={isMobile}
          startIcon={<CancelIcon />}
          className="btn-animated btn-press transition-all hover-lift"
          sx={{
            minWidth: isMobile ? '100%' : 120,
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
            },
            '&:disabled': {
              borderColor: '#ddd',
              color: '#aaa'
            }
          }}
        >
          إلغاء
        </Button>
        
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={loading}
          fullWidth={isMobile}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : undefined}
          className="btn-animated btn-press transition-all hover-lift"
          sx={{
            minWidth: isMobile ? '100%' : 140,
            py: isMobile ? 1.2 : 1,
            fontSize: isMobile ? '1rem' : '1rem',
            backgroundColor: '#d32f2f',
            color: 'white',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': { 
              backgroundColor: '#b71c1c',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(211, 47, 47, 0.4)'
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
          {loading ? 'جاري الحذف...' : confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
