// Skeleton placeholders for loading states. Mirrors the rough shapes
// of the real sections to avoid layout shift and feel more responsive.
import React from "react";

const SkelBlock = ({ className = "" }) => <div className={`skeleton ${className}`} />;

export const HeroSkeleton = () => (
    <section
        data-testid="hero-skeleton"
        className="relative overflow-hidden border-b border-[hsl(var(--brand-ink))]/10"
    >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-24 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
                <SkelBlock className="h-7 w-40 rounded-full" />
                <SkelBlock className="h-12 w-3/4 rounded-xl" />
                <SkelBlock className="h-12 w-2/3 rounded-xl" />
                <SkelBlock className="h-5 w-full rounded" />
                <SkelBlock className="h-5 w-5/6 rounded" />
                <div className="flex gap-3 mt-4">
                    <SkelBlock className="h-12 w-40 rounded-full" />
                    <SkelBlock className="h-12 w-44 rounded-full" />
                </div>
                <div className="grid grid-cols-3 gap-3 max-w-lg mt-6">
                    <SkelBlock className="h-16 rounded-xl" />
                    <SkelBlock className="h-16 rounded-xl" />
                    <SkelBlock className="h-16 rounded-xl" />
                </div>
            </div>
            <div className="relative">
                <SkelBlock className="h-[420px] rounded-[2rem]" />
            </div>
        </div>
    </section>
);

export const SubscriptionCardSkeleton = () => (
    <div className="rounded-2xl border border-[hsl(var(--brand-ink))]/10 dark:border-white/10 bg-white dark:bg-white/[0.03] p-7 space-y-4">
        <SkelBlock className="h-6 w-32 rounded" />
        <SkelBlock className="h-9 w-2/3 rounded" />
        <SkelBlock className="h-4 w-5/6 rounded" />
        <div className="space-y-2 pt-3">
            <SkelBlock className="h-12 w-full rounded-xl" />
            <SkelBlock className="h-12 w-full rounded-xl" />
            <SkelBlock className="h-12 w-full rounded-xl" />
        </div>
        <SkelBlock className="h-12 w-full rounded-full mt-4" />
    </div>
);

export const SubscriptionsSkeleton = ({ accent = "blue" }) => (
    <section className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
        <div className="mb-8 sm:mb-12 max-w-3xl space-y-3">
            <SkelBlock className="h-4 w-32 rounded" />
            <SkelBlock className="h-10 w-2/3 rounded" />
            <SkelBlock className="h-5 w-full rounded" />
        </div>
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <SubscriptionCardSkeleton />
            <SubscriptionCardSkeleton />
        </div>
    </section>
);

export const GameCardSkeleton = () => (
    <div className="rounded-2xl border border-[hsl(var(--brand-ink))]/10 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden">
        <SkelBlock className="aspect-[3/4] rounded-none" />
        <div className="p-4 space-y-3">
            <SkelBlock className="h-5 w-3/4 rounded" />
            <SkelBlock className="h-3 w-1/2 rounded" />
            <div className="flex gap-2 pt-2">
                <SkelBlock className="h-9 w-20 rounded-full" />
                <SkelBlock className="h-9 w-20 rounded-full" />
            </div>
        </div>
    </div>
);

export const GamesSkeleton = () => (
    <section className="bg-white/60 dark:bg-white/[0.03] border-y border-[hsl(var(--brand-ink))]/10 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <div className="mb-8 sm:mb-12 max-w-3xl space-y-3">
                <SkelBlock className="h-4 w-32 rounded" />
                <SkelBlock className="h-10 w-2/3 rounded" />
                <SkelBlock className="h-5 w-full rounded" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <GameCardSkeleton key={i} />
                ))}
            </div>
        </div>
    </section>
);

export const SectionSkeleton = () => (
    <section className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
        <div className="space-y-4 max-w-3xl mb-10">
            <SkelBlock className="h-4 w-28 rounded" />
            <SkelBlock className="h-9 w-2/3 rounded" />
            <SkelBlock className="h-5 w-full rounded" />
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
            <SkelBlock className="h-44 rounded-2xl" />
            <SkelBlock className="h-44 rounded-2xl" />
        </div>
    </section>
);

export const HomeSkeleton = () => (
    <div data-testid="home-skeleton" className="min-h-screen">
        <HeroSkeleton />
        <SubscriptionsSkeleton />
        <SectionSkeleton />
        <GamesSkeleton />
    </div>
);
