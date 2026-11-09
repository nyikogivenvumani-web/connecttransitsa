import { LiveLocation } from '../../../components/LiveLocation';
export default async function LivePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <LiveLocation token={token} />;
}
