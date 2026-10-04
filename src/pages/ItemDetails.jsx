import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function ItemDetails() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [reporter, setReporter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)

  useEffect(() => {
    fetchItem()
  }, [id])

  async function fetchItem() {
    const { data, error } = await supabase.from('items').select('*').eq('id', id).single()
    if (error || !data) { navigate('/'); return }
    setItem(data)
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user_id).maybeSingle()
    setReporter(profile || { name: 'Campus Student', email: '', preferred_contact: 'email' })
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this item?')) return
    setDeleting(true)
    await supabase.from('items').delete().eq('id', id)
    navigate(item.type === 'lost' ? '/lost' : '/found')
  }

  async function handleStatusUpdate() {
    setStatusUpdating(true)
    const newStatus = item.type === 'lost' ? 'recovered' : 'returned'
    await supabase.from('items').update({ status: newStatus }).eq('id', id)
    setItem({ ...item, status: newStatus })
    setStatusUpdating(false)
  }

  const [copied, setCopied] = useState('')
  const [lightbox, setLightbox] = useState(false)

  // Close lightbox on ESC key
  const closeLightbox = useCallback(() => setLightbox(false), [])
  useEffect(() => {
    if (!lightbox) return
    const onKey = (e) => { if (e.key === 'Escape') closeLightbox() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, closeLightbox])

  function formatWhatsAppNumber(phone) {
    if (!phone) return ''
    let cleaned = phone.replace(/\D/g, '')
    // If it's a standard 10-digit Indian phone number without country code
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned
    } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
      cleaned = '91' + cleaned.slice(1)
    }
    return cleaned
  }

  function handleEmailContact() {
    const email = reporter?.email || item?.contact_email
    if (!email) {
      alert('Email address not provided for this user.')
      return
    }
    const isLost = item.type === 'lost'
    const subject = encodeURIComponent(`Regarding ${isLost ? 'Lost' : 'Found'} Item: ${item.item_name} (GEHU Lost & Found)`)
    const body = encodeURIComponent(
      `Hi ${reporter?.name || 'there'},\n\nI saw your post on GEHU Lost & Found regarding the item "${item.item_name}" (${isLost ? 'Lost on' : 'Found on'} ${item.date || 'recently'}).\n\nI would like to get in touch with you about this.\n\nThank you!`
    )
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
  }

  function handlePhoneCall() {
    const phone = reporter?.phone || item?.contact_phone
    if (!phone) {
      alert('Phone number not provided by this user.')
      return
    }
    const cleanPhone = phone.replace(/[^\d+]/g, '')
    window.location.href = `tel:${cleanPhone}`
  }

  function handleWhatsAppContact() {
    const phone = reporter?.phone || item?.contact_phone
    if (!phone) {
      alert('Phone number not provided for this user.')
      return
    }
    const waNumber = formatWhatsAppNumber(phone)
    const isLost = item.type === 'lost'
    const message = encodeURIComponent(
      `Hi ${reporter?.name || 'there'}! I am contacting you from GEHU Lost & Found regarding the item "${item.item_name}" (${isLost ? 'Lost' : 'Found'} item at ${item.location || 'campus'}).`
    )
    const waUrl = `https://wa.me/${waNumber}?text=${message}`
    window.open(waUrl, '_blank', 'noopener,noreferrer')
  }

  function handlePrimaryContact() {
    const pref = item?.contact_method || reporter?.preferred_contact || 'email'
    const hasPhone = reporter?.phone || item?.contact_phone
    if (pref === 'whatsapp') {
      if (hasPhone) {
        handleWhatsAppContact()
      } else {
        handleEmailContact()
      }
    } else if (pref === 'phone') {
      if (hasPhone) {
        handlePhoneCall()
      } else {
        handleEmailContact()
      }
    } else {
      handleEmailContact()
    }
  }

  function copyToClipboard(text, type) {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(''), 2500)
  }

  if (loading) {
    return (
      <main className="flex-grow flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  if (!item) return null

  const isLost = item.type === 'lost'
  const isOwner = user?.id === item.user_id
  const dateStr = item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
  const preferredContact = item.contact_method || reporter?.preferred_contact || 'email'

  const metaItems = [
    { icon: 'info', label: 'Status', value: item.status === 'active' ? (isLost ? 'Lost' : 'Found') : (isLost ? 'Recovered' : 'Returned'), color: isLost ? 'text-status-lost-text' : 'text-status-found-text' },
    { icon: 'category', label: 'Category', value: item.category?.replace('-', ' '), color: 'text-primary' },
    { icon: 'calendar_today', label: `Date ${isLost ? 'Lost' : 'Found'}`, value: dateStr, color: 'text-primary' },
    { icon: 'schedule', label: 'Approx. Time', value: item.time || 'Not specified', color: 'text-primary' },
    { icon: 'location_on', label: 'Location', value: item.location, color: 'text-primary' },
    { icon: 'my_location', label: 'Specific Spot', value: item.specific_location || 'Not specified', color: 'text-primary' },
  ]

  if (!isLost && item.current_location) {
    metaItems.push({ icon: 'pin_drop', label: 'Current Location', value: item.current_location, color: 'text-primary' })
  }

  return (
    <main className="flex-grow w-full px-4 sm:px-6 md:px-gutter max-w-5xl mx-auto py-4 sm:py-6 md:py-10 pb-24 md:pb-12">
      {/* Breadcrumbs */}
      <nav className="mb-4 sm:mb-6 flex items-center text-on-surface-variant font-body text-xs sm:text-sm font-semibold gap-1.5 sm:gap-2">
        <Link to={isLost ? '/lost' : '/found'} className="hover:text-primary transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">{isLost ? 'search' : 'volunteer_activism'}</span>
          <span>{isLost ? 'Lost Items' : 'Found Items'}</span>
        </Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-on-surface font-semibold truncate max-w-[180px] sm:max-w-xs">{item.item_name}</span>
      </nav>

      {/* Resolved Banner */}
      {item.status !== 'active' && (
        <div className={`mb-5 px-4 sm:px-6 py-3.5 rounded-xl font-body text-xs sm:text-sm font-semibold flex items-center gap-2 ${
          isLost ? 'bg-status-found-bg text-status-found-text' : 'bg-status-found-bg text-status-found-text'
        }`}>
          <span className="material-symbols-outlined fill text-[20px]">check_circle</span>
          <span>This item has been marked as {isLost ? 'recovered' : 'returned'}.</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-8">
        {/* Image */}
        <div className="col-span-1 md:col-span-5 lg:col-span-5 flex flex-col gap-4">
          <div className="w-full aspect-[4/3] sm:aspect-square md:aspect-[4/5] bg-surface-muted rounded-2xl overflow-hidden shadow-sm relative group border border-outline-variant/30">
            {item.image_url ? (
              <div className="relative w-full h-full cursor-zoom-in" onClick={() => setLightbox(true)}>
                <img src={item.image_url} alt={item.item_name} className="w-full h-full object-contain bg-surface-muted transition-transform duration-500 group-hover:scale-105" />
                {/* Zoom hint */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all duration-200 flex items-center justify-center pointer-events-none">
                  <span className="material-symbols-outlined text-white text-4xl opacity-0 group-hover:opacity-100 drop-shadow-lg transition-opacity duration-200">zoom_in</span>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-30">image</span>
              </div>
            )}
            <div className={`absolute top-3.5 right-3.5 px-3.5 py-1.5 rounded-xl font-heading text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg border ${
              isLost
                ? 'bg-[#ff5722] text-white border-white/40 shadow-[#ff5722]/40'
                : 'bg-[#2e7d32] text-white border-white/40 shadow-[#2e7d32]/40'
            }`}>
              <span className="material-symbols-outlined text-[16px] font-black">{isLost ? 'search' : 'check_circle'}</span>
              <span>{isLost ? 'LOST ITEM' : 'FOUND ITEM'}</span>
            </div>
          </div>
        </div>

        {/* Lightbox Modal */}
        {lightbox && item.image_url && (
          <div
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 z-10"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
            <img
              src={item.image_url}
              alt={item.item_name}
              className="max-w-[95vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Details */}
        <div className="col-span-1 md:col-span-7 lg:col-span-7 flex flex-col justify-between gap-5">
          <div>
            <div className="mb-4">
              <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-on-surface mb-2 tracking-tight leading-snug">{item.item_name}</h1>
              {item.description && (
                <p className="font-body text-sm sm:text-base text-on-surface-variant leading-relaxed">{item.description}</p>
              )}
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 p-3.5 sm:p-5 bg-surface-muted rounded-2xl border border-outline-variant/30">
              {metaItems.map((meta) => (
                <div key={meta.label} className="flex items-start gap-2.5 p-1.5">
                  <div className={`p-2 bg-surface rounded-xl shadow-xs shrink-0 ${meta.color}`}>
                    <span className="material-symbols-outlined text-[18px] sm:text-[20px]">{meta.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-body text-[10px] sm:text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-0.5">{meta.label}</p>
                    <p className="font-body text-xs sm:text-sm font-semibold text-on-surface capitalize truncate">{meta.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reporter & Contact */}
          {reporter && (
            <div className="flex flex-col gap-3.5 p-4 sm:p-5 bg-surface border border-outline-variant/30 rounded-2xl shadow-level-1">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-surface-muted bg-surface-container shrink-0">
                  {reporter.profile_photo && reporter.profile_photo !== '' ? (
                    <img src={reporter.profile_photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                      <span className="material-symbols-outlined">person</span>
                    </div>
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-body text-[10px] sm:text-xs font-medium text-on-surface-variant uppercase tracking-wider">Reported By</p>
                  <p className="font-body text-base sm:text-lg font-bold text-on-surface truncate">{reporter.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-body text-[10px] sm:text-xs font-medium text-on-surface-variant uppercase tracking-wider">Prefers</p>
                  <div className="flex items-center justify-end gap-1 text-primary font-bold mt-0.5">
                    <span className="material-symbols-outlined text-[16px]">
                      {preferredContact === 'phone' ? 'phone' : preferredContact === 'whatsapp' ? 'chat' : 'mail'}
                    </span>
                    <span className="font-body text-xs capitalize">{preferredContact}</span>
                  </div>
                </div>
              </div>

              {/* Copy Feedback Toast */}
              {copied && (
                <div className="bg-status-found-bg text-status-found-text px-3 py-1.5 rounded-lg text-xs font-body font-semibold text-center animate-fade-in">
                  Copied {copied} to clipboard!
                </div>
              )}

              {/* Actions Section */}
              <div className="flex flex-col gap-2.5 pt-3 border-t border-outline-variant/30">
                {!isOwner && item.status === 'active' && (
                  <div className="flex flex-col gap-2.5">
                    {/* Primary Preferred Contact Button */}
                    <button
                      onClick={handlePrimaryContact}
                      className={`w-full text-white font-body text-sm sm:text-base font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] min-h-[50px] ${
                        preferredContact === 'whatsapp'
                          ? 'bg-[#25D366] hover:bg-[#1EBE5D]'
                          : preferredContact === 'phone'
                          ? 'bg-[#0070BA] hover:bg-[#005FA3]'
                          : 'bg-primary hover:bg-surface-tint'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[22px]">
                        {preferredContact === 'whatsapp' ? 'chat' : preferredContact === 'phone' ? 'call' : 'mail'}
                      </span>
                      <span>
                        {preferredContact === 'whatsapp'
                          ? 'Message on WhatsApp'
                          : preferredContact === 'phone'
                          ? 'Call Reporter'
                          : 'Send Email'}
                      </span>
                    </button>

                    {/* Alternative Quick Contact Channels */}
                    <div className="grid grid-cols-3 gap-2 pt-0.5">
                      {/* Email Option */}
                      <button
                        type="button"
                        onClick={handleEmailContact}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-surface-muted hover:bg-surface-variant text-on-surface border border-outline-variant/30 font-body text-xs font-semibold transition-colors min-h-[44px]"
                        title={reporter.email || 'Send Email'}
                      >
                        <span className="material-symbols-outlined text-[18px] text-primary">mail</span>
                        <span>Mail</span>
                      </button>

                      {/* Phone Call Option */}
                      <button
                        type="button"
                        onClick={handlePhoneCall}
                        disabled={!reporter.phone && !item?.contact_phone}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-surface-muted hover:bg-surface-variant text-on-surface border border-outline-variant/30 font-body text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
                        title={reporter.phone || 'Phone number not available'}
                      >
                        <span className="material-symbols-outlined text-[18px] text-blue-600">call</span>
                        <span>Call</span>
                      </button>

                      {/* WhatsApp Option */}
                      <button
                        type="button"
                        onClick={handleWhatsAppContact}
                        disabled={!reporter.phone && !item?.contact_phone}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-surface-muted hover:bg-surface-variant text-on-surface border border-outline-variant/30 font-body text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
                        title={reporter.phone ? 'Open WhatsApp Chat' : 'Phone number not available'}
                      >
                        <span className="material-symbols-outlined text-[18px] text-[#25D366]">chat</span>
                        <span>WhatsApp</span>
                      </button>
                    </div>

                    {/* Reporter Contact Info Quick View / Copy */}
                    <div className="flex items-center justify-between text-xs text-on-surface-variant bg-surface-container/40 p-2.5 rounded-xl border border-outline-variant/20">
                      <div className="flex flex-col gap-0.5 truncate pr-2">
                        {reporter.email && (
                          <span className="truncate"><strong>Email:</strong> {reporter.email}</span>
                        )}
                        {reporter.phone && (
                          <span className="truncate"><strong>Phone:</strong> {reporter.phone}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {reporter.email && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(reporter.email, 'email')}
                            className="p-1.5 hover:bg-surface-variant rounded-lg text-on-surface-variant hover:text-primary transition-colors"
                            title="Copy email"
                          >
                            <span className="material-symbols-outlined text-[18px]">content_copy</span>
                          </button>
                        )}
                        {reporter.phone && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(reporter.phone, 'phone')}
                            className="p-1.5 hover:bg-surface-variant rounded-lg text-on-surface-variant hover:text-primary transition-colors"
                            title="Copy phone"
                          >
                            <span className="material-symbols-outlined text-[18px]">phone_iphone</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Owner controls */}
                {isOwner && item.status === 'active' && (
                  <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                    <button
                      onClick={handleStatusUpdate}
                      disabled={statusUpdating}
                      className="flex-1 bg-status-found-text text-white font-body text-sm font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 min-h-[48px]"
                    >
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      <span>Mark as {isLost ? 'Recovered' : 'Returned'}</span>
                    </button>
                    <Link
                      to={`/report?edit=${item.id}`}
                      className="px-4 py-3 border-2 border-primary text-primary font-body text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors active:scale-95 min-h-[48px]"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                      <span>Edit</span>
                    </Link>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-4 py-3 border-2 border-error text-error font-body text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-error-container/30 transition-colors active:scale-95 disabled:opacity-50 min-h-[48px]"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
