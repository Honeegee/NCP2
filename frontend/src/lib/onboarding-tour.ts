import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_COMPLETED_KEY = "ncp_onboarding_tour_completed";

export function hasCompletedTour(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(TOUR_COMPLETED_KEY) === "true";
}

function markTourCompleted() {
  localStorage.setItem(TOUR_COMPLETED_KEY, "true");
}

export function startOnboardingTour(forceShow = false) {
  if (!forceShow && hasCompletedTour()) return;

  // Small delay to let the profile page render fully
  setTimeout(() => {
    const tourDriver = driver({
      showProgress: false,       // We hide text progress in CSS; dots handled by driver
      animate: true,
      smoothScroll: true,
      allowClose: true,
      overlayColor: "rgba(20, 42, 38, 0.55)",
      stagePadding: 10,
      stageRadius: 12,
      popoverClass: "ncp-tour-popover",
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "🎉 Done!",
      onDestroyStarted: () => {
        markTourCompleted();
        tourDriver.destroy();
      },
      steps: [
        {
          popover: {
            title: "👋 Welcome to Nurse Care Pro!",
            description:
              "Let's take 30 seconds to get you set up. A complete profile means employers can find you — and better matches come your way faster.",
            side: "bottom" as const,
            align: "center" as const,
          },
        },
        {
          element: "#resume-upload-card",
          popover: {
            title: "📄 Upload Your Resume",
            description:
              "Start here! Drop your resume and we'll auto-fill your skills, certs, and experience. It takes under a minute and saves a lot of typing.",
            side: "left" as const,
            align: "start" as const,
          },
        },
        {
          element: "#edit-profile-btn",
          popover: {
            title: "✏️ Complete Your Profile",
            description:
              "Add your bio, contact info, and location here. Nurses with complete profiles receive 3× more interview requests.",
            side: "bottom" as const,
            align: "end" as const,
          },
        },
        {
          element: '[href="/jobs"]',
          popover: {
            title: "💼 Explore Job Matches",
            description:
              "Once your profile is ready, personalised job matches appear here — curated by your skills and location. You're almost there!",
            side: "bottom" as const,
            align: "start" as const,
          },
        },
      ],
    });

    tourDriver.drive();
  }, 1000);
}