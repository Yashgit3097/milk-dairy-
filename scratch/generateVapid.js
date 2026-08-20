import webpush from 'web-push';

const vapidKeys = webpush.generateVAPIDKeys();

console.log('--- GENERATED VAPID KEYS ---');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
