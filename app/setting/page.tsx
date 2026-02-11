import { Box } from "@mui/material";
import Setting from "./components/Setting";
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function SettingPage() {
    const cookieStore = await cookies();
    const session = cookieStore.get('access_token');

    if (!session) {
        redirect('/dashboard');
    }


    return <Box sx={{p:1}}>
        <Setting/>
    </Box>
}