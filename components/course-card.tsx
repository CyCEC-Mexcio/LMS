import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Star, Users } from "lucide-react";

type CourseCardProps = {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  instructor: string;
  category: string;
  price: number;
  level: string;
  slug: string;
  enrollmentCount?: number;
  averageRating?: number;
  reviewCount?: number;
};

export default function CourseCard({
  id,
  title,
  description,
  thumbnail,
  instructor,
  category,
  price,
  level,
  slug,
  enrollmentCount = 0,
  averageRating = 0,
  reviewCount = 0,
}: CourseCardProps) {
  return (
    <Link href={`/browse/${slug}`} className="group block">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
        {/* Thumbnail */}
        <div className="aspect-video w-full bg-gray-200 relative overflow-hidden">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <BookOpen className="w-16 h-16" />
            </div>
          )}
          {/* Category Badge */}
          <div className="absolute top-3 right-3">
            <Badge className="bg-white/95 text-gray-900 hover:bg-white shadow-sm">
              {category}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-bold text-lg text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">
            {title}
          </h3>

          <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
            {description}
          </p>

          {/* Instructor */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-semibold text-white">
              {instructor?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <span className="text-sm text-gray-700 font-medium">
              {instructor}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
            {enrollmentCount > 0 && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{enrollmentCount}</span>
              </div>
            )}
            {averageRating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{averageRating.toFixed(1)}</span>
                <span className="text-gray-400">({reviewCount})</span>
              </div>
            )}
          </div>

          {/* Level Badge */}
          <div className="mb-4">
            <Badge variant="outline" className="text-xs capitalize">
              {level === "beginner" && "Principiante"}
              {level === "intermediate" && "Intermedio"}
              {level === "advanced" && "Avanzado"}
            </Badge>
          </div>

          {/* Price */}
          <div className="pt-4 border-t border-gray-200 mt-auto">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-gray-900">
                  ${price?.toFixed(2)}
                </span>
                <span className="text-sm text-gray-600 ml-1">MXN</span>
              </div>
              <div className="text-sm font-medium text-blue-600 group-hover:text-blue-700">
                Ver detalles →
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}