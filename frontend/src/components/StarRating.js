// File: /home/com2u/src/OrganAIzer/frontend/src/components/StarRating.js
// Purpose: Reusable star rating component with 0.5-star increments

import React, { useState, useEffect } from 'react';
import { hasuraService } from '../services/hasuraService';
import { useAuth } from '../contexts/AuthContext';
import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';

const StarRating = ({ 
  entryKey, 
  initialRating = 0, 
  maxStars = 5,
  size = 'md',
  interactive = true,
  showValue = false,
  precision = 0.5, // 0.5 for half-star increments, 1 for full stars only
  disabled = false,
  onRatingChange,
  className = ''
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRating(initialRating);
  }, [initialRating]);

  const handleRatingChange = async (newRating) => {
    if (!user || disabled || loading || !interactive) return;

    // If clicking the same rating, remove it (set to 0)
    const finalRating = rating === newRating ? 0 : newRating;

    // Optimistic update
    const previousRating = rating;
    setRating(finalRating);

    try {
      setLoading(true);
      await hasuraService.rateEntry(entryKey, finalRating);
      
      // Call callback if provided
      if (onRatingChange) {
        onRatingChange({
          entryKey,
          rating: finalRating,
          previousRating
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      setRating(previousRating);
      
      toast.error('Failed to update rating');
      console.error('Rating error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = (starValue) => {
    if (interactive && !disabled) {
      setHoverRating(starValue);
    }
  };

  const handleMouseLeave = () => {
    if (interactive && !disabled) {
      setHoverRating(0);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return {
          star: 'h-3 w-3',
          text: 'text-xs'
        };
      case 'sm':
        return {
          star: 'h-4 w-4',
          text: 'text-sm'
        };
      case 'lg':
        return {
          star: 'h-6 w-6',
          text: 'text-lg'
        };
      case 'xl':
        return {
          star: 'h-8 w-8',
          text: 'text-xl'
        };
      default: // md
        return {
          star: 'h-5 w-5',
          text: 'text-base'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  const getStarValue = (starIndex, isHalf = false) => {
    return starIndex + (isHalf ? 0.5 : 1);
  };

  const isStarFilled = (starIndex, isHalf = false) => {
    const starValue = getStarValue(starIndex, isHalf);
    const currentRating = hoverRating || rating;
    
    if (isHalf) {
      return currentRating >= starValue && currentRating < starValue + 0.5;
    } else {
      return currentRating >= starValue;
    }
  };

  const getStarColor = (starIndex, isHalf = false) => {
    const starValue = getStarValue(starIndex, isHalf);
    const currentRating = hoverRating || rating;
    
    if (disabled) {
      return currentRating >= starValue ? 'text-gray-400' : 'text-gray-300';
    }
    
    if (hoverRating > 0) {
      return hoverRating >= starValue ? 'text-yellow-400' : 'text-gray-300';
    }
    
    return currentRating >= starValue ? 'text-yellow-400' : 'text-gray-300';
  };

  const renderStar = (starIndex) => {
    const fullStarValue = starIndex + 1;
    const halfStarValue = starIndex + 0.5;
    
    const isFullFilled = isStarFilled(starIndex, false);
    const isHalfFilled = precision === 0.5 && isStarFilled(starIndex, true);
    
    return (
      <div 
        key={starIndex} 
        className="relative inline-block"
        onMouseLeave={handleMouseLeave}
      >
        {/* Full Star Background */}
        <StarIcon 
          className={`
            ${sizeClasses.star} 
            ${getStarColor(starIndex, false)}
            ${interactive && !disabled ? 'cursor-pointer' : 'cursor-default'}
            transition-colors duration-150
          `}
        />
        
        {/* Half Star (if precision allows) */}
        {precision === 0.5 && (
          <div
            className="absolute top-0 left-0 w-1/2 overflow-hidden"
            onMouseEnter={() => handleMouseEnter(halfStarValue)}
            onClick={() => handleRatingChange(halfStarValue)}
          >
            {isHalfFilled && (
              <StarIconSolid 
                className={`
                  ${sizeClasses.star} 
                  ${getStarColor(starIndex, true)}
                  ${interactive && !disabled ? 'cursor-pointer' : 'cursor-default'}
                  transition-colors duration-150
                `}
              />
            )}
          </div>
        )}
        
        {/* Full Star Overlay */}
        {isFullFilled && (
          <StarIconSolid 
            className={`
              absolute top-0 left-0
              ${sizeClasses.star} 
              ${getStarColor(starIndex, false)}
              ${interactive && !disabled ? 'cursor-pointer' : 'cursor-default'}
              transition-colors duration-150
            `}
          />
        )}
        
        {/* Click Areas */}
        {interactive && !disabled && (
          <>
            {/* Half star click area */}
            {precision === 0.5 && (
              <div
                className="absolute top-0 left-0 w-1/2 h-full cursor-pointer"
                onMouseEnter={() => handleMouseEnter(halfStarValue)}
                onClick={() => handleRatingChange(halfStarValue)}
                title={`Rate ${halfStarValue} star${halfStarValue !== 1 ? 's' : ''}`}
              />
            )}
            
            {/* Full star click area */}
            <div
              className={`absolute top-0 ${precision === 0.5 ? 'left-1/2 w-1/2' : 'left-0 w-full'} h-full cursor-pointer`}
              onMouseEnter={() => handleMouseEnter(fullStarValue)}
              onClick={() => handleRatingChange(fullStarValue)}
              title={`Rate ${fullStarValue} star${fullStarValue !== 1 ? 's' : ''}`}
            />
          </>
        )}
      </div>
    );
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {/* Stars */}
      <div 
        className={`flex items-center space-x-0.5 ${loading ? 'opacity-50' : ''}`}
        onMouseLeave={handleMouseLeave}
      >
        {Array.from({ length: maxStars }, (_, index) => renderStar(index))}
      </div>
      
      {/* Rating Value */}
      {showValue && (
        <span 
          className={`
            ml-2 
            font-medium 
            ${sizeClasses.text}
            ${loading ? 'opacity-50' : ''}
            ${rating > 0 ? 'text-gray-700' : 'text-gray-400'}
          `}
        >
          {rating > 0 ? rating.toFixed(precision === 0.5 ? 1 : 0) : '—'}
        </span>
      )}
      
      {/* Loading Indicator */}
      {loading && (
        <div className="ml-2">
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default StarRating;
