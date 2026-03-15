import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

export function useProducts(filters = {}) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let query = supabase
      .from('products')
      .select(`*, categories(id, name, slug)`)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (filters.category) query = query.eq('categories.slug', filters.category)
    if (filters.search) query = query.ilike('name', `%${filters.search}%`)
    if (filters.inStock) query = query.eq('in_stock', true)
    if (filters.limit) query = query.limit(filters.limit)

    setLoading(true)
    query.then(({ data, error }) => {
      if (error) setError(error)
      else {
        let results = data || []
        if (filters.category && filters.category !== 'todos') {
          results = results.filter(p => p.categories?.slug === filters.category)
        }
        setProducts(results)
      }
      setLoading(false)
    })
  }, [filters.category, filters.search, filters.inStock, filters.limit])

  return { products, loading, error }
}

export function useProduct(slug) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    supabase
      .from('products')
      .select(`*, categories(id, name, slug)`)
      .eq('slug', slug)
      .single()
      .then(({ data }) => {
        setProduct(data)
        setLoading(false)
      })
  }, [slug])

  return { product, loading }
}

export function useCategories() {
  const [categories, setCategories] = useState([])
  useEffect(() => {
    supabase.from('categories').select('*').order('name')
      .then(({ data }) => setCategories(data || []))
  }, [])
  return categories
}
