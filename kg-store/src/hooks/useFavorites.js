import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabase'

export function useFavorites(userId) {
  const [favorites, setFavorites] = useState(new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) { setFavorites(new Set()); return }
    setLoading(true)
    supabase
      .from('favorites')
      .select('product_id')
      .eq('user_id', userId)
      .then(({ data }) => {
        setFavorites(new Set((data || []).map(f => f.product_id)))
        setLoading(false)
      })
  }, [userId])

  const toggle = useCallback(async (productId) => {
    if (!userId) return false
    const isFav = favorites.has(productId)

    // Optimistic update
    setFavorites(prev => {
      const next = new Set(prev)
      isFav ? next.delete(productId) : next.add(productId)
      return next
    })

    if (isFav) {
      await supabase.from('favorites').delete()
        .eq('user_id', userId).eq('product_id', productId)
    } else {
      await supabase.from('favorites').insert({ user_id: userId, product_id: productId })
    }

    return !isFav
  }, [userId, favorites])

  return { favorites, loading, toggle, isFav: (id) => favorites.has(id) }
}
