# **App Name**: SuvidhaConnect

## Core Features:

- Dual-Role Authentication: Allows users to register as either a 'Seeker' or a 'Provider' and securely log in using JWT. Role selection is handled during registration to tailor the user experience.
- Smart Provider Discovery: Enables seekers to search for providers based on service categories, location (city), price range, and minimum rating. Includes filtering options for efficient matching.
- Comprehensive Booking System: Manages the full booking lifecycle, including request submission, status updates (Pending, Confirmed, Completed, Cancelled), and dashboard views for both seekers and providers.
- Automated Trust Verification Tool: An AI tool using LLM reasoning to assess the legitimacy of provider reviews and profiles. This system evaluates review content and profile data, flagging any inconsistencies or potentially fraudulent information. This enhances trust and safety within the platform by ensuring that only verified and credible providers are showcased.
- Provider Reputation System: Collects and displays provider reviews and average ratings to build trust with future customers. Provides a transparent overview of provider performance and reliability.
- Real-Time Availability Updates: Integrates a calendar system for providers to set and manage their availability. Customers can view real-time availability and book appointments accordingly, minimizing scheduling conflicts.
- Secure Payment Integration: Implements a secure payment gateway to handle transactions between seekers and providers. Supports various payment methods and ensures secure handling of financial information.

## Style Guidelines:

- Primary color: Soft teal (#4DB6AC) to evoke trust and reliability.
- Background color: Light grey (#ECEFF1) for a clean and modern look.
- Accent color: Warm orange (#FF8A65) for calls to action and highlights, providing a sense of energy and urgency.
- Body font: 'PT Sans' (sans-serif) for body text, offering a modern and slightly warm feel. Headline font: 'Playfair' (serif) for headlines and short amounts of text.
- Use clean, minimal icons from Lucide React to represent service categories and actions, ensuring clarity and ease of use.
- Emphasize a grid-based layout with clear spacing to present service providers and booking information in an organized and accessible manner. Utilize Shadcn UI components to ensure consistency and responsiveness across devices.
- Incorporate subtle transitions and animations to enhance user engagement, such as loading animations and smooth transitions between pages.