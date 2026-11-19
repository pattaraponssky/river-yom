import { Box, Grid, Skeleton, Stack, Typography } from '@mui/material';

export function ForecastPlotSkeleton({ height = 380 }: { height?: number }) {
  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2, height }}>
      <Skeleton animation="wave" width="38%" sx={{ mx: 'auto', mb: 1.5 }} />
      <Stack justifyContent="space-between" sx={{ height: '80%', pl: 4 }}>
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} animation="wave" variant="rectangular" height={1} />
        ))}
      </Stack>
    </Box>
  );
}

export function ForecastSkeleton({ section }: { section: 'warning' | 'forecast' | 'profile' | 'station' }) {
  const titles = {
    warning: 'ตารางเฝ้าระวังและเตือนภัย',
    forecast: 'ผลการพยากรณ์ระดับน้ำ 7 วัน ล่วงหน้า',
    profile: 'รูปตัดตามยาวแม่น้ำยมฝั่งขวา (Y.15 - Y.17)',
    station: 'ระดับน้ำรายชั่วโมง',
  };

  return (
    <Box aria-busy="true">
      <Typography sx={{ fontWeight: 700, mb: 2 }}>{titles[section]}</Typography>
      {section === 'warning' ? (
        <Stack spacing={1}>
          {Array.from({ length: 6 }, (_, row) => (
            <Stack key={row} direction="row" spacing={2}>
              {Array.from({ length: 5 }, (_, column) => (
                <Skeleton key={column} animation="wave" variant="rounded" height={30} sx={{ flex: 1 }} />
              ))}
            </Stack>
          ))}
        </Stack>
      ) : (
        <>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Skeleton animation="wave" variant="rounded" width={112} height={36} />
            <Skeleton animation="wave" variant="rounded" width={112} height={36} />
          </Stack>
          {section === 'forecast' ? (
            <Grid container spacing={2}>
              {Array.from({ length: 6 }, (_, index) => (
                <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                  <ForecastPlotSkeleton />
                </Grid>
              ))}
            </Grid>
          ) : (
            <ForecastPlotSkeleton height={section === 'profile' ? 500 : 380} />
          )}
        </>
      )}
    </Box>
  );
}
