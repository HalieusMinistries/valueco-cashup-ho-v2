import { useState, useEffect } from 'react'
import { fetchUsers, createUser, updateUser } from '../api/client'
import type { AppUser } from '../api/client'
import { VCL_STORES } from '../utils/stores'

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<AppUser | null>(null)

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('Store')
  const [storeCode, setStoreCode] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const u = await fetchUsers()
      setUsers(u)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditUser(null)
    setFullName(''); setUsername(''); setPassword('')
    setRole('Store'); setStoreCode(''); setIsActive(true)
    setFormError('')
    setShowForm(true)
  }

  function openEdit(u: AppUser) {
    setEditUser(u)
    setFullName(u.fullName); setUsername(u.username); setPassword('')
    setRole(u.role); setStoreCode(u.storeCode ?? ''); setIsActive(u.isActive)
    setFormError('')
    setShowForm(true)
  }

  async function save() {
    if (!fullName || !username) { setFormError('Full name and username are required'); return }
    if (!editUser && !password) { setFormError('Password is required for new users'); return }
    if (role === 'Store' && !storeCode) { setFormError('Store is required for store users'); return }
    setSaving(true)
    setFormError('')
    try {
      if (editUser) {
        await updateUser(editUser.userId, {
          fullName, role,
          storeCode: role === 'HO' ? null : storeCode,
          isActive,
          password: password || undefined
        })
      } else {
        await createUser({
          fullName, username, password, role,
          storeCode: role === 'HO' ? null : storeCode
        })
      }
      setShowForm(false)
      load()
    } catch (e: any) {
      setFormError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const hoUsers = users.filter(u => u.role === 'HO')
  const storeUsers = users.filter(u => u.role === 'Store')

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <span style={{fontFamily:'var(--mono)',fontSize:14,fontWeight:600}}>User Management</span>
        <button className="btn pri" style={{width:'auto'}} onClick={openCreate}>+ New User</button>
      </div>

      {loading && <div className="msg info">Loading users...</div>}
      {error && <div className="msg err">{error}</div>}

      {showForm && (
        <div className="card" style={{marginBottom:16}}>
          <div className="card-hd">{editUser ? `Edit — ${editUser.username}` : 'Create New User'}</div>
          <div className="card-bd">
            <div className="frow">
              <span className="flbl">Full Name</span>
              <input className="fi" style={{width:200,textAlign:'left'}} value={fullName}
                onChange={e => setFullName(e.target.value)} />
            </div>
            <div className="frow">
              <span className="flbl">Username</span>
              <input className="fi" style={{width:150,textAlign:'left'}} value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={!!editUser} />
            </div>
            <div className="frow">
              <span className="flbl">{editUser ? 'New Password (leave blank to keep)' : 'Password'}</span>
              <input className="fi" style={{width:180,textAlign:'left'}} type="password" value={password}
                onChange={e => setPassword(e.target.value)} />
            </div>
            <div className="frow">
              <span className="flbl">Role</span>
              <select className="si" value={role} onChange={e => setRole(e.target.value)}>
                <option value="Store">Store</option>
                <option value="HO">Head Office</option>
              </select>
            </div>
            {role === 'Store' && (
              <div className="frow">
                <span className="flbl">Store</span>
                <select className="si" value={storeCode} onChange={e => setStoreCode(e.target.value)}>
                  <option value="">— Select Store —</option>
                  {VCL_STORES.map(s => (
                    <option key={s.code} value={s.code}>{s.code} — {s.name}</option>
                  ))}
                </select>
              </div>
            )}
            {editUser && (
              <div className="frow">
                <span className="flbl">Active</span>
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
              </div>
            )}
            {formError && <div className="msg err" style={{marginTop:10}}>{formError}</div>}
            <div style={{display:'flex',gap:8,marginTop:14}}>
              <button className="btn pri" style={{width:'auto'}} onClick={save} disabled={saving}>
                {saving ? 'Saving...' : editUser ? 'Update User' : 'Create User'}
              </button>
              <button className="btn" style={{width:'auto'}} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="section-lbl">Head Office Users</div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Full Name</th><th>Username</th><th>Role</th>
              <th>Store</th><th className="r">Status</th><th className="r">Action</th>
            </tr>
          </thead>
          <tbody>
            {hoUsers.map(u => (
              <tr key={u.userId}>
                <td>{u.fullName}</td>
                <td style={{color:'var(--acc)'}}>{u.username}</td>
                <td><span className="badge info">HO</span></td>
                <td style={{color:'var(--txt2)'}}>—</td>
                <td className="r">
                  <span className={`badge ${u.isActive ? 'ok' : 'err'}`}>
                    {u.isActive ? '✓ Active' : '✗ Inactive'}
                  </span>
                </td>
                <td className="r">
                  <button className="btn" style={{width:'auto',padding:'3px 10px'}}
                    onClick={() => openEdit(u)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-lbl">Store Users</div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Full Name</th><th>Username</th><th>Store</th>
              <th className="r">Status</th><th className="r">Action</th>
            </tr>
          </thead>
          <tbody>
            {storeUsers.length === 0 ? (
              <tr><td colSpan={5} style={{color:'var(--txt2)',textAlign:'center',padding:12}}>
                No store users yet — create one using the button above
              </td></tr>
            ) : storeUsers.map(u => (
              <tr key={u.userId}>
                <td>{u.fullName}</td>
                <td style={{color:'var(--acc)'}}>{u.username}</td>
                <td>{u.storeCode} — {VCL_STORES.find(s => s.code === u.storeCode)?.name ?? ''}</td>
                <td className="r">
                  <span className={`badge ${u.isActive ? 'ok' : 'err'}`}>
                    {u.isActive ? '✓ Active' : '✗ Inactive'}
                  </span>
                </td>
                <td className="r">
                  <button className="btn" style={{width:'auto',padding:'3px 10px'}}
                    onClick={() => openEdit(u)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}