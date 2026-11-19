import { Box, Grid, Paper, Skeleton, Stack } from '@mui/material';

export function StationChartSkeleton({ height = 385 }: { height?: number }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, height, borderRadius: 3 }}>
      <Skeleton animation="wave" width="38%" sx={{ mb: 2 }} />
      <Stack justifyContent="space-between" sx={{ height: '78%', pl: 3 }}>
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} animation="wave" variant="rectangular" height={1} />
        ))}
      </Stack>
    </Paper>
  );
}

export default function StationPageSkeleton({ toolbar = true, metrics = 3 }: { toolbar?: boolean; metrics?: number }) {
  return (
    <Box aria-busy="true" aria-label="กำลังโหลดข้อมูลสถานี">
      {toolbar && (
        <Stack direction="row" spacing={1.5} sx={{ my: 2 }}>
          <Skeleton animation="wave" variant="rounded" height={48} sx={{ flex: 1 }} />
          <Skeleton animation="wave" variant="rounded" width={48} height={48} />
        </Stack>
      )}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Skeleton animation="wave" variant="rectangular" height={300} />
            <Stack spacing={1} sx={{ p: 2 }}>
              <Skeleton animation="wave" width="70%" />
              <Skeleton animation="wave" width="90%" />
              <Skeleton animation="wave" width="55%" />
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={2}>
            {metrics > 0 && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {Array.from({ length: metrics }, (_, index) => (
                  <Paper key={index} variant="outlined" sx={{ flex: 1, p: 2, borderRadius: 3 }}>
                    <Skeleton animation="wave" variant="rounded" width={36} height={36} sx={{ mb: 1 }} />
                    <Skeleton animation="wave" width="55%" />
                    <Skeleton animation="wave" width="45%" height={32} />
                  </Paper>
                ))}
              </Stack>
            )}
            <StationChartSkeleton />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
