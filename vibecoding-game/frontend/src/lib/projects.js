/**
 * =============================================================================
 * projects.js —— 游戏项目的数据层（工作台 / 我的项目两个页面共用）
 *
 * 为什么要单独抽出来：
 *   work.vue（工作台）和 my project.vue（我的项目）读写的是同一份项目数据。
 *   如果两个页面各写一套「模板配置 + localStorage 读写 + 时间格式化」，
 *   以后改字段（比如加封面图、加状态）就得改两处，很容易漏。
 *   所以这里集中放：模板元信息、项目持久化、展示用的格式化函数。
 *
 * 当前没有后端，数据存在 localStorage：
 *   vc-game-projects:v1 -> 项目数组
 *
 * 以后接接口时只需要替换 loadProjects / saveProjects 两个函数，
 * 页面里的逻辑（筛选、排序、渲染）都不用动。
 * =============================================================================
 */
import { Box, VideoPlay } from '@element-plus/icons-vue'

/** 项目列表在 localStorage 里的键名；带版本号，方便以后字段升级时做迁移 */
export const PROJECTS_STORAGE_KEY = 'vc-game-projects:v1'

/**
 * 模板元信息：key 用于数据存储，label 用于界面展示，
 * hint/desc 是给用户看的说明，tint 是封面渐变色，icon 是 Element Plus 图标组件。
 */
export const TEMPLATES = [
  {
    key: 'web2d',
    label: 'Web 2D',
    hint: 'Canvas 2D · 轻量休闲玩法',
    desc: '用 Canvas 2D 渲染，适合平台跳跃、贪吃蛇、飞机大战这类上手即玩的轻量玩法。',
    icon: VideoPlay,
    tint: ['#6366f1', '#8b5cf6']
  },
  {
    key: 'web3d',
    label: 'Web 3D',
    hint: 'Three.js · 立体场景',
    desc: '用 Three.js 搭建立体场景，适合第一人称漫游、3D 弹球、跑酷这类有空间感的玩法。',
    icon: Box,
    tint: ['#2563eb', '#22d3ee']
  }
]

/** 按 key 找模板，找不到时回退到第一个，保证界面永远有兜底值 */
export function findTemplate(key) {
  return TEMPLATES.find((template) => template.key === key) ?? TEMPLATES[0]
}

/** 取项目对应的模板对象 */
export function templateOf(project) {
  return findTemplate(project?.template)
}

/** 侧栏小方块 / 列表缩略图使用的渐变背景 */
export function gradientOf(project) {
  const template = templateOf(project)
  return `linear-gradient(135deg, ${template.tint[0]}, ${template.tint[1]})`
}

/**
 * 封面样式：把模板渐变色和「由 id 派生的角度」写成 CSS 变量，
 * 这样每张卡片的角度略有不同，网格看起来不会太死板。
 */
export function thumbStyle(project) {
  const template = templateOf(project)
  const hash = [...String(project?.id ?? '')].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return {
    '--thumb-from': template.tint[0],
    '--thumb-to': template.tint[1],
    '--thumb-angle': `${110 + (hash % 40)}deg`
  }
}

const pad = (value) => String(value).padStart(2, '0')

/** 绝对时间：2026-10-18 21:28 */
export function formatDate(timestamp) {
  const date = new Date(Number(timestamp) || Date.now())
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
}

/** 只要日期：2026/10/18（「我的项目」卡片下方的样式） */
export function formatDay(timestamp) {
  const date = new Date(Number(timestamp) || Date.now())
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`
}

/**
 * 相对时间：刚刚 / 12 分钟前 / 3 小时前 / 昨天 / 5 天前，更久则退回绝对日期。
 * reference 由调用方传入（页面里通常是每分钟刷新一次的 now），
 * 这样定时器一刷新，所有相对时间会跟着重算。
 */
export function formatRelative(timestamp, reference = Date.now()) {
  const diff = reference - Number(timestamp || 0)
  if (!Number.isFinite(diff) || diff < 0) return formatDate(timestamp)

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 2 * day) return '昨天'
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`
  return formatDate(timestamp)
}

/**
 * 读取项目列表，并过滤 / 补全脏数据：
 * 字段缺失的老数据补默认值，模板已经不存在的记录直接丢弃，保证渲染时一定有值。
 */
export function loadProjects() {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.id === 'string' &&
          typeof item.name === 'string' &&
          TEMPLATES.some((template) => template.key === item.template)
      )
      .map((item) => {
        const timestamp = Date.now()
        return {
          desc: '',
          createdAt: timestamp,
          updatedAt: timestamp,
          ...item,
          // 模板名以当前配置为准，避免旧数据里存了已改名的 label
          templateLabel: templateOf(item).label
        }
      })
  } catch (error) {
    console.warn('[projects] 读取本地项目失败，按空列表处理：', error)
    return []
  }
}

/**
 * 写回 localStorage。
 * 隐私模式 / 超额等异常只提示控制台，不影响页面继续用（内存里的数据仍然有效）。
 * @returns {boolean} 是否写入成功
 */
export function saveProjects(projects) {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects))
    return true
  } catch (error) {
    console.warn('[projects] 项目列表写入 localStorage 失败：', error)
    return false
  }
}
