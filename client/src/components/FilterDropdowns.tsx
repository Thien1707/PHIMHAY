
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'

type Filters = {
  types?: string[]
  countries: string[]
}

type CategoryItem = {
  _id: string
  name: string
  displayName?: string
}

const CATEGORY_LABEL_MAP: Record<string, string> = {
  hoathinh: 'Hoạt hình',
  series: 'Phim bộ',
  single: 'Phim lẻ'
}

export function FilterDropdowns() {
  const [filters, setFilters] = useState<Filters>({ countries: [] })
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [countriesLoading, setCountriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [countriesError, setCountriesError] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const nav = useNavigate()
  const category = searchParams.get('category')
  const country = searchParams.get('country')

  useEffect(() => {
    let mounted = true
    setCategoriesLoading(true)
    setCountriesLoading(true)
    setCategoriesError(null)
    setCountriesError(null)

    api<{ items: CategoryItem[] }>('/api/categories')
      .then((c) => {
        if (!mounted) return
        setCategories(c.items)
      })
      .catch((e: Error) => {
        if (!mounted) return
        // Backward-compatible fallback if backend route is not deployed yet.
        api<Filters>('/api/movies/filters')
          .then((f) => {
            if (!mounted) return
            const fallbackCategories = (f.types || []).map((name) => ({ _id: `type:${name}`, name }))
            setCategories(fallbackCategories)
            setCategoriesError(null)
          })
          .catch(() => {
            if (!mounted) return
            setCategoriesError(e.message || 'Không tải được danh sách thể loại')
          })
      })
      .finally(() => {
        if (!mounted) return
        setCategoriesLoading(false)
      })

    api<Filters>('/api/movies/filters')
      .then((f) => {
        if (!mounted) return
        setFilters(f)
      })
      .catch((e: Error) => {
        if (!mounted) return
        setCountriesError(e.message || 'Không tải được danh sách quốc gia')
      })
      .finally(() => {
        if (!mounted) return
        setCountriesLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  function categoryLabel(category: CategoryItem) {
    const mapped = CATEGORY_LABEL_MAP[category.name?.trim().toLowerCase()]
    return category.displayName?.trim() || mapped || category.name
  }

  function currentCategoryName() {
    if (!category) return 'Thể loại'
    const found = categories.find((c) => c._id === category || c._id === `type:${category}`)
    return found ? categoryLabel(found) : 'Thể loại'
  }

  function handleFilterChange(filterType: 'category' | 'country', value: string) {
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      if (filterType === 'category' && value.startsWith('type:')) {
        newParams.set('type', value.slice('type:'.length))
        newParams.delete('category')
      } else {
        newParams.set(filterType, value)
      }
    } else {
      newParams.delete(filterType)
      if (filterType === 'category') newParams.delete('type')
    }
    newParams.set('page', '1')
    // By navigating to `/` we ensure that we are on the home page when a filter is selected.
    nav(`/?${newParams.toString()}`)
  }
  return (
    <>
      <div className="filter-dropdown">
        <button className="filter-dropdown__button">
          {currentCategoryName()}
        </button>
        <div className="filter-dropdown__menu">
          <a onClick={() => handleFilterChange('category', '')}>Tất cả</a>
          {categoriesLoading && <a className="menu-hint">Đang tải...</a>}
          {categoriesError && <a className="menu-hint menu-hint--error">{categoriesError}</a>}
          {categories.map((c) => (
            <a key={c._id} onClick={() => handleFilterChange('category', c._id)}>
              {categoryLabel(c)}
            </a>
          ))}
        </div>
      </div>
      <div className="filter-dropdown">
        <button className="filter-dropdown__button">
          {country || 'Quốc gia'}
        </button>
        <div className="filter-dropdown__menu filter-dropdown__menu--country">
          <a onClick={() => handleFilterChange('country', '')}>Tất cả</a>
          {countriesLoading && <a className="menu-hint">Đang tải...</a>}
          {countriesError && <a className="menu-hint menu-hint--error">{countriesError}</a>}
          {filters.countries.map((c) => (
            <a key={c} onClick={() => handleFilterChange('country', c)}>
              {c}
            </a>
          ))}
        </div>
      </div>
      <style>{`
        .filter-dropdown {
          position: relative;
        }
        .filter-dropdown__button {
            background: transparent;
            color: #fff;
            border: 1px solid #444;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            cursor: pointer;
            font-size: 0.9rem;
        }
        .filter-dropdown:hover .filter-dropdown__menu {
          display: block;
        }
        .filter-dropdown__menu {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          background: #111;
          border: 1px solid #444;
          border-radius: 4px;
          padding: 0.5rem;
          max-height: 300px;
          overflow-y: auto;
          z-index: 10;
        }
        .filter-dropdown__menu a {
          display: block;
          padding: 0.5rem 1rem;
          color: #fff;
          text-decoration: none;
          cursor: pointer;
          white-space: nowrap;
        }
        .filter-dropdown__menu a:hover {
          background: #333;
        }
        .filter-dropdown__menu--country a {
          font-size: 0.8rem;
        }
        .filter-dropdown__menu--country {
          overflow-y: hidden;
        }
        .menu-hint {
          opacity: 0.75;
          cursor: default !important;
        }
        .menu-hint--error {
          color: #ff8181 !important;
        }
      `}</style>
    </>
  )
}
