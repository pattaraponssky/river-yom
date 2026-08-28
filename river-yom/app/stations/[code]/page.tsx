
import { KNOWN_STATION_CODES } from '@/lib/StationCodes';
import StationDetailClient from './StationDetailClient';
 
export async function generateStaticParams() {
  return KNOWN_STATION_CODES.map(code => ({ code }));
}
interface PageProps {
  params: Promise<{ code: string }>;
}
 
export default async function StationDetailPage({ params }: PageProps) {
  const { code } = await params;
  return <StationDetailClient staCode={decodeURIComponent(code)} />;
}
 