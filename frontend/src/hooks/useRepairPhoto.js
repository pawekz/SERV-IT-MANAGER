import { useQuery } from '@tanstack/react-query';
import api from '../config/ApiConfig';

export const PHOTO_CACHE_TTL_MS = 12 * 60 * 1000;

export async function fetchPresignedPhotoUrl(photoUrl) {
    if (!photoUrl) return null;
    const res = await api.get(`/repairTicket/getRepairPhotos`, { params: { photoUrl } });
    return res.data;
}

export function useRepairPhoto(path) {
    return useQuery({
        queryKey: ['repair-photo', path],
        queryFn: () => fetchPresignedPhotoUrl(path),
        enabled: !!path,
        staleTime: PHOTO_CACHE_TTL_MS,
        gcTime: PHOTO_CACHE_TTL_MS * 2,
    });
}

export function prefetchRepairPhoto(queryClient, path) {
    if (!path) return;
    return queryClient.prefetchQuery({
        queryKey: ['repair-photo', path],
        queryFn: () => fetchPresignedPhotoUrl(path),
        staleTime: PHOTO_CACHE_TTL_MS,
        gcTime: PHOTO_CACHE_TTL_MS * 2,
    });
}

