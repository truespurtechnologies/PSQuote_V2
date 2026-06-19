"use client"

import React, { useMemo } from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type UserProfileProps = {
  displayName?: string;
  email?: string;
  className?: string;
};

export function UserProfile({ displayName, email, className }: UserProfileProps) {
  const userInitial = useMemo(
    () => (displayName ? displayName.charAt(0).toUpperCase() : 'U'),
    [displayName]
  );

  return (
    <div className={cn("relative group", className)}>
      <div className="relative">
        <Avatar 
          className="h-10 w-10 bg-gradient-to-br from-red-700 to-red-800 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
          role="button"
          aria-label="User profile"
          tabIndex={0}
        >
          <AvatarFallback className="bg-transparent text-white text-base">
            {userInitial}
          </AvatarFallback>
        </Avatar>
        
        {/* Status indicator */}
        <div 
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white shadow-sm"
          aria-label="Online status"
        />
      </div>
      
      {/* Tooltip */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-gray-800 text-white text-sm font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg z-50"
        role="tooltip"
        aria-hidden={!displayName}
      >
        {displayName || 'User'}
        <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-gray-800 transform rotate-45 -mt-1"></div>
      </div>
    </div>
  );
}

// Helper function to ensure consistent class name concatenation
function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
