# Deployment Guide (Vercel)

Since this is a Next.js application, the easiest and most reliable way to share it with your client is **Vercel**. It provides free HTTPS, automatic deployments from GitHub, and serverless API support out of the box.

## Prerequisites
- A GitHub account (where your code is pushed).
- A Vercel account (free tier is sufficient).

## Steps

1.  **Log in to Vercel**
    - Go to [vercel.com](https://vercel.com) and log in with your GitHub account.

2.  **Import Project**
    - Click **"Add New..."** → **"Project"**.
    - You should see your `aersospeak` repository in the list. Click **Import**.

3.  **Configure Environment Variables**
    - **Important:** Vercel needs your API keys to work.
    - Expand the **"Environment Variables"** section.
    - Add the following keys (copy values from your local `.env.local`):
        - `DEEPGRAM_API_KEY`
        - `OPENAI_API_KEY`

4.  **Deploy**
    - Click **"Deploy"**.
    - Vercel will build your app (this takes about 1 minute).

5.  **Share**
    - Once finished, you will get a live URL (e.g., `aerospeak.vercel.app`).
    - Share this URL with your client.

## Future Updates
- Any time you `git push` to your `main` branch, Vercel will automatically re-deploy the new version.

## Troubleshooting
- **Deepgram Connection Failed?** Check that your `DEEPGRAM_API_KEY` was pasted correctly in Vercel settings.
- **403 Errors?** Ensure your Deepgram key isn't expired or restricted to localhost. (Currently, we are using a general key, so it should work fine).
