// ลบ cookies และ redirect ออก เปลี่ยนเป็น Client Component
'use client';

import { Box } from "@mui/material";
import HecRun from "./components/Model";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function ModelPage() {
    const { currentUser, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !currentUser) {
            router.replace('/dashboard');
        }
    }, [currentUser, loading, router]);

    if (loading) return null; // หรือ <LoadingSpinner />
    if (!currentUser) return null;

    return (
        <Box sx={{ p: 1, maxWidth: 'xl', mx: 'auto', width: '100%'}}>
            <HecRun />
        </Box>
    );
}