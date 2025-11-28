import React from 'react';

const PRICING_COLORS = {
  'Freemium': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
  'Paid': 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
  'Open Source': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
  'Free/Open Source': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
  'Free': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
};

/**
 * SimilarToolCard - compact card used in Alternatives/Related section
 * Props:
 *  - tool: object with fields { id, slug, name, logo_url, short_description, category, rating, pricing_model }
 *  - onClick: function(identifier) called when user clicks the card
 */
const SimilarToolCard = ({ tool = {}, onClick }) => {
  const handleClick = (e) => {
    e && e.preventDefault();
    const identifier = tool.slug || tool.id;
    if (typeof onClick === 'function') onClick(identifier);
  };

  const pricing = tool.pricing_model || tool.pricing || '';
  const pricingClasses = PRICING_COLORS[pricing] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';

  const rating = typeof tool.rating === 'number' ? tool.rating : (tool.rating ? Number(tool.rating) : null);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter') handleClick(e); }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col gap-3 cursor-pointer hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        {tool.logo_url ? (
          <img
            src={tool.logo_url.startsWith('http') ? tool.logo_url : `http://localhost:8000${tool.logo_url}`}
            alt={tool.name}
            className="w-12 h-12 rounded-md object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg font-bold text-primary">
            {(tool.name || '?').charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{tool.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{tool.short_description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 dark:text-gray-500">{tool.category || ''}</span>
          {rating !== null && (
            <div className="inline-flex items-center gap-2">
              <div className="flex gap-1">
                {[1,2,3,4,5].map((s) => (
                  <span
                    key={s}
                    className="material-symbols-outlined text-sm"
                    style={{
                      color: s <= Math.round(rating) ? '#FFD700' : '#D1D5DB',
                      fontVariationSettings: s <= Math.round(rating) ? "'FILL' 1" : "'FILL' 0"
                    }}
                  >
                    star
                  </span>
                ))}
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-300">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${pricingClasses} border ${pricing === 'Paid' ? 'border-red-200 dark:border-red-500/20' : 'border-blue-200 dark:border-blue-500/20'}`}>
          {pricing || 'Unknown'}
        </div>
      </div>
    </div>
  );
};

export default SimilarToolCard;
