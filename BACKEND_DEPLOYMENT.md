# Backend Deployment to Render

Your app is deployed on Vercel at: **https://student-attendance-system-psi.vercel.app**

However, to make CREATE/UPDATE/DELETE operations work, you need to deploy the backend (json-server) to a persistent service.

## Deploy Backend to Render (Free)

### Step 1: Sign up on Render
1. Go to https://render.com
2. Sign up with your GitHub or email
3. Verify your email

### Step 2: Create a New Web Service
1. Dashboard → New + → Web Service
2. Connect your GitHub repository or enter the Git URL
3. Choose the repository containing this project

### Step 3: Configure the Service
- **Name**: `sams-backend` (or any name)
- **Environment**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm run json-server`
- **Plan**: Free (limited to 750 hours/month, but sufficient for testing)

### Step 4: Deploy
1. Click "Create Web Service"
2. Render will build and deploy your backend
3. Once deployed, you'll get a URL like: `https://sams-backend-xxxxx.onrender.com`

### Step 5: Update the App
1. Open `src/app/services/data.service.ts`
2. Find the line: `return 'https://sams-backend.onrender.com';`
3. Replace with your actual Render backend URL
4. Repeat for `src/app/services/auth.service.ts`
5. Run: `npm run build && vercel --prod --yes`

### Troubleshooting
- **Backend slow to respond first time**: Render spins down free services after inactivity. First request takes ~30 seconds.
- **db.json not found**: Make sure `db.json` is in your git repository root
- **CORS errors**: The json-server on Render already has CORS enabled

## Alternative: Use Railway  

Railway is similar but slightly different:
1. Go to https://railway.app
2. Sign up with GitHub
3. New Project → GitHub Repo
4. Set start command: `npm run json-server`
5. Deploy

Get the URL and update services as above.

## Alternative: Use Local Backend

For mobile testing without deployment:
1. Run on your computer: `npm run json-server`
2. Get your computer's IP: `ipconfig` (look for "IPv4 Address")
3. On mobile, access: `http://<your-ip>:3000`
4. Update the `getApiUrl()` to use this for testing

## Reference
- json-server docs: https://github.com/typicode/json-server
- Render docs: https://render.com/docs
