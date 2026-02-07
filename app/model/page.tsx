import { Box } from "@mui/material";
import HecRun from "./components/Model";
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';


export default async function ModelPage() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');

    if (!session) {
    redirect('/dashboard');
    }
    return <Box sx={{p:1}}>
        <HecRun />
    </Box>
}