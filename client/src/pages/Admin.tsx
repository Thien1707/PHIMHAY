import axios from 'axios'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

type MovieDoc = {
  _id: string
  slug: string
  title: string
  categoryIds?: string[]
  viewStatus: number
  commentRatingPolicy: 'public' | 'members'
  isActive: boolean
}

type CategoryDoc = {
  _id: string
  name: string
  displayName?: string
  movieIds: string[]
}

type MovieSearchMultiSelectProps = {
  movies: MovieDoc[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

function MovieSearchMultiSelect({ movies, selectedIds, onChange }: MovieSearchMultiSelectProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 180)
    return () => clearTimeout(timer)
  }, [query])

  const selectedMovies = useMemo(
    () => movies.filter((m) => selectedIds.includes(m._id)),
    [movies, selectedIds]
  )

  const filteredMovies = useMemo(() => {
    if (!debouncedQuery) return movies.slice(0, 200)
    return movies
      .filter((m) => m.title.toLowerCase().includes(debouncedQuery))
      .slice(0, 200)
  }, [movies, debouncedQuery])

  function toggleMovie(movieId: string) {
    if (selectedIds.includes(movieId)) {
      onChange(selectedIds.filter((id) => id !== movieId))
      return
    }
    onChange([...selectedIds, movieId])
  }

  return (
    <div className="item-picker">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tìm phim theo tên..."
        aria-label="Tìm phim theo tên"
        className="full-width-input"
      />
      <div className="item-picker__list">
        {filteredMovies.map((m) => {
          const checked = selectedIds.includes(m._id)
          return (
            <label key={m._id} className="item-picker__item">
              <input type="checkbox" checked={checked} onChange={() => toggleMovie(m._id)} />
              <span>{m.title}</span>
            </label>
          )
        })}
        {filteredMovies.length === 0 && <p className="muted">Không tìm thấy phim phù hợp.</p>}
      </div>
      <div className="item-picker__tags">
        {selectedMovies.map((m) => (
          <button
            key={m._id}
            type="button"
            className="item-tag"
            onClick={() => toggleMovie(m._id)}
            title="Bỏ chọn phim"
          >
            {m.title} ×
          </button>
        ))}
      </div>
      <p className="muted">Đã chọn: {selectedIds.length} phim</p>
    </div>
  )
}

type CategorySearchMultiSelectProps = {
  categories: CategoryDoc[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  getLabel: (c: CategoryDoc) => string
}

function CategorySearchMultiSelect({
  categories,
  selectedIds,
  onChange,
  getLabel,
}: CategorySearchMultiSelectProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 180)
    return () => clearTimeout(timer)
  }, [query])

  const selectedCategories = useMemo(
    () => categories.filter((c) => selectedIds.includes(c._id)),
    [categories, selectedIds]
  )

  const filteredCategories = useMemo(() => {
    if (!debouncedQuery) return categories
    return categories.filter((c) => getLabel(c).toLowerCase().includes(debouncedQuery))
  }, [categories, debouncedQuery, getLabel])

  function toggleCategory(categoryId: string) {
    if (selectedIds.includes(categoryId)) {
      onChange(selectedIds.filter((id) => id !== categoryId))
      return
    }
    onChange([...selectedIds, categoryId])
  }

  return (
    <div className="item-picker">
      <input
        className="full-width-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tìm category..."
      />
      <div className="item-picker__list">
        {filteredCategories.map((c) => (
          <label key={c._id} className="item-picker__item">
            <input
              type="checkbox"
              checked={selectedIds.includes(c._id)}
              onChange={() => toggleCategory(c._id)}
            />
            <span>{getLabel(c)}</span>
          </label>
        ))}
        {filteredCategories.length === 0 && <p className="muted">Không tìm thấy category.</p>}
      </div>
      <div className="item-picker__tags">
        {selectedCategories.map((c) => (
          <button
            key={c._id}
            type="button"
            className="item-tag"
            onClick={() => toggleCategory(c._id)}
          >
            {getLabel(c)} ×
          </button>
        ))}
      </div>
      <p className="muted">Đã chọn: {selectedCategories.length} categories</p>
    </div>
  )
}

type MovieSearchSingleSelectProps = {
  movies: MovieDoc[]
  selectedId: string
  onChange: (id: string) => void
  placeholder?: string
}

function MovieSearchSingleSelect({
  movies,
  selectedId,
  onChange,
  placeholder,
}: MovieSearchSingleSelectProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const selectedMovie = useMemo(() => movies.find((m) => m._id === selectedId), [movies, selectedId])

  useEffect(() => {
    setQuery(selectedMovie?.title || '')
  }, [selectedMovie])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 250)
    return () => clearTimeout(timer)
  }, [query])

  const filteredMovies = useMemo(() => {
    if (!debouncedQuery) return movies.slice(0, 100)
    if (selectedMovie && selectedMovie.title.toLowerCase() === debouncedQuery) {
      return movies.slice(0, 100)
    }
    return movies.filter((m) => m.title.toLowerCase().includes(debouncedQuery)).slice(0, 100)
  }, [movies, debouncedQuery, selectedMovie])

  function handleSelect(movieId: string) {
    onChange(movieId)
    setIsOpen(false)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setQuery(selectedMovie?.title || '')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [rootRef, selectedMovie])

  return (
    <div className="search-select" ref={rootRef}>
      <input
        className="full-width-input"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
          if (e.target.value.trim() === '' && selectedId) {
            onChange('')
          }
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder || 'Tìm phim...'}
      />
      {isOpen && (
        <div className="search-select__list">
          {filteredMovies.map((m) => (
            <div
              key={m._id}
              className={`search-select__item ${m._id === selectedId ? 'selected' : ''}`}
              onClick={() => handleSelect(m._id)}
            >
              {m.title}
            </div>
          ))}
          {filteredMovies.length === 0 && (
            <div className="search-select__item--disabled">Không tìm thấy phim.</div>
          )}
        </div>
      )}
    </div>
  )
}

type EditCategoryModalProps = {
  category: CategoryDoc | null
  movies: MovieDoc[]
  onClose: () => void
  onSave: (updatedCategory: CategoryDoc) => Promise<void>
  apiBaseUrl: string
}

function EditCategoryModal({ category, movies, onClose, onSave, apiBaseUrl }: EditCategoryModalProps) {
  if (!category) return null
  const safeCategory = category
  const [name, setName] = useState(safeCategory.name)
  const [displayName, setDisplayName] = useState(safeCategory.displayName || '')
  const [movieIds, setMovieIds] = useState(safeCategory.movieIds || [])
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    const normalizedName = name.trim()
    if (!normalizedName) {
      setError('Tên thể loại là bắt buộc')
      return
    }
    setIsBusy(true)
    setError(null)
    try {
      const res = await axios.put<{ category: CategoryDoc }>(
        `${apiBaseUrl}/api/categories/${safeCategory._id}`,
        {
          name: normalizedName,
          displayName: displayName.trim() || undefined,
          movieIds: movieIds,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('phimhay_token') || ''}`,
          },
        }
      )
      await onSave(res.data.category)
      onClose()
    } catch (err) {
      const message = axios.isAxiosError<{ error?: string }>(err)
        ? err.response?.data?.error || err.message
        : 'Cập nhật thể loại thất bại'
      setError(message)
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Chỉnh sửa thể loại</h2>
        <form onSubmit={handleSave} className="category-form">
          <label>
            Tên thể loại (slug)
            <input
              className="full-width-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Tên hiển thị
            <input
              className="full-width-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          <label>
            Phim trong thể loại
            <MovieSearchMultiSelect
              movies={movies}
              selectedIds={movieIds}
              onChange={setMovieIds}
            />
          </label>
          {error && <p className="error-text">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose} disabled={isBusy}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={isBusy}>
              {isBusy ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function Admin() {
  const { user, loading } = useAuth()
  const [items, setItems] = useState<MovieDoc[]>([])
  const [categories, setCategories] = useState<CategoryDoc[]>([])
  const [slug, setSlug] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [categoryDisplayName, setCategoryDisplayName] = useState('')
  const [selectedMovieIds, setSelectedMovieIds] = useState<string[]>([])
  const [selectedMovieForCategories, setSelectedMovieForCategories] = useState('')
  const [selectedCategoryIdsForMovie, setSelectedCategoryIdsForMovie] = useState<string[]>([])
  const [assignBusy, setAssignBusy] = useState(false)
  const [assignMessage, setAssignMessage] = useState<string | null>(null)
  const [categorySuccess, setCategorySuccess] = useState<string | null>(null)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [categoryBusy, setCategoryBusy] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryDoc | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const apiBaseUrl = useMemo(() => (import.meta.env.VITE_API_URL ?? '').trim(), [])

  async function load() {
    const d = await api<{ items: MovieDoc[] }>('/api/admin/movies')
    setItems(d.items)
  }

  async function loadCategories() {
    const d = await api<{ items: CategoryDoc[] }>('/api/categories')
    setCategories(d.items)
  }

  useEffect(() => {
    if (!user?.isAdmin) return
    Promise.all([load(), loadCategories()]).catch((e: Error) => setErr(e.message))
  }, [user?.isAdmin])

  useEffect(() => {
    if (!selectedMovieForCategories) {
      setSelectedCategoryIdsForMovie([])
      return
    }
    const movie = items.find((m) => m._id === selectedMovieForCategories)
    setSelectedCategoryIdsForMovie((movie?.categoryIds || []).map(String))
  }, [selectedMovieForCategories, items])

  function categoryLabel(category: CategoryDoc) {
    return category.displayName?.trim() || category.name
  }

  if (loading) return <p className="page muted">…</p>
  if (!user?.isAdmin) return <Navigate to="/" replace />

  async function importSlug() {
    const normalizedSlug = slug.trim()
    setErr(null)
    if (!normalizedSlug) {
      setErr('Vui lòng nhập slug trước khi import')
      return
    }
    setBusy(true)
    try {
      await api('/api/admin/movies/import', { method: 'POST', json: { slug: normalizedSlug } })
      setSlug('')
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Lỗi')
    } finally {
      setBusy(false)
    }
  }

  async function createCategory(e: FormEvent) {
    e.preventDefault()
    const normalizedName = categoryName.trim()
    if (!normalizedName) {
      setCategoryError('Tên thể loại là bắt buộc')
      setCategorySuccess(null)
      return
    }

    setCategoryBusy(true)
    setCategoryError(null)
    setCategorySuccess(null)
    try {
      const res = await axios.post<{ category: CategoryDoc }>(
        `${apiBaseUrl}/api/categories`,
        {
          name: normalizedName,
          displayName: categoryDisplayName.trim() || undefined,
          movieIds: selectedMovieIds,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('phimhay_token') || ''}`,
          },
        }
      )
      setCategories((prev) => [res.data.category, ...prev.filter((c) => c._id !== res.data.category._id)])
      setCategorySuccess('Tạo thể loại thành công')
      setCategoryName('')
      setCategoryDisplayName('')
      setSelectedMovieIds([])
      await Promise.all([load(), loadCategories()])
    } catch (error) {
      const message = axios.isAxiosError<{ error?: string }>(error)
        ? error.response?.data?.error || error.message
        : 'Tạo thể loại thất bại'
      setCategoryError(message)
    } finally {
      setCategoryBusy(false)
    }
  }

  async function handleUpdateCategory(updatedCategory: CategoryDoc) {
    setCategories((prev) => prev.map((c) => (c._id === updatedCategory._id ? updatedCategory : c)))
    setCategorySuccess('Cập nhật thể loại thành công.')
    await load()
  }

  async function deleteCategory(categoryId: string) {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thể loại này? Thao tác này không thể hoàn tác.'))
      return

    setCategoryError(null)
    setCategorySuccess(null)
    try {
      await axios.delete(`${apiBaseUrl}/api/categories/${categoryId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('phimhay_token') || ''}`,
        },
      })
      setCategories((prev) => prev.filter((c) => c._id !== categoryId))
      setCategorySuccess('Xóa thể loại thành công.')
    } catch (error) {
      const message = axios.isAxiosError<{ error?: string }>(error)
        ? error.response?.data?.error || error.message
        : 'Xóa thể loại thất bại'
      setCategoryError(message)
    }
  }

  async function assignExistingCategoriesToMovie(e: FormEvent) {
    e.preventDefault()
    if (!selectedMovieForCategories) {
      setAssignMessage('Vui lòng chọn phim trước')
      return
    }
    setAssignBusy(true)
    setAssignMessage(null)
    try {
      await api(`/api/movies/${selectedMovieForCategories}/categories`, {
        method: 'PUT',
        json: { categoryIds: selectedCategoryIdsForMovie },
      })
      setAssignMessage('Cập nhật category cho phim thành công')
      await Promise.all([load(), loadCategories()])
    } catch (e) {
      setAssignMessage(e instanceof Error ? e.message : 'Cập nhật category thất bại')
    } finally {
      setAssignBusy(false)
    }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setErr(null)
    try {
      await api(`/api/admin/movies/${id}`, { method: 'PATCH', json: body })
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Lỗi')
    }
  }

  async function remove(id: string) {
    if (!confirm('Bạn có chắc chắn muốn xóa không?')) return
    setErr(null)
    try {
      await api(`/api/admin/movies/${id}`, { method: 'DELETE' })
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Lỗi')
    }
  }

  return (
    <div className="page admin-page">
      {editingCategory && (
        <EditCategoryModal
          category={editingCategory}
          movies={items}
          onClose={() => setEditingCategory(null)}
          onSave={handleUpdateCategory}
          apiBaseUrl={apiBaseUrl}
        />
      )}
      <h1>Admin — CRUD phim</h1>
      <p className="muted">Import theo slug từ phimapi (ví dụ: ngoi-truong-xac-song).</p>
      {err && <p className="error-text">{err}</p>}
      <div className="import-form">
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="slug phimapi"
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault()
          }}
        />
        <button type="button" className="btn btn-primary" disabled={busy} onClick={importSlug}>
          Import
        </button>
      </div>

      <section className="category-section">
        <h2>Tạo thể loại mới</h2>
        <form onSubmit={createCategory} className="category-form">
          <label>
            Tên thể loại
            <input
              className="full-width-input"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Ví dụ: Action"
              required
            />
          </label>
          <label>
            Tên hiển thị (Tiếng Việt, tùy chọn)
            <input
              className="full-width-input"
              value={categoryDisplayName}
              onChange={(e) => setCategoryDisplayName(e.target.value)}
              placeholder="Ví dụ: Hoạt Hình"
            />
          </label>
          <label>
            Gán phim (tùy chọn)
            <MovieSearchMultiSelect
              movies={items}
              selectedIds={selectedMovieIds}
              onChange={setSelectedMovieIds}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={categoryBusy}>
            {categoryBusy ? 'Đang tạo...' : 'Tạo thể loại'}
          </button>
        </form>
        {categoryError && <p className="error-text">{categoryError}</p>}
        {categorySuccess && <p className="success-text">{categorySuccess}</p>}
        <div className="category-list">
          <h3>Các thể loại đã có</h3>
          {categories.length === 0 ? (
            <p className="muted">Chưa có category nào.</p>
          ) : (
            <ul>
              {categories.map((c) => (
                <li key={c._id}>
                  <span>
                    <strong>{categoryLabel(c)}</strong>{' '}
                    <span className="muted">[{c.name}] • ({c.movieIds?.length || 0} phim)</span>
                  </span>
                  <div className="category-actions">
                    <button
                      className="btn btn-ghost btn--sm"
                      onClick={() => setEditingCategory(c)}
                    >
                      Sửa
                    </button>
                    <button
                      className="btn btn-danger btn--sm"
                      onClick={() => deleteCategory(c._id)}
                    >
                      Xóa
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="category-section category-section--wide">
        <h2>Gán category có sẵn cho phim</h2>
        <form onSubmit={assignExistingCategoriesToMovie} className="category-form category-form--wide">
          <div className="assign-grid">
            <label>
              Chọn phim
              <MovieSearchSingleSelect
                movies={items}
                selectedId={selectedMovieForCategories}
                onChange={setSelectedMovieForCategories}
                placeholder="-- Chọn phim --"
              />
            </label>
            <label>
              Chọn Categories
              <CategorySearchMultiSelect
                categories={categories}
                selectedIds={selectedCategoryIdsForMovie}
                onChange={setSelectedCategoryIdsForMovie}
                getLabel={categoryLabel}
              />
            </label>
          </div>
          <button type="submit" className="btn btn-primary" disabled={assignBusy}>
            {assignBusy ? 'Đang cập nhật...' : 'Lưu category cho phim'}
          </button>
          {assignMessage && <p className="success-text">{assignMessage}</p>}
        </form>
      </section>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Slug</th>
            <th>View</th>
            <th>Bình luận/đánh giá</th>
            <th>Active</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((m) => (
            <tr key={m._id}>
              <td>{m.title}</td>
              <td className="muted">{m.slug}</td>
              <td>
                <select
                  value={m.viewStatus}
                  onChange={(e) => patch(m._id, { viewStatus: Number(e.target.value) })}
                >
                  <option value={0}>NORMAL (user + VIP)</option>
                  <option value={1}>VIP only</option>
                </select>
              </td>
              <td>
                <select
                  value={m.commentRatingPolicy}
                  onChange={(e) => patch(m._id, { commentRatingPolicy: e.target.value })}
                >
                  <option value="public">Public (guest xem được)</option>
                  <option value="members">Members (chỉ user đăng nhập)</option>
                </select>
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={m.isActive}
                  onChange={(e) => patch(m._id, { isActive: e.target.checked })}
                />
              </td>
              <td>
                <button type="button" className="btn btn-ghost btn--sm" onClick={() => remove(m._id)}>
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <style>{`
        .import-form {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .import-form input {
          flex: 1;
          min-width: 200px;
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        .admin-table th,
        .admin-table td {
          border-bottom: 1px solid #222;
          padding: 0.5rem 0.35rem;
          text-align: left;
          vertical-align: middle;
        }
        .admin-table select {
          max-width: 180px;
          font-size: 0.8rem;
        }
        .category-section {
          margin-bottom: 1.5rem;
          padding: 1.25rem;
          border: 1px solid #222;
          border-radius: 0.5rem;
          max-width: 980px;
        }
        .category-form {
          display: grid;
          gap: 0.75rem;
          margin-top: 0.75rem;
        }
        .category-form label {
          display: grid;
          gap: 0.35rem;
        }
        .category-form .full-width-input,
        .category-form select.full-width-input {
          width: 100%;
        }
        .success-text {
          color: #34d399;
          margin-top: 0.5rem;
        }
        .item-picker input {
          width: 100%;
        }
        .item-picker__list {
          margin-top: 0.35rem;
          border: 1px solid #2a2a2a;
          border-radius: 0.35rem;
          padding: 0.5rem;
          min-height: 120px;
          max-height: 220px;
          overflow: auto;
          display: grid;
          gap: 0.4rem;
        }
        .item-picker__item {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          cursor: pointer;
        }
        .item-picker__tags {
          margin-top: 0.5rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        .item-tag {
          border: 1px solid #3a3a3a;
          background: #2a2a2a;
          color: inherit;
          border-radius: 999px;
          padding: 0.2rem 0.65rem;
          cursor: pointer;
          font-size: 0.8rem;
          display: inline-flex;
          align-items: center;
        }
        .category-list {
          margin-top: 1rem;
          padding-top: 0.65rem;
          border-top: 1px dashed #2a2a2a;
        }
        .category-list ul {
          margin: 0.4rem 0 0;
          padding-left: 0;
          list-style: none;
          display: grid;
          gap: 0.5rem;
        }
        .category-list li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          border-radius: 0.35rem;
          background-color: #1a1a1a;
          border: 1px solid #2a2a2a;
        }
        .category-actions {
          display: flex;
          gap: 0.5rem;
        }
        .category-section--wide {
          max-width: 980px;
        }
        .category-form--wide {
          max-width: 100%;
        }
        .assign-grid {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          align-items: start;
        }
        .search-select {
          position: relative;
        }
        .search-select__list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #1a1a1a;
          border: 1px solid #3a3a3a;
          border-radius: 0.35rem;
          max-height: 240px;
          overflow-y: auto;
          z-index: 10;
          margin-top: 0.25rem;
        }
        .search-select__item {
          padding: 0.6rem 0.75rem;
          cursor: pointer;
          font-size: 0.9rem;
        }
        .search-select__item:hover {
          background: #2a2a2a;
        }
        .search-select__item.selected {
          font-weight: 500;
          background-color: #004494;
          color: white;
        }
        .search-select__item--disabled {
          padding: 0.6rem 0.75rem;
          color: #777;
        }
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 100;
        }
        .modal-content {
          background: #181818;
          padding: 1.5rem 2rem;
          border-radius: 0.5rem;
          border: 1px solid #2a2a2a;
          width: 90%;
          max-width: 620px;
        }
        .modal-actions {
          margin-top: 1.5rem;
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }
        .btn-danger {
          background-color: #ef4444;
          color: white;
        }
      `}</style>
    </div>
  )
}
