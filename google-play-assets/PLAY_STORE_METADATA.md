# Google Play Store Metadata for MindFlow

This file contains the mandated text elements required to publish MindFlow on the Google Play Store, adhering to the character limits.

## App Title (Max 30 characters)
**MindFlow: AI Quiz & Flashcards**
*(Length: 30 characters)*

## Short Description (Max 80 characters)
**Master English & GK with AI quizzes, spaced-repetition flashcards, and community.**
*(Length: 80 characters)*

## Full Description (Max 4,000 characters)
**Unlock Your Learning Potential with MindFlow**

MindFlow is the ultimate educational companion designed to make mastering English and General Knowledge (GK) engaging, efficient, and interactive. Whether you are a student preparing for competitive exams, a professional looking to sharpen your vocabulary, or a lifelong learner, MindFlow uses advanced AI and proven cognitive science techniques to help you learn faster and retain more.

**Key Features:**

* **AI-Powered Learning Modes:** Experience customized quizzes tailored precisely to your learning pace. Choose from 'Learning Mode' for immediate feedback, 'Mock Mode' for timed exam simulations, or 'God Mode' for rigorous blueprint testing.
* **Spaced-Repetition Flashcards:** Master complex vocabulary, One Word Substitutions (OWS), Idioms, and Synonyms. Our deck mode utilizes a Spatially-Hashed Swipe Algorithm to track your mastery and optimally schedule your next reviews, ensuring nothing is forgotten.
* **Smart Study Materials:** Instantly generate bilingual PDFs and PPTs. Utilize our text-exporter and AI-chat to simplify complex subjects and deep-dive into any topic.
* **Real-Time Community Feed:** Learning is better together! Connect with peers, participate in group chats, and scroll through engaging, bite-sized educational 'Reels' in our scroll-snapping community feed.
* **Offline-First Sync Engine:** Your progress never stops, even without Wi-Fi. MindFlow locally queues your activity and seamlessly synchronizes with our servers the moment you are back online.
* **Global Presence & Leaderboards:** Stay motivated by seeing your peers active in real-time. Compete on leaderboards and build daily streaks to cement your learning habits.

Join the MindFlow community today and transform how you study!

## Category details
* **Application Type:** App
* **Category:** Education

## Android App Bundle (AAB) Instructions
Google no longer accepts APK files for new apps. You must generate an `.aab` file.
To generate the AAB file for upload to the Google Play Console, run the following command in your terminal from the root directory:

```bash
cd android
./gradlew bundleRelease
```
The generated bundle will be located at:
`android/app/build/outputs/bundle/release/app-release.aab`
