'use client';

import { Container, Typography, Box, Card, CardContent, Grid, Button, useTheme, useMediaQuery, CircularProgress, Snackbar, Alert } from '@mui/material';
import { School, Subject, AccountBalance, Event, DeleteSweep } from '@mui/icons-material';
import Link from 'next/link';
import { db } from '@/lib/database';
import { useState } from 'react';
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog';

export default function Home() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteAllData = async () => {
    try {
      setDeleteLoading(true);
      await db.clearAllData();
      setDeleteDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'تم حذف جميع بيانات الموقع بنجاح',
        severity: 'success'
      });
    } catch (error) {
      console.error('خطأ في حذف البيانات:', error);
      setSnackbar({
        open: true,
        message: 'حدث خطأ أثناء حذف البيانات',
        severity: 'error'
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }} className="fade-in">
      <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }} className="slide-in-down delay-100">
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem', md: '3rem' } }}
        >
          تطبيق إدارة شؤون الأستاذ
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          paragraph
          sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}
        >
          نظام شامل لإدارة المواد والمعاهد والحسابات والمواعيد
        </Typography>
      </Box>

      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 4, md: 6 } }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Link href="/subjects" style={{ textDecoration: 'none' }}>
            <Card
              className="card-elegant hover-lift transition-all delay-100"
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)'
                },
                '&:active': {
                  transform: 'scale(0.98)'
                }
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: { xs: 2, md: 3 } }}>
                <Subject sx={{ fontSize: { xs: 40, md: 48 }, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                  إدارة المواد
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                  إضافة وإدارة المواد الدراسية
                </Typography>
              </CardContent>
            </Card>
          </Link>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Link href="/institutes-schools" style={{ textDecoration: 'none' }}>
            <Card
              className="card-elegant hover-lift transition-all delay-200"
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)'
                },
                '&:active': {
                  transform: 'scale(0.98)'
                }
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: { xs: 2, md: 3 } }}>
                <School sx={{ fontSize: { xs: 40, md: 48 }, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                  المعاهد والمدارس
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                  إدارة المعاهد والمدارس مع الحسابات
                </Typography>
              </CardContent>
            </Card>
          </Link>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Link href="/accounts" style={{ textDecoration: 'none' }}>
            <Card
              className="card-elegant hover-lift transition-all delay-300"
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)'
                },
                '&:active': {
                  transform: 'scale(0.98)'
                }
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: { xs: 2, md: 3 } }}>
                <AccountBalance sx={{ fontSize: { xs: 40, md: 48 }, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                  إدارة الحسابات
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                  متابعة الدفعات والحسابات المالية
                </Typography>
              </CardContent>
            </Card>
          </Link>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Link href="/appointments" style={{ textDecoration: 'none' }}>
            <Card
              className="card-elegant hover-lift transition-all delay-400"
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)'
                },
                '&:active': {
                  transform: 'scale(0.98)'
                }
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: { xs: 2, md: 3 } }}>
                <Event sx={{ fontSize: { xs: 40, md: 48 }, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                  إدارة المواعيد
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                  جدولة المواعيد مع دعم التكرار
                </Typography>
              </CardContent>
            </Card>
          </Link>
        </Grid>
      </Grid>

      <Box sx={{ textAlign: 'center' }} className="slide-in-up delay-500">
        <Typography
          variant="h5"
          gutterBottom
          sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}
        >
          مرحباً بك في تطبيق إدارة شؤون الأستاذ
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          paragraph
          sx={{
            fontSize: { xs: '0.875rem', md: '1rem' },
            px: { xs: 1, md: 0 }
          }}
        >
          تطبيق ويب متقدم يعمل دون اتصال بالإنترنت لإدارة جميع شؤونك التعليمية والمالية
        </Typography>
        <Link href="/subjects" style={{ textDecoration: 'none' }}>
          <Button
            variant="contained"
            size={isMobile ? 'medium' : 'large'}
            className="btn-animated btn-press transition-all hover-lift pulse"
            sx={{
              mt: 2,
              px: { xs: 3, md: 4 },
              py: { xs: 1, md: 1.5 },
              fontSize: { xs: '0.875rem', md: '1rem' },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-4px) scale(1.05)',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)'
              },
              '&:active': {
                transform: 'scale(0.95)'
              }
            }}
          >
            ابدأ الاستخدام
          </Button>
        </Link>
      </Box>

      <Box sx={{ mt: { xs: 6, md: 8 }, textAlign: 'center' }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontSize: { xs: '0.75rem', md: '0.875rem' },
            px: { xs: 1, md: 0 }
          }}
        >
          تطبيق PWA - يعمل دون اتصال بالإنترنت • تصميم فخم بالأسود والأبيض
        </Typography>
      </Box>

      {/* زر حذف جميع البيانات */}
      <Box sx={{ mt: 4, mb: 2, textAlign: 'center' }}>
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
          {deleteLoading ? 'جاري الحذف...' : 'حذف جميع بيانات الموقع'}
        </Button>
      </Box>

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

      {/* مودال تأكيد حذف جميع البيانات */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => !deleteLoading && setDeleteDialogOpen(false)}
        onConfirm={handleDeleteAllData}
        title="حذف جميع بيانات الموقع"
        description="هل أنت متأكد من حذف جميع بيانات الموقع؟"
        itemsToDelete={[
          'جميع المواد الدراسية',
          'جميع المعاهد والمدارس',
          'جميع الحسابات والدفعات المالية',
          'جميع المواعيد والجلسات',
          'جميع الإحصائيات والتقارير'
        ]}
        loading={deleteLoading}
        confirmButtonText="حذف جميع البيانات"
      />
    </Container>
  );
}
