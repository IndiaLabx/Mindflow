# Deployment Instructions for Gemini TTS Edge Function

## 1. Prerequisites

Ensure you have the Supabase CLI installed and logged in.

## 2. Get Your Google API Key

Since we are using the Gemini Native Audio model via the Generative Language API, you need an API key from **Google AI Studio**.

1.  Go to [Google AI Studio](https://aistudio.google.com/).
2.  Click on **Get API key** in the top-left corner.
3.  Click **Create API key**.
4.  Copy the key.

## 3. Set Secrets in Supabase

You need to store this key securely in your Supabase project so the Edge Function can access it.

Run the following command in your terminal (replace `your_api_key_here` with the key you just copied):

```bash
supabase secrets set GOOGLE_AI_KEY=your_api_key_here
```

To verify it was set correctly, you can run:
```bash
supabase secrets list
```

## 4. Deploy the Function

Deploy the function to your Supabase project:

```bash
supabase functions deploy gemini-tts
```

## 5. Verify

Once deployed, the frontend application will automatically call this function when you click the speaker icon.

## Troubleshooting

-   **Error 403/400**:
    -   Ensure your API key is valid.
    -   Ensure the model `gemini-2.5-flash-native-audio-preview-09-2025` is available in your region.
-   **No Audio**:
    -   Check the browser console logs.
    -   Check the Supabase Dashboard -> Edge Functions -> `gemini-tts` -> Logs.
