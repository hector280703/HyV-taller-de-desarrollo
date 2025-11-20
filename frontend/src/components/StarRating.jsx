import { useState } from 'react';
import PropTypes from 'prop-types';

const StarRating = ({ rating, onRatingChange, readonly = false, size = 'medium' }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    small: 'star-small',
    medium: 'star-medium',
    large: 'star-large',
  };

  const handleClick = (value) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (!readonly) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const getStarClass = (index) => {
    const value = index + 1;
    const currentRating = hoverRating || rating;
    
    if (currentRating >= value) {
      return 'star-filled';
    } else if (currentRating >= value - 0.5) {
      return 'star-half';
    }
    return 'star-empty';
  };

  return (
    <div className={`star-rating ${readonly ? 'readonly' : 'interactive'}`}>
      {[...Array(5)].map((_, index) => (
        <span
          key={index}
          className={`star ${sizeClasses[size]} ${getStarClass(index)}`}
          onClick={() => handleClick(index + 1)}
          onMouseEnter={() => handleMouseEnter(index + 1)}
          onMouseLeave={handleMouseLeave}
          role={readonly ? 'img' : 'button'}
          aria-label={`${index + 1} estrellas`}
        >
          ★
        </span>
      ))}
      {!readonly && (
        <span className="rating-text">
          {hoverRating || rating || 0} / 5
        </span>
      )}
    </div>
  );
};

StarRating.propTypes = {
  rating: PropTypes.number.isRequired,
  onRatingChange: PropTypes.func,
  readonly: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
};

export default StarRating;
