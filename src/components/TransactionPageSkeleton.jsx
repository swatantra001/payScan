import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

// A skeleton for your chart cards
const ChartSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
    <Skeleton className="h-[300px] w-full rounded-xl bg-neutral-800" />
    <Skeleton className="h-[300px] w-full rounded-xl bg-neutral-800" />
    <Skeleton className="h-[300px] w-full rounded-xl bg-neutral-800 md:col-span-2 lg:col-span-1" />
  </div>
);

// A skeleton for your table and summary cards
const TableSkeleton = () => (
  <div className="w-full flex flex-col h-[calc(80vh)] bg-[#08080a] rounded-lg mt-6">
    {/* Table Skeleton */}
    <div className="flex-grow overflow-auto">
      <div className="w-full text-left border-collapse">
        {/* Skeleton Header */}
        <div className="bg-[#01010e] sticky top-0 z-10 flex p-3 justify-between space-x-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-5 flex-1 bg-neutral-700" />
          ))}
        </div>
        {/* Skeleton Rows */}
        <div className="p-3 space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className={`border-b border-neutral-700 ${i & 1 ? 'bg-[#050505]' : 'bg-[#0e0e11]'}`} />
          ))}
        </div>
      </div>
    </div>
    {/* Summary Cards Skeleton */}
    <div className="flex-shrink-0 p-4 border-t border-neutral-700">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
        <Skeleton className="h-[100px] flex-1 rounded-xl bg-neutral-800" />
        <Skeleton className="h-[100px] flex-1 rounded-xl bg-neutral-800" />
      </div>
    </div>
  </div>
);

// The main skeleton page
const TransactionPageSkeleton = () => {
  return (
    <div className="min-h-screen min-w-screen !pt-3 bg-neutral-900 text-white p-4 md:p-8 font-sans">
      {/* Header Skeleton (matches your real header) */}
      <header className="w-full mb-3 sticky top-0 z-30 bg-[#0e0e11] shadow-md !p-2">
        <div className="flex justify-between items-center !px-2">
          <h1 className="text-3xl md:text-4xl font-extrabold">PayScan</h1>
          <div className='flex items-center gap-3 !px-5'>
            <Skeleton className="h-12 w-24 rounded-lg bg-neutral-800" />
            <Skeleton className="h-12 w-40 rounded-lg bg-neutral-800" />
            <Skeleton className="h-12 w-12 rounded-full bg-neutral-800" />
          </div>
        </div>
      </header>
      
      {/* Content Skeleton */}
      <main className="max-w-7xl mx-auto mt-6">
        <ChartSkeleton />
        <TableSkeleton />
      </main>
    </div>
  );
};

export default TransactionPageSkeleton;