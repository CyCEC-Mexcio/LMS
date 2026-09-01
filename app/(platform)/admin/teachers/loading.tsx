import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AdminTeachersLoading() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div>
        <div className="h-8 w-64 bg-gray-200 rounded-md mb-2" />
        <div className="h-4 w-96 bg-gray-200 rounded-md" />
      </div>

      {/* 3 Summary Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border border-gray-200">
            <CardHeader className="pb-2">
              <div className="h-4 w-32 bg-gray-200 rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded mb-1" />
              <div className="h-3 w-36 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search Input Skeleton */}
      <Card className="border border-gray-200">
        <CardContent className="pt-6">
          <div className="h-10 w-full bg-gray-200 rounded-md" />
        </CardContent>
      </Card>

      {/* Teacher Cards Skeleton */}
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="border border-gray-200 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-gray-200" />
                <div className="space-y-1.5">
                  <div className="h-4 w-40 bg-gray-200 rounded" />
                  <div className="h-3 w-56 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-7 w-20 bg-gray-200 rounded-lg" />
                <div className="h-7 w-24 bg-gray-200 rounded-lg" />
                <div className="h-8 w-8 bg-gray-200 rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
