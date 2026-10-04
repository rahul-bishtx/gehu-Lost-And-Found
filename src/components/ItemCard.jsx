import { Link } from 'react-router-dom'

const categoryIcons = {
  electronics: 'laptop_mac',
  accessories: 'watch',
  clothing: 'checkroom',
  academic: 'menu_book',
  'id-cards': 'badge',
  personal: 'wallet',
  other: 'category',
}

export default function ItemCard({ item }) {
  const isLost = item.type === 'lost'
  const icon = categoryIcons[item.category] || 'category'
  const dateStr = item.date
    ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : ''

  return (
    <Link
      to={`/item/${item.id}`}
      className="bg-surface-container-lowest rounded-[1.25rem] overflow-hidden shadow-sm hover:shadow-premium transition-all duration-500 hover:-translate-y-1.5 active:scale-[0.98] cursor-pointer border border-outline-variant/40 hover:border-primary/40 flex flex-col group animate-fade-in-up"
    >
      {/* Image with Gradient Overlay */}
      <div className="relative h-44 sm:h-52 w-full bg-surface-muted overflow-hidden">
        {item.image_url ? (
          <>
            <img
              src={item.image_url}
              alt={item.item_name}
              className="w-full h-full object-contain bg-surface-muted transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-muted to-surface-variant">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-20 group-hover:scale-110 transition-transform duration-500">{icon}</span>
          </div>
        )}
        
        {/* Premium Frosted Status Chip */}
        <div
          className={`absolute top-3 right-3 px-3.5 py-1.5 rounded-full font-heading text-[10px] sm:text-xs uppercase tracking-widest font-black shadow-md flex items-center gap-1.5 backdrop-blur-md border ${
            isLost
              ? 'bg-[#e65100]/90 text-white border-white/40 shadow-[#e65100]/40'
              : 'bg-[#2e7d32]/90 text-white border-white/40 shadow-[#2e7d32]/40'
          }`}
        >
          <span className="material-symbols-outlined text-[14px] font-bold">
            {isLost ? 'search' : 'check_circle'}
          </span>
          <span>{isLost ? 'LOST' : 'FOUND'}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col gap-1.5 flex-grow bg-white">
        <div className="flex items-center gap-2 mb-0.5 text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px] text-primary bg-primary/10 p-1 rounded-md">{icon}</span>
          <span className="font-body text-[11px] sm:text-xs font-bold uppercase tracking-wider capitalize truncate">{item.category?.replace('-', ' ')}</span>
        </div>
        <h3 className="font-heading text-lg sm:text-xl font-bold text-on-surface line-clamp-1 leading-snug group-hover:text-primary transition-colors">
          {item.item_name}
        </h3>
        <div className="mt-auto pt-3 flex flex-col gap-1.5 text-on-surface-variant text-[12px] sm:text-[13px] font-medium">
          <div className="flex items-center gap-2 truncate opacity-80">
            <span className="material-symbols-outlined text-[16px] shrink-0">calendar_today</span>
            <span className="font-body truncate">{dateStr || 'Recent'}</span>
          </div>
          <div className="flex items-center gap-2 truncate opacity-80">
            <span className="material-symbols-outlined text-[16px] shrink-0">location_on</span>
            <span className="font-body truncate">{item.location}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
