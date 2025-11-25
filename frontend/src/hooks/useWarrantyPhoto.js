import { useQuery } from '@tanstack/react-query';
import api from '../config/ApiConfig';

export const WARRANTY_PHOTO_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes (presigned URLs expire in 10)

export async function fetchWarrantyPhotoUrl(photoUrl) {
    if (!photoUrl) return null;
    try {
        const response = await api.get('/warranty/getWarrantyPhotos', { params: { photoUrl } });
        return response.data || null;
    } catch (err) {
        console.error('Error fetching warranty photo URL:', err);
        return null;
    }
}

export function useWarrantyPhoto(photoUrl) {
    return useQuery({
        queryKey: ['warranty-photo', photoUrl],
        queryFn: () => fetchWarrantyPhotoUrl(photoUrl),
        enabled: !!photoUrl,
        staleTime: WARRANTY_PHOTO_CACHE_TTL_MS,
        gcTime: WARRANTY_PHOTO_CACHE_TTL_MS * 2,
        retry: 1,
    });
}

export function prefetchWarrantyPhoto(queryClient, photoUrl) {
    if (!photoUrl) return;
    return queryClient.prefetchQuery({
        queryKey: ['warranty-photo', photoUrl],
        queryFn: () => fetchWarrantyPhotoUrl(photoUrl),
        staleTime: WARRANTY_PHOTO_CACHE_TTL_MS,
        gcTime: WARRANTY_PHOTO_CACHE_TTL_MS * 2,
    });
}

