# Quiz Maker Web Application

This is a SaaS Quiz Maker Web Application built with Next.js 14, Supabase, and DeepSeek AI.

## Setup and Installation

1.  **Clone the repository (if applicable) or navigate to the project directory:**

    ```bash
    cd C:\Users\hp\Desktop\test\quiz-maker
    ```

2.  **Install Dependencies:**

    ```bash
    npm install
    ```

3.  **Supabase Configuration:**

    *   Create a Supabase project at [Supabase](https://supabase.com/).
    *   Navigate to "Project Settings" -> "API" to get your `Project URL` and `anon public` key.
    *   Create a `.env.local` file in the root of the project (`C:\Users\hp\Desktop\test\quiz-maker\.env.local`) and add the following:

        ```
        NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
        NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        ```

4.  **DeepSeek AI Configuration:**

    *   Obtain a DeepSeek API key from DeepSeek AI.
    *   Add your DeepSeek API key to the `.env.local` file:

        ```
        DEEPSEEK_API_KEY=YOUR_DEEPSEEK_API_KEY
        ```

## Running the Application

To run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Project Structure

*   `src/app/page.tsx`: The main landing page.
*   `src/app/generate/page.tsx`: The page for generating quizzes.
*   `src/app/api/generate-quiz/route.ts`: API route for DeepSeek AI quiz generation.
*   `src/utils/supabase.ts`: Supabase client initialization.