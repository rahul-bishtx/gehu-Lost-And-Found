import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (data) {
        setProfile(data)
      } else {
        // If profile doesn't exist yet (e.g. after email verification confirmation)
        const { data: userData } = await supabase.auth.getUser()
        const currentUser = userData?.user
        if (currentUser && currentUser.id === userId) {
          const defaultProfile = {
            id: currentUser.id,
            name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Student',
            email: currentUser.email,
            phone: currentUser.user_metadata?.phone || null,
            preferred_contact: 'email',
          }
          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .upsert(defaultProfile)
            .select()
            .single()
          
          if (!createError && createdProfile) {
            setProfile(createdProfile)
          } else {
            setProfile(defaultProfile)
          }
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  async function signUp({ email, password, name, phone, profilePhoto }) {
    const redirectUrl = `${import.meta.env.VITE_APP_URL}/login`
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: name,
          phone: phone || null,
        }
      }
    })
    if (error) throw error

    if (!data.user) {
      throw new Error('Please check your email for a confirmation link before logging in.')
    }

    // Only if session is immediately available (e.g. email confirmation disabled or auto-confirmed)
    if (data.session) {
      let photoUrl = null
      if (profilePhoto) {
        try {
          const fileExt = profilePhoto.name.split('.').pop()
          const filePath = `${data.user.id}/${Date.now()}.${fileExt}`
          const { error: uploadError } = await supabase.storage
            .from('profile-photos')
            .upload(filePath, profilePhoto)
          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('profile-photos')
              .getPublicUrl(filePath)
            photoUrl = urlData.publicUrl
          }
        } catch (uploadErr) {
          console.warn('Profile photo upload failed:', uploadErr)
        }
      }

      const newProfile = {
        id: data.user.id,
        name,
        email,
        phone: phone || null,
        profile_photo: photoUrl,
        preferred_contact: 'email',
      }

      try {
        await supabase
          .from('profiles')
          .upsert(newProfile)
      } catch (profileError) {
        console.warn('Profile insertion error:', profileError)
      }

      setUser(data.user)
      setProfile(newProfile)
      setLoading(false)
    }

    return data
  }

  async function resendVerification(email) {
    const redirectUrl = `${import.meta.env.VITE_APP_URL}/login`
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: redirectUrl,
      }
    })
    if (error) throw error
    return data
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
  }

  async function resetPassword(email) {
    const redirectUrl = `${import.meta.env.VITE_APP_URL}/login`
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })
    if (error) throw error
  }

  async function updateProfile(updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (error) throw error
    setProfile(data)
    return data
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    resendVerification,
    updateProfile,
    fetchProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
