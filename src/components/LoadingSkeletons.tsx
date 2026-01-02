import React from 'react';

// Base Skeleton Component
const SkeletonBox = ({ className = '' }: { className?: string }) => (
  <div className={`bg-neutral-800 rounded animate-pulse ${className}`}></div>
);

// Profile Page Skeleton
export const ProfilePageSkeleton = () => (
  <div className="animate-fade-in-up pb-10">
    {/* Hero Section Skeleton */}
    <div className="relative mb-24">
      {/* Cover Image Skeleton */}
      <SkeletonBox className="h-64 rounded-2xl" />
      
      {/* Profile Info Overlay Skeleton */}
      <div className="absolute -bottom-16 left-4 md:left-8 flex items-end gap-6 w-[calc(100%-2rem)] md:w-[calc(100%-4rem)]">
        {/* Avatar Skeleton */}
        <div className="relative">
          <SkeletonBox className="w-32 h-32 rounded-full" />
          <SkeletonBox className="absolute -bottom-2 -right-2 w-16 h-6 rounded-full" />
        </div>
        
        {/* Text Info Skeleton */}
        <div className="flex-1 mb-2">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
            <div className="space-y-3">
              <SkeletonBox className="h-8 w-64" />
              <SkeletonBox className="h-4 w-96 max-w-full" />
              <div className="flex gap-4">
                <SkeletonBox className="h-6 w-32" />
                <SkeletonBox className="h-6 w-24" />
              </div>
            </div>
            <div className="flex gap-3">
              <SkeletonBox className="h-10 w-24" />
              <SkeletonBox className="h-10 w-32" />
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Content Grid Skeleton */}
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pt-6">
      {/* Left Column */}
      <div className="xl:col-span-1 space-y-8">
        <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
          <SkeletonBox className="h-6 w-40 mb-6" />
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            <SkeletonBox className="w-32 h-32 rounded-full" />
            <SkeletonBox className="h-6 w-32" />
            <SkeletonBox className="h-4 w-24" />
          </div>
        </div>
        
        <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
          <SkeletonBox className="h-6 w-40 mb-4" />
          <div className="space-y-3">
            <SkeletonBox className="h-10 w-full" />
            <SkeletonBox className="h-10 w-full" />
            <SkeletonBox className="h-10 w-full" />
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="xl:col-span-2 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-neutral-900 border border-white/10 rounded-xl p-4">
              <SkeletonBox className="h-10 w-10 rounded-lg mb-3" />
              <SkeletonBox className="h-3 w-20 mb-2" />
              <SkeletonBox className="h-6 w-16" />
            </div>
          ))}
        </div>

        {/* Achievements */}
        <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <SkeletonBox className="h-6 w-48" />
            <SkeletonBox className="h-4 w-20" />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="min-w-[140px]">
                <SkeletonBox className="h-32 rounded-xl" />
              </div>
            ))}
          </div>
        </div>

        {/* Match History */}
        <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
          <SkeletonBox className="h-6 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-black/20 border border-white/5">
                <SkeletonBox className="h-12 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Settings Page Skeleton
export const SettingsPageSkeleton = () => (
  <div className="animate-fade-in-up relative pb-10">
    <div className="mb-8">
      <SkeletonBox className="h-8 w-64 mb-2" />
      <SkeletonBox className="h-4 w-96" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Settings Navigation Skeleton */}
      <div className="lg:col-span-1 space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/5">
            <SkeletonBox className="w-5 h-5 rounded" />
            <SkeletonBox className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Settings Content Area Skeleton */}
      <div className="lg:col-span-3 space-y-6">
        {/* Banner & Avatar Skeleton Container */}
        <div className="relative mb-20">
          <SkeletonBox className="h-48 rounded-2xl" />
          <div className="absolute -bottom-12 left-8 flex items-end gap-4">
            <SkeletonBox className="w-24 h-24 rounded-full" />
            <div className="mb-2 space-y-2">
              <SkeletonBox className="h-6 w-32" />
              <SkeletonBox className="h-4 w-48" />
            </div>
          </div>
        </div>

        {/* Form Fields Skeleton */}
        <div className="pt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i}>
                <SkeletonBox className="h-4 w-24 mb-2" />
                <SkeletonBox className="h-12 rounded-xl" />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i}>
                <SkeletonBox className="h-4 w-24 mb-2" />
                <SkeletonBox className="h-12 rounded-xl" />
              </div>
            ))}
          </div>
        </div>

        {/* Action Button Skeleton */}
        <div className="flex justify-end pt-4">
          <SkeletonBox className="h-12 w-40 rounded-xl" />
        </div>
      </div>
    </div>
  </div>
);

// Profile Settings Form Skeleton (for inline use in SettingsView)
export const ProfileSettingsSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Banner & Avatar Skeleton Container */}
    <div className="relative mb-20">
      <SkeletonBox className="h-48 rounded-2xl" />
      <div className="absolute -bottom-12 left-8 flex items-end gap-4">
        <SkeletonBox className="w-24 h-24 rounded-full" />
        <div className="mb-2 space-y-2">
          <SkeletonBox className="h-6 w-32" />
          <SkeletonBox className="h-4 w-48" />
        </div>
      </div>
    </div>

    {/* Form Fields Skeleton */}
    <div className="pt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i}>
            <SkeletonBox className="h-4 w-24 mb-2" />
            <SkeletonBox className="h-12 rounded-xl" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i}>
            <SkeletonBox className="h-4 w-24 mb-2" />
            <SkeletonBox className="h-12 rounded-xl" />
          </div>
        ))}
      </div>
    </div>

    {/* Action Button Skeleton */}
    <div className="flex justify-end pt-4">
      <SkeletonBox className="h-12 w-40 rounded-xl" />
    </div>
  </div>
);

// Dashboard Overview Skeleton
export const OverviewPageSkeleton = () => (
  <div className="animate-fade-in-up">
    {/* Welcome Section Skeleton */}
    <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
      <div className="space-y-2">
        <SkeletonBox className="h-8 w-80" />
        <SkeletonBox className="h-4 w-64" />
      </div>
      <SkeletonBox className="h-12 w-40 rounded-lg" />
    </div>

    {/* Stats Grid Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-6 rounded-2xl bg-neutral-900/80 border border-white/5">
          <SkeletonBox className="w-12 h-12 rounded-lg mb-4" />
          <SkeletonBox className="h-4 w-32 mb-1" />
          <SkeletonBox className="h-6 w-24 mb-1" />
          <SkeletonBox className="h-3 w-28" />
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* Left Column Skeleton */}
      <div className="xl:col-span-2 space-y-8">
        {/* Banner Skeleton */}
        <SkeletonBox className="h-64 rounded-2xl" />
        
        {/* Match History Skeleton */}
        <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <SkeletonBox className="h-6 w-32" />
            <SkeletonBox className="h-4 w-24" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonBox key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Right Column Skeleton */}
      <div className="space-y-8">
        {/* Leaderboard Skeleton */}
        <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
          <SkeletonBox className="h-6 w-40 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <SkeletonBox className="w-6 h-6 rounded" />
                <SkeletonBox className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <SkeletonBox className="h-4 w-24" />
                  <SkeletonBox className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
          <SkeletonBox className="h-10 w-full mt-4 rounded" />
        </div>

        {/* Friends Skeleton */}
        <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
          <SkeletonBox className="h-6 w-40 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <SkeletonBox className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <SkeletonBox className="h-4 w-24" />
                  <SkeletonBox className="h-3 w-16" />
                </div>
                <SkeletonBox className="w-8 h-8 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Arena View Skeleton
export const ArenaPageSkeleton = () => (
  <div className="animate-fade-in-up space-y-8">
    {/* Header Skeleton */}
    <div className="space-y-2">
      <SkeletonBox className="h-10 w-96" />
      <SkeletonBox className="h-5 w-full max-w-2xl" />
    </div>

    {/* Mode Cards Grid Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="relative rounded-2xl overflow-hidden border border-white/5 bg-neutral-900/50 p-6">
          <SkeletonBox className="h-48 w-full rounded-xl mb-4" />
          <SkeletonBox className="h-6 w-48 mb-2" />
          <SkeletonBox className="h-4 w-full mb-4" />
          <div className="flex gap-2 mb-4">
            {[1, 2, 3].map((j) => (
              <SkeletonBox key={j} className="h-6 w-20 rounded-full" />
            ))}
          </div>
          <SkeletonBox className="h-12 w-full rounded-xl" />
        </div>
      ))}
    </div>

    {/* Active Lobbies Skeleton */}
    <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <SkeletonBox className="h-6 w-40" />
        <SkeletonBox className="h-10 w-32 rounded-xl" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonBox key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

// Tournaments View Skeleton
export const TournamentsPageSkeleton = () => (
  <div className="animate-fade-in-up space-y-8">
    {/* Hero Banner Skeleton */}
    <SkeletonBox className="h-80 rounded-2xl" />

    {/* Filter Tabs Skeleton */}
    <div className="flex gap-4 border-b border-white/5 pb-4">
      {[1, 2, 3, 4].map((i) => (
        <SkeletonBox key={i} className="h-10 w-24 rounded-lg" />
      ))}
    </div>

    {/* Tournament Cards Grid Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
          <SkeletonBox className="h-40 rounded-xl mb-4" />
          <SkeletonBox className="h-6 w-3/4 mb-2" />
          <SkeletonBox className="h-4 w-full mb-4" />
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <SkeletonBox className="h-4 w-20" />
              <SkeletonBox className="h-4 w-24" />
            </div>
            <div className="flex justify-between">
              <SkeletonBox className="h-4 w-20" />
              <SkeletonBox className="h-4 w-20" />
            </div>
          </div>
          <SkeletonBox className="h-12 w-full rounded-xl" />
        </div>
      ))}
    </div>
  </div>
);

// Clan View Skeleton
export const ClanPageSkeleton = () => (
  <div className="animate-fade-in-up space-y-8">
    {/* Tabs Skeleton */}
    <div className="flex gap-4">
      <SkeletonBox className="h-12 w-32 rounded-xl" />
      <SkeletonBox className="h-12 w-32 rounded-xl" />
    </div>

    {/* Hero Banner Skeleton */}
    <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-neutral-900">
      <SkeletonBox className="h-64 w-full" />
      <div className="absolute bottom-0 left-0 right-0 p-8 flex gap-8 items-start">
        <SkeletonBox className="w-32 h-32 rounded-2xl" />
        <div className="flex-1 space-y-3">
          <SkeletonBox className="h-8 w-48" />
          <SkeletonBox className="h-4 w-96" />
          <div className="flex gap-4">
            {[1, 2, 3].map((i) => (
              <SkeletonBox key={i} className="h-6 w-20" />
            ))}
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Member List Skeleton */}
      <div className="lg:col-span-2 bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <SkeletonBox className="h-6 w-40" />
          <SkeletonBox className="h-10 w-32 rounded-xl" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-black/20">
              <SkeletonBox className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <SkeletonBox className="h-4 w-32" />
                <SkeletonBox className="h-3 w-24" />
              </div>
              <SkeletonBox className="h-8 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Clan Wars Skeleton */}
      <div className="space-y-6">
        <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
          <SkeletonBox className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 bg-white/5 rounded-xl">
                <SkeletonBox className="h-4 w-24 mb-2" />
                <SkeletonBox className="h-6 w-full mb-2" />
                <SkeletonBox className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);


// Ranking View Skeleton
export const RankingPageSkeleton = () => (
  <div className="animate-fade-in-up space-y-8 pb-10">
    {/* Header Skeleton */}
    <div className="flex flex-col md:flex-row justify-between items-end gap-4">
      <div className="space-y-2">
        <SkeletonBox className="h-8 w-64" />
        <SkeletonBox className="h-4 w-96 max-w-full" />
      </div>
      <SkeletonBox className="h-10 w-full md:w-64 rounded-xl" />
    </div>

    {/* Podium Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end justify-center py-10 px-4 md:px-20 relative">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`flex flex-col items-center ${i === 2 ? "-mt-10 order-2" : i === 1 ? "order-1" : "order-3"}`}>
          <SkeletonBox className={`rounded-full mb-4 ${i === 2 ? "w-28 h-28" : "w-24 h-24"}`} />
          <SkeletonBox className="h-6 w-32 mb-2" />
          <SkeletonBox className="h-4 w-20 mb-4" />
          <SkeletonBox className={`w-full rounded-t-lg ${i === 2 ? "h-40" : i === 1 ? "h-28" : "h-20"}`} />
        </div>
      ))}
    </div>

    {/* Leaderboard List Skeleton */}
    <div className="bg-neutral-900/50 border border-white/5 rounded-2xl overflow-hidden">
      <div className="border-b border-white/5 bg-white/5 p-4 flex justify-between">
        {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonBox key={i} className="h-4 w-20" />
        ))}
      </div>
      <div className="divide-y divide-white/5">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <SkeletonBox className="w-8 h-8 rounded-full" />
            <div className="flex items-center gap-3 flex-1">
              <SkeletonBox className="w-10 h-10 rounded-full" />
              <div className="space-y-1">
                <SkeletonBox className="h-4 w-32" />
                <SkeletonBox className="h-3 w-20" />
              </div>
            </div>
            <SkeletonBox className="h-4 w-16" />
            <SkeletonBox className="h-6 w-20 rounded hidden md:block" />
            <SkeletonBox className="h-4 w-24 hidden sm:block" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default { ProfilePageSkeleton, SettingsPageSkeleton, ProfileSettingsSkeleton, OverviewPageSkeleton, ArenaPageSkeleton, TournamentsPageSkeleton, ClanPageSkeleton, RankingPageSkeleton };

