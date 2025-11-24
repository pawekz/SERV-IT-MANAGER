import { useQuery } from '@tanstack/react-query';
import api from '../config/ApiConfig';

export const AFTER_REPAIR_PHOTO_CACHE_TTL_MS = 12 * 60 * 1000;

export async function fetchPresignedAfterRepairPhotoUrl(photoUrl) {
    if (!photoUrl) return null;
    try {
        const res = await api.get(`/repairTicket/getRepairPhotos`, { params: { photoUrl } });
        return res.data || null;
    } catch (err) {
        console.error('Error fetching presigned after-repair photo URL:', err);
        return null;
    }
}

export function useAfterRepairPhoto(path) {
    return useQuery({
        queryKey: ['after-repair-photo', path],
        queryFn: () => fetchPresignedAfterRepairPhotoUrl(path),
        enabled: !!path,
        staleTime: AFTER_REPAIR_PHOTO_CACHE_TTL_MS,
        gcTime: AFTER_REPAIR_PHOTO_CACHE_TTL_MS * 2,
        retry: 1,
    });
}

export function prefetchAfterRepairPhoto(queryClient, path) {
    if (!path) return;
    return queryClient.prefetchQuery({
        queryKey: ['after-repair-photo', path],
        queryFn: () => fetchPresignedAfterRepairPhotoUrl(path),
        staleTime: AFTER_REPAIR_PHOTO_CACHE_TTL_MS,
        gcTime: AFTER_REPAIR_PHOTO_CACHE_TTL_MS * 2,
    });
}

