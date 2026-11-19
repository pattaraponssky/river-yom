import { Skeleton, TableCell, TableRow } from '@mui/material';

export default function DashboardTableStatus({ columns, loading, error, empty }: {
  columns: number;
  loading: boolean;
  error: boolean;
  empty: boolean;
}) {
  if (loading) {
    return Array.from({ length: 3 }, (_, row) => (
      <TableRow key={row} aria-hidden="true">
        {Array.from({ length: columns }, (_, column) => (
          <TableCell key={column}>
            <Skeleton animation="wave" width={column === 0 ? '85%' : '65%'} sx={{ mx: column === 0 ? 0 : 'auto' }} />
          </TableCell>
        ))}
      </TableRow>
    ));
  }

  if (!error && !empty) return null;

  return (
    <TableRow>
      <TableCell colSpan={columns} align="center" sx={{ py: 2, color: 'text.secondary' }}>
        {error ? 'โหลดข้อมูลส่วนนี้ไม่สำเร็จ' : 'ยังไม่มีข้อมูล'}
      </TableCell>
    </TableRow>
  );
}
