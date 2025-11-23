import { useQuery } from '@tanstack/react-query';
import api from '../config/ApiConfig';

export const PART_PHOTO_CACHE_TTL_MS = 12 * 60 * 1000;

export async function fetchPartPhotoUrl(partId, photoUrl) {
    if (!photoUrl || photoUrl === '0' || photoUrl.trim() === '') {
        return null;
    }

    if (photoUrl.includes('amazonaws.com/') && partId) {
        try {
            const response = await api.get(`/part/getPartPhoto/${partId}`);
            return response.data || null;
        } catch (err) {
            console.error('Error fetching presigned part photo URL:', err);
            return null;
        }
    }

    return photoUrl;
}

export function usePartPhoto(partId, photoUrl) {
    return useQuery({
        queryKey: ['part-photo', partId, photoUrl],
        queryFn: () => fetchPartPhotoUrl(partId, photoUrl),
        enabled: !!(partId && photoUrl && photoUrl !== '0' && photoUrl.trim() !== ''),
        staleTime: PART_PHOTO_CACHE_TTL_MS,
        gcTime: PART_PHOTO_CACHE_TTL_MS * 2,
        retry: 1,
    });
}

export function prefetchPartPhoto(queryClient, partId, photoUrl) {
    if (!partId || !photoUrl || photoUrl === '0' || photoUrl.trim() === '') return;
    return queryClient.prefetchQuery({
        queryKey: ['part-photo', partId, photoUrl],
        queryFn: () => fetchPartPhotoUrl(partId, photoUrl),
        staleTime: PART_PHOTO_CACHE_TTL_MS,
        gcTime: PART_PHOTO_CACHE_TTL_MS * 2,
    });
}

