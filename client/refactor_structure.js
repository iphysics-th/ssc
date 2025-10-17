#!/usr/bin/env node
/**
 * Auto-refactor React frontend into a feature-based structure.
 * Run with `node refactor_structure.js` from the /client directory.
 */

const fs = require("fs");
const path = require("path");

const base = path.join(__dirname, "src");

// Helper to safely make directories
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Helper to move files if they exist
function moveFile(src, dest) {
  if (fs.existsSync(src)) {
    ensureDir(path.dirname(dest));
    fs.renameSync(src, dest);
    console.log(`Moved: ${src} → ${dest}`);
  } else {
    console.warn(`⚠️  Skipped missing file: ${src}`);
  }
}

// ===== Structure Creation =====
const dirs = [
  "app",
  "features/reservation/pages",
  "features/reservation/components",
  "features/auth/components",
  "layouts",
  "assets/images",
  "assets/icons",
  "styles",
];
dirs.forEach((d) => ensureDir(path.join(base, d)));

// ===== Move Core Files =====
moveFile(`${base}/redux/store.js`, `${base}/app/store.js`);
moveFile(`${base}/hooks/userAuth.js`, `${base}/app/hooks.js`);
moveFile(`${base}/redux/api/apiSlice.js`, `${base}/app/apiClient.js`);

// ===== Reservation Feature =====
moveFile(
  `${base}/components/Reservation/CourseSelection.js`,
  `${base}/features/reservation/pages/SelectDuration.jsx`
);
moveFile(
  `${base}/components/Reservation/DateSelection.js`,
  `${base}/features/reservation/pages/SelectDate.jsx`
);
moveFile(
  `${base}/components/Reservation/SubjectSelection.js`,
  `${base}/features/reservation/pages/SelectSubjects.jsx`
);
moveFile(
  `${base}/components/Reservation/UserInfoForm.js`,
  `${base}/features/reservation/pages/UserInfo.jsx`
);
moveFile(
  `${base}/components/Reservation/SummaryPage.js`,
  `${base}/features/reservation/pages/ReviewSummary.jsx`
);
moveFile(
  `${base}/components/Reservation/ReserveCheck.js`,
  `${base}/features/reservation/pages/Success.jsx`
);
moveFile(
  `${base}/components/Reservation/SubjectSelectionModal.js`,
  `${base}/features/reservation/components/SubjectModal.jsx`
);
moveFile(
  `${base}/components/Reservation/StepNavigation.js`,
  `${base}/features/reservation/components/SlotCard.jsx`
);
moveFile(
  `${base}/redux/reservationSlice.js`,
  `${base}/features/reservation/reservationSlice.js`
);
moveFile(
  `${base}/redux/api/reservationAPI.js`,
  `${base}/features/reservation/reservationAPI.js`
);

// ===== Auth Feature =====
moveFile(
  `${base}/components/Auth/signin.js`,
  `${base}/features/auth/components/SignInForm.jsx`
);
moveFile(
  `${base}/components/Auth/signup.js`,
  `${base}/features/auth/components/SignUpForm.jsx`
);
moveFile(
  `${base}/redux/auth/authSlice.js`,
  `${base}/features/auth/authSlice.js`
);
moveFile(
  `${base}/redux/auth/authApi.js`,
  `${base}/features/auth/authAPI.js`
);

// ===== Layouts =====
moveFile(`${base}/AppHeader.js`, `${base}/layouts/Header.jsx`);
moveFile(`${base}/AppFooter.js`, `${base}/layouts/Footer.jsx`);

// ===== Styles =====
moveFile(`${base}/css/Home/AboutUs.css`, `${base}/styles/global.css`);
moveFile(`${base}/css/Auth/signup.css`, `${base}/styles/variables.css`);

console.log("\n✅ Refactor complete! Check new structure under /src");
