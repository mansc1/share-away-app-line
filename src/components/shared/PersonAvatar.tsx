import { useState } from "react";
import { useTrip } from "@/contexts/TripContext";
import { getPersonAvatar } from "@/utils/avatarUtils";

const SIZE_MAP = {
  sm: { box: "w-6 h-6", text: "text-xs" },
  md: { box: "w-8 h-8", text: "text-sm" },
  lg: { box: "w-12 h-12", text: "text-xl" },
} as const;

interface PersonAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const PersonAvatar = ({ name, size = "md", className = "" }: PersonAvatarProps) => {
  const { getAvatarForName } = useTrip();
  const [failed, setFailed] = useState(false);
  const url = name ? getAvatarForName(name) : null;
  const fallback = getPersonAvatar(name || "");
  const { box, text } = SIZE_MAP[size];

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={name}
        loading="lazy"
        referrerPolicy="no-referrer"
        className={`${box} rounded-full object-cover ${className}`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className={`${box} ${fallback.bg} rounded-full flex items-center justify-center text-white ${text} ${className}`}>
      {fallback.emoji}
    </div>
  );
};

export default PersonAvatar;
