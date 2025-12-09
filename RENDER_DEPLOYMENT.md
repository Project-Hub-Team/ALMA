# Environment Variables for Render Deployment

Add these in Render Dashboard → Environment → Environment Variables:

```
VITE_FIREBASE_API_KEY=AIzaSyCRNfY33h_7IiBd33dQvJU6N-Z8_89QdR4
VITE_FIREBASE_AUTH_DOMAIN=school-management-system-afc40.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://school-management-system-afc40-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=school-management-system-afc40
VITE_FIREBASE_STORAGE_BUCKET=school-management-system-afc40.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=596795127606
VITE_FIREBASE_APP_ID=1:596795127606:web:996108327b84793f5fa597
VITE_FIREBASE_MEASUREMENT_ID=G-W8N6LP1DV4
```

## Render Static Site Settings:

- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **Auto-Deploy:** Yes

## Important Notes:

1. The `_redirects` file in `public/` folder enables client-side routing
2. Firebase config now uses environment variables with fallback values
3. All environment variables must be set in Render dashboard before deployment
4. The app will work locally with hardcoded values, but use env vars in production
