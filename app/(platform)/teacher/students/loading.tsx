import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function TeacherStudentsLoading() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
      {/* Page Header Skeleton */}
      <div>
        <div className="h-8 w-56 bg-gray-200 rounded-md mb-2" />
        <div className="h-4 w-96 bg-gray-200 rounded-md" />
      </div>

      {/* 4 Summary Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border border-gray-200">
            <CardHeader className="pb-2">
              <div className="h-4 w-28 bg-gray-200 rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded mb-1" />
              <div className="h-3 w-32 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Bar Skeleton */}
      <Card className="border border-gray-200">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="h-10 flex-1 min-w-[240px] bg-gray-200 rounded-md" />
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-10 w-44 bg-gray-200 rounded-md" />
              <div className="h-10 w-40 bg-gray-200 rounded-md" />
              <div className="h-10 w-48 bg-gray-200 rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Skeleton */}
      <Card className="border border-gray-200">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="h-6 w-64 bg-gray-200 rounded" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-200" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="h-3 w-44 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="h-4 w-40 bg-gray-200 rounded hidden md:block" />
                <div className="w-36 space-y-1 hidden sm:block">
                  <div className="h-3 w-28 bg-gray-200 rounded mx-auto" />
                  <div className="h-2 w-full bg-gray-200 rounded-full" />
                </div>
                <div className="h-6 w-24 bg-gray-200 rounded-full" />
                <div className="h-8 w-28 bg-gray-200 rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
