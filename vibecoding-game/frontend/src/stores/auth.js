import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * =============================================================================
 * 登录态 store（纯前端演示版）
 *
 * 项目当前没有后端，账号体系全部放在浏览器里：
 *   - DEMO_ACCOUNTS：内置演示账号（admin / 123456），写在代码里，永远可登录；
 *   - vc-accounts:v1：注册页新建的账号，存 localStorage，刷新后仍然存在。
 *
 * 登录 = 「把用户填的账号密码和这两张表比一下」，然后把结果存进 localStorage，
 * 让路由守卫能判断「这个人登录过没有」。
 *
 * 以后接后端时只需要改 login() / register() 内部：
 *   const res = await fetch('/api/login', ...)
 *   user.value = res.data
 *   persist()
 * 对外暴露的字段（user / isLoggedIn / displayName / avatarText / login / register / logout）
 * 保持不变，页面和路由守卫都不用动。
 *
 * 注意：这里没有任何加密或签名，密码是明文比对的，只适合本地演示；
 * 真实项目必须由后端校验与存储（密码要加盐哈希），前端最多只存一个短期 token。
 * =============================================================================
 */

/** 当前登录态在 localStorage 里的键名：带版本号，方便以后结构变化时做迁移或丢弃旧数据 */
const STORAGE_KEY = 'vc-auth:v1'

/** 注册账号表的键名；和登录态分开存，退出登录不会把注册过的账号一起清掉 */
const ACCOUNTS_KEY = 'vc-accounts:v1'

/**
 * 演示用账号表（截图里的提示文案就是这个账号）。
 * displayName 是顶部栏展示的名字，和登录名分开，方便以后接后端时返回昵称。
 */
const DEMO_ACCOUNTS = [
  { username: 'admin', password: '123456', displayName: '系统管理员', role: 'admin' }
]

/**
 * 把 localStorage 里读出来的一条记录整理成内部结构。
 * 缺关键字段的脏数据直接返回 null，由调用方过滤掉。
 */
function normalizeAccount(record) {
  if (!record || typeof record !== 'object') return null

  const username = typeof record.username === 'string' ? record.username.trim() : ''
  const password = typeof record.password === 'string' ? record.password : ''
  if (!username || !password) return null

  return {
    username,
    email: typeof record.email === 'string' ? record.email.trim() : '',
    phone: typeof record.phone === 'string' ? record.phone.trim() : '',
    password,
    displayName: username,
    role: 'user',
    createdAt: Number(record.createdAt) || Date.now()
  }
}

/**
 * 从 localStorage 还原登录态。
 * 任何异常（隐私模式禁用存储、JSON 坏掉、字段缺失）都按「未登录」处理，
 * 不能让一个坏值把整个应用卡在报错里。
 */
function restore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    // 只接受结构完整的记录，缺字段的旧数据直接丢弃
    if (!parsed || typeof parsed.username !== 'string' || !parsed.username.trim()) return null

    return {
      username: parsed.username,
      displayName: typeof parsed.displayName === 'string' ? parsed.displayName : parsed.username,
      role: typeof parsed.role === 'string' ? parsed.role : 'user',
      loginAt: Number(parsed.loginAt) || Date.now()
    }
  } catch (error) {
    console.warn('[auth] 读取登录态失败，按未登录处理：', error)
    return null
  }
}

/** 从 localStorage 还原「注册过的账号」；坏数据一律当作空列表 */
function restoreAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.map(normalizeAccount).filter(Boolean)
  } catch (error) {
    console.warn('[auth] 读取注册账号失败，按空列表处理：', error)
    return []
  }
}

export const useAuthStore = defineStore('auth', () => {
  /** 当前登录用户；null 表示未登录 */
  const user = ref(restore())

  /** 注册页新建的账号（内存 + localStorage 双写） */
  const accounts = ref(restoreAccounts())

  /** 路由守卫判断用 */
  const isLoggedIn = computed(() => Boolean(user.value?.username))

  /** 顶部栏展示的名字（没登录时给个空串，避免渲染 undefined） */
  const displayName = computed(() => user.value?.displayName || user.value?.username || '')

  /** 头像里的文字：取展示名第一个字，例如「系统管理员」→「系」 */
  const avatarText = computed(() => displayName.value.slice(0, 1) || '?')

  /** 写回 localStorage；失败只提示控制台，不影响本次会话的登录状态 */
  function persist() {
    try {
      if (user.value) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user.value))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (error) {
      console.warn('[auth] 保存登录态失败（本次会话仍可继续使用）：', error)
    }
  }

  /** 写回注册账号表；失败时内存里的账号本次会话仍可登录 */
  function persistAccounts() {
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts.value))
    } catch (error) {
      console.warn('[auth] 保存注册账号失败（本次会话仍可继续使用）：', error)
    }
  }

  /** 所有可用账号：内置演示账号 + 用户自己注册的账号 */
  function allAccounts() {
    return [...DEMO_ACCOUNTS, ...accounts.value]
  }

  /**
   * 登录校验。
   * @param {string} username 登录名
   * @param {string} password 密码
   * @returns {boolean} 是否登录成功（失败时由调用方决定怎么提示）
   */
  function login(username, password) {
    const name = String(username ?? '').trim()
    const pwd = String(password ?? '')

    // 用户名不区分大小写，省得用户敲成 Admin 就登不进去
    const account = allAccounts().find(
      (item) => item.username.toLowerCase() === name.toLowerCase() && item.password === pwd
    )
    if (!account) return false

    user.value = {
      username: account.username,
      displayName: account.displayName || account.username,
      role: account.role || 'user',
      loginAt: Date.now()
    }
    persist()
    return true
  }

  /**
   * 注册新账号。
   *
   * 只做「前端能做的」校验：字段是否为空、格式、是否和已有账号重复。
   * 返回结构统一成 { ok, field, message }，页面据此把错误挂到对应输入框下面：
   *   ok 为 true 时 field / message 都是空串。
   *
   * @param {{ username: string, email: string, phone: string, password: string }} payload
   * @returns {{ ok: boolean, field: string, message: string }}
   */
  function register(payload = {}) {
    const username = String(payload.username ?? '').trim()
    const email = String(payload.email ?? '').trim()
    const phone = String(payload.phone ?? '').trim()
    const password = String(payload.password ?? '')

    // 空值与格式兜底：正常情况下页面已经校验过，这里再守一层，防止别的入口绕过
    if (!username || !email || !phone || !password) {
      return { ok: false, field: 'form', message: '请把注册信息填写完整' }
    }

    const existing = allAccounts()

    // 用户名不区分大小写查重
    if (existing.some((item) => item.username.toLowerCase() === username.toLowerCase())) {
      return { ok: false, field: 'username', message: '该账号 ID 已被注册，换一个试试' }
    }

    // 邮箱、手机号也按「一个联系方式只能绑一个账号」处理
    if (existing.some((item) => item.email && item.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, field: 'email', message: '该邮箱已被注册' }
    }
    if (existing.some((item) => item.phone && item.phone === phone)) {
      return { ok: false, field: 'phone', message: '该手机号已被注册' }
    }

    accounts.value = [
      ...accounts.value,
      {
        username,
        email,
        phone,
        password,
        displayName: username,
        role: 'user',
        createdAt: Date.now()
      }
    ]
    persistAccounts()

    // 注册完成后不自动登录：需求是「回到登录界面进行登录」
    return { ok: true, field: '', message: '' }
  }

  /** 退出登录：清空内存状态和本地存储（注册过的账号保留） */
  function logout() {
    user.value = null
    persist()
  }

  return { user, accounts, isLoggedIn, displayName, avatarText, login, register, logout }
})
