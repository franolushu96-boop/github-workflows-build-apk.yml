import React, { useState } from 'react';
import { Smartphone, Download, CheckCircle, Code, Terminal, ExternalLink, X, FileArchive } from 'lucide-react';

interface AndroidBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidBuildModal: React.FC<AndroidBuildModalProps> = ({ isOpen, onClose }) => {
  const [activeStep, setActiveStep] = useState<'guide' | 'actions' | 'gradle'>('guide');

  if (!isOpen) return null;

  const githubActionsYaml = `name: Build KenoStats Android Debug APK

on:
  push:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    name: Build & Export Debug APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: gradle

      - name: Build Debug APK with Gradle
        working-directory: ./KenoStatsAndroid
        run: |
          chmod +x gradlew || true
          ./gradlew assembleDebug --no-daemon

      - name: Upload Debug APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: KenoStats-debug-apk
          path: KenoStatsAndroid/app/build/outputs/apk/debug/*.apk`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Android Native APK Build & Package</h3>
              <p className="text-xs text-slate-400">
                Native Android Studio project (Jetpack Compose & Kotlin) ready for APK compilation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="px-5 pt-3 border-b border-slate-800 flex gap-2">
          <button
            onClick={() => setActiveStep('guide')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeStep === 'guide'
                ? 'border-emerald-500 text-white bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Compilation Instructions
          </button>
          <button
            onClick={() => setActiveStep('actions')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeStep === 'actions'
                ? 'border-emerald-500 text-white bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            GitHub Actions Workflow (.yml)
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeStep === 'guide' && (
            <div className="space-y-4 text-xs text-slate-300">
              {/* Download banner */}
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <FileArchive className="w-4 h-4 text-emerald-400" />
                    <span>Download Native Android Project Package</span>
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Includes full Kotlin Jetpack Compose code, Gradle 8.6.1 configs, and AndroidManifest.
                  </p>
                </div>
                <a
                  href="/KenoStats-Android-Project.tar.gz"
                  download="KenoStats-Android-Project.tar.gz"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-2 shrink-0 transition-colors shadow-md shadow-emerald-950/40"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .tar.gz</span>
                </a>
              </div>

              {/* Step 1: GitHub Actions APK Automated Build */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>Option A: Instant Automated Cloud APK Build via GitHub Actions</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px] pl-7">
                  We have added <code className="text-indigo-300">.github/workflows/build-apk.yml</code> to your repository.
                  When you push this repository to GitHub or trigger the workflow manually in the GitHub Actions tab, it automatically runs JDK 17 + Gradle and generates <strong className="text-white">app-debug.apk</strong> as an artifact ready for direct download to any Android phone.
                </p>
              </div>

              {/* Step 2: Local Android Studio Build */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>Option B: Build Locally in Android Studio</span>
                </div>
                <div className="text-slate-400 leading-relaxed text-[11px] pl-7 space-y-1">
                  <p>1. Open the <code className="text-emerald-300">KenoStatsAndroid</code> directory in Android Studio.</p>
                  <p>2. Allow Gradle sync to complete with JDK 17 and Android SDK 35.</p>
                  <p>3. Select <strong>Build → Build Bundle(s) / APK(s) → Build APK(s)</strong>.</p>
                  <p>4. Android Studio compiles the APK to: <code className="text-emerald-300 font-mono">app/build/outputs/apk/debug/app-debug.apk</code>.</p>
                </div>
              </div>

              {/* AI Studio Environment Context */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-200">Google AI Studio Environment Note:</span>
                <p>
                  In Google AI Studio, this session runs on the web application container (Node.js/Vite/Express).
                  Because the web container does not have the 5GB+ Android SDK and JDK pre-installed, APK compilation is performed either via GitHub Actions automated cloud builds or Android Studio desktop builds using the generated codebase.
                </p>
              </div>
            </div>
          )}

          {activeStep === 'actions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>File located at: <code className="text-indigo-300">.github/workflows/build-apk.yml</code></span>
                <span className="text-[11px] text-emerald-400">Automated Android CI</span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                {githubActionsYaml}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
