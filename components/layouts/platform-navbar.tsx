import Link from "next/link";
import UserAvatarDropdown from "./user-avatar-dropdown";

type Profile = {
  id: string;
  role: string;
  full_name: string | null;
  avatar_url: string | null;
};

export default function PlatformNavbar({ profile }: { profile: Profile }) {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href="/browse" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">L</span>
          </div>
          <span className="text-xl font-bold text-gray-900">
            LearnHub
          </span>
        </Link>

        {/* Search Bar (we'll implement this later) */}
        <div className="flex-1 max-w-2xl mx-8">
          <input
            type="search"
            placeholder="Buscar cursos..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* User Avatar & Dropdown */}
        <UserAvatarDropdown profile={profile} />
      </div>
    </nav>
  );
}