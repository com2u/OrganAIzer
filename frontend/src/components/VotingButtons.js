// File: /home/com2u/src/OrganAIzer/frontend/src/components/VotingButtons.js
// Purpose: Reusable thumbs up/down voting interface component

import React, { useState, useEffect } from 'react';
import { hasuraService } from '../services/hasuraService';
import { useAuth } from '../contexts/AuthContext';
import {
  HandThumbUpIcon,
  HandThumbDownIcon,
} from '@heroicons/react/24/outline';
import {
  HandThumbUpIcon as HandThumbUpIconSolid,
  HandThumbDownIcon as HandThumbDownIconSolid,
} from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';

const VotingButtons = ({ 
  entryKey, 
  initialVotes = 0, 
  initialUserVote = 0, 
  size = 'md',
  showCount = true,
  disabled = false,
  onVoteChange,
  className = ''
}) => {
  const { user } = useAuth();
  const [totalVotes, setTotalVotes] = useState(initialVotes);
  const [userVote, setUserVote] = useState(initialUserVote); // -1, 0, or 1
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTotalVotes(initialVotes);
    setUserVote(initialUserVote);
  }, [initialVotes, initialUserVote]);

  const handleVote = async (vote) => {
    if (!user || disabled || loading) return;

    // Optimistic update
    const previousUserVote = userVote;
    const previousTotalVotes = totalVotes;
    
    let newUserVote = vote;
    let newTotalVotes = totalVotes;

    // If clicking the same vote, remove it (toggle off)
    if (userVote === vote) {
      newUserVote = 0;
      newTotalVotes = totalVotes - vote;
    } else {
      // If switching votes, adjust total accordingly
      newTotalVotes = totalVotes - previousUserVote + vote;
    }

    setUserVote(newUserVote);
    setTotalVotes(newTotalVotes);

    try {
      setLoading(true);
      await hasuraService.voteEntry(entryKey, newUserVote);
      
      // Call callback if provided
      if (onVoteChange) {
        onVoteChange({
          entryKey,
          userVote: newUserVote,
          totalVotes: newTotalVotes,
          previousUserVote,
          previousTotalVotes
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      setUserVote(previousUserVote);
      setTotalVotes(previousTotalVotes);
      
      toast.error('Failed to record vote');
      console.error('Vote error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          button: 'p-1',
          icon: 'h-3 w-3',
          text: 'text-xs'
        };
      case 'lg':
        return {
          button: 'p-3',
          icon: 'h-6 w-6',
          text: 'text-lg'
        };
      case 'xl':
        return {
          button: 'p-4',
          icon: 'h-8 w-8',
          text: 'text-xl'
        };
      default: // md
        return {
          button: 'p-2',
          icon: 'h-4 w-4',
          text: 'text-sm'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  const getVoteColor = (voteType) => {
    if (disabled) return 'bg-gray-200 text-gray-400 cursor-not-allowed';
    
    if (voteType === 1) {
      return userVote === 1 
        ? 'bg-green-500 text-white shadow-lg transform scale-105' 
        : 'bg-gray-200 text-gray-600 hover:bg-green-100 hover:text-green-600 hover:scale-105';
    } else {
      return userVote === -1 
        ? 'bg-red-500 text-white shadow-lg transform scale-105' 
        : 'bg-gray-200 text-gray-600 hover:bg-red-100 hover:text-red-600 hover:scale-105';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Thumbs Up Button */}
      <button
        onClick={() => handleVote(1)}
        disabled={disabled || loading}
        className={`
          ${sizeClasses.button} 
          rounded-lg 
          transition-all 
          duration-200 
          ${getVoteColor(1)}
          ${loading ? 'opacity-50' : ''}
        `}
        title={userVote === 1 ? 'Remove upvote' : 'Upvote'}
      >
        {userVote === 1 ? (
          <HandThumbUpIconSolid className={sizeClasses.icon} />
        ) : (
          <HandThumbUpIcon className={sizeClasses.icon} />
        )}
      </button>

      {/* Vote Count */}
      {showCount && (
        <span 
          className={`
            font-bold 
            ${sizeClasses.text} 
            min-w-[2rem] 
            text-center
            ${totalVotes > 0 ? 'text-green-600' : totalVotes < 0 ? 'text-red-600' : 'text-gray-600'}
            ${loading ? 'opacity-50' : ''}
          `}
        >
          {totalVotes > 0 ? `+${totalVotes}` : totalVotes}
        </span>
      )}

      {/* Thumbs Down Button */}
      <button
        onClick={() => handleVote(-1)}
        disabled={disabled || loading}
        className={`
          ${sizeClasses.button} 
          rounded-lg 
          transition-all 
          duration-200 
          ${getVoteColor(-1)}
          ${loading ? 'opacity-50' : ''}
        `}
        title={userVote === -1 ? 'Remove downvote' : 'Downvote'}
      >
        {userVote === -1 ? (
          <HandThumbDownIconSolid className={sizeClasses.icon} />
        ) : (
          <HandThumbDownIcon className={sizeClasses.icon} />
        )}
      </button>
    </div>
  );
};

export default VotingButtons;
