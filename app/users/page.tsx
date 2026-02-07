import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import UserPage from './components/Users';

export default async function UsersPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');

  if (!session) {
    redirect('/dashboard');
  }

  return <div><UserPage/></div>;
}
