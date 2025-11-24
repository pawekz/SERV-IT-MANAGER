import { useQuery } from '@tanstack/react-query';
import api from '../config/ApiConfig';

export const PROFILE_PHOTO_CACHE_TTL_MS = 4 * 60 * 1000; // 4 minutes (presigned URLs expire in 5)

export async function fetchProfilePhotoUrl(userId) {
    if (!userId) return null;
    try {
        const response = await api.get(`/user/getProfilePicture/${userId}`);
        return response.data || null;
    } catch (err) {
        console.error('Error fetching profile photo URL:', err);
        return null;
    }
}

export function useProfilePhoto(userId, profilePictureUrl) {
    return useQuery({
        queryKey: ['profile-photo', userId, profilePictureUrl],
        queryFn: () => fetchProfilePhotoUrl(userId),
        enabled: !!(userId && profilePictureUrl && profilePictureUrl !== '0' && profilePictureUrl.trim() !== ''),
        staleTime: PROFILE_PHOTO_CACHE_TTL_MS,
        gcTime: PROFILE_PHOTO_CACHE_TTL_MS * 2,
        retry: 1,
    });
}

export function prefetchProfilePhoto(queryClient, userId, profilePictureUrl) {
    if (!userId || !profilePictureUrl || profilePictureUrl === '0' || profilePictureUrl.trim() === '') return;
    return queryClient.prefetchQuery({
        queryKey: ['profile-photo', userId, profilePictureUrl],
        queryFn: () => fetchProfilePhotoUrl(userId),
        staleTime: PROFILE_PHOTO_CACHE_TTL_MS,
        gcTime: PROFILE_PHOTO_CACHE_TTL_MS * 2,
    });
}

