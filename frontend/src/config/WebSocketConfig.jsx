import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { API_BASE_URL } from './ApiConfig.jsx';

let stompClient = null;

export function connectWebSocket({ onConnect, onDisconnect }) {
    if (stompClient && stompClient.connected) return;
    const socketFactory = () => new SockJS(`${API_BASE_URL}/ws`);
    stompClient = Stomp.over(socketFactory);
    stompClient.connect({}, () => {
        if (onConnect) onConnect();
    }, () => {
        if (onDisconnect) onDisconnect();
    });
}

export function subscribeToTopic(topic, callback) {
    if (!stompClient || !stompClient.connected) return null;
    return stompClient.subscribe(topic, callback);
}


export function unsubscribeFromTopic(subscription) {
    if (subscription) subscription.unsubscribe();
}

export function disconnectWebSocket() {
    if (stompClient) {
        stompClient.disconnect();
        stompClient = null;
    }
}

export function getStompClient() {
    return stompClient;
}

