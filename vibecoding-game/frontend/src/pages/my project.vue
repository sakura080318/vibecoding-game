<template>
  <div class="mp-page">
    <header class="mp-topbar">
      <div class="mp-topbar__lead">
        <router-link class="mp-brand" :to="{ name: 'work' }" aria-label="返回工作台">
          <span class="mp-brand__logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path
                d="M9.2 6.9a1 1 0 0 1 1.52-.86l7.1 4.6a1 1 0 0 1 0 1.72l-7.1 4.6A1 1 0 0 1 9.2 16.1V6.9Z"
              />
            </svg>
          </span>
          <span class="mp-brand__name">Vibe Coding</span>
          <span class="mp-brand__sub">游戏平台</span>
        </router-link>

        <span class="mp-topbar__slash" aria-hidden="true">/</span>
        <span class="mp-crumb">我的项目</span>
      </div>

      <nav class="mp-nav" aria-label="主导航">
        <router-link class="mp-nav__link" :to="{ name: 'work' }">
          <span>Workspace</span><em>工作台</em>
        </router-link>
        <router-link class="mp-nav__link" :to="{ name: 'projects' }" active-class="is-active">
          <span>My Projects</span><em>我的项目</em>
        </router-link>
      </nav>

      <div class="mp-topbar__tail">
        <div class="mp-user">
          <span class="mp-user__avatar" aria-hidden="true">{{ authStore.avatarText }}</span>
          <span class="mp-user__name">{{ authStore.displayName }}</span>
        </div>
        <button type="button" class="mp-logout" @click="confirmVisible = true">退出登录</button>
      </div>
    </header>

    <main class="mp-main">
      <header class="mp-head">
        <div class="mp-head__text">
          <h1 class="mp-title">My Projects <span>我的项目</span></h1>
          <p class="mp-subtitle">
            <span class="mp-subtitle__count">
              <strong>{{ projects.length }}</strong> 个项目
            </span>
            <template v-if="projects.length">
              <span class="mp-subtitle__dot" aria-hidden="true">·</span>
              <span>{{ templateSummary }}</span>
            </template>
            <template v-else>
              <span class="mp-subtitle__dot" aria-hidden="true">·</span>
              <span>在这里管理你所有的游戏项目</span>
            </template>
          </p>
        </div>

        <button type="button" class="mp-create" @click="goCreate">
          <el-icon><Plus /></el-icon>
          <span>New Project</span>
          <em>新项目</em>
        </button>
      </header>

      <div class="mp-toolbar">
        <!-- 搜索：过滤项目名 / 玩法描述 / 模板名 -->
        <label class="mp-search">
          <el-icon class="mp-search__icon"><Search /></el-icon>
          <input
            ref="searchInputRef"
            v-model="keyword"
            class="mp-search__input"
            type="search"
            placeholder="搜索项目..."
            autocomplete="off"
            aria-label="搜索项目"
          />
          <button
            v-if="keyword"
            type="button"
            class="mp-search__clear"
            aria-label="清空搜索"
            @click="clearKeyword"
          >
            <el-icon><Close /></el-icon>
          </button>
        </label>

        <div ref="sortSelectRef" class="mp-select" :class="{ 'is-open': isSortOpen }">
          <button
            type="button"
            class="mp-select__trigger"
            :aria-expanded="isSortOpen"
            aria-haspopup="listbox"
            @click="isSortOpen = !isSortOpen"
          >
            <span class="mp-select__label">{{ currentSort.label }}</span>
            <em class="mp-select__hint">{{ currentSort.hint }}</em>
            <el-icon class="mp-select__arrow"><ArrowDown /></el-icon>
          </button>

          <transition name="mp-pop">
            <ul v-if="isSortOpen" class="mp-select__panel" role="listbox" aria-label="选择排序方式">
              <li
                v-for="option in SORTS"
                :key="option.key"
                class="mp-select__option"
                :class="{ 'is-active': option.key === sortKey }"
                role="option"
                :aria-selected="option.key === sortKey"
                tabindex="0"
                @click="chooseSort(option.key)"
                @keyup.enter="chooseSort(option.key)"
                @keyup.space.prevent="chooseSort(option.key)"
              >
                <span class="mp-select__option-text">
                  <strong>{{ option.label }}</strong>
                  <em>{{ option.hint }}</em>
                </span>
                <el-icon v-if="option.key === sortKey" class="mp-select__check">
                  <Check />
                </el-icon>
              </li>
            </ul>
          </transition>
        </div>

        <button
          type="button"
          class="mp-tool"
          :title="sortAsc ? '当前升序，点击改为降序' : '当前降序，点击改为升序'"
          :aria-label="sortAsc ? '当前升序，点击改为降序' : '当前降序，点击改为升序'"
          @click="sortAsc = !sortAsc"
        >
          <el-icon>
            <component :is="sortAsc ? SortUp : SortDown" />
          </el-icon>
        </button>

        <div class="mp-segment" role="group" aria-label="切换视图">
          <button
            type="button"
            :class="{ 'is-active': view === 'grid' }"
            :aria-pressed="view === 'grid'"
            aria-label="网格视图"
            @click="view = 'grid'"
          >
            <el-icon><Grid /></el-icon>
          </button>
          <button
            type="button"
            :class="{ 'is-active': view === 'list' }"
            :aria-pressed="view === 'list'"
            aria-label="列表视图"
            @click="view = 'list'"
          >
            <el-icon><Menu /></el-icon>
          </button>
        </div>
      </div>

      <section v-if="!projects.length" class="mp-empty">
        <span class="mp-empty__icon" aria-hidden="true">
          <el-icon><FolderOpened /></el-icon>
        </span>
        <h2>还没有任何项目</h2>
        <p>回到工作台，选个模板开个项目；也可以直接点下面的「新建项目」。</p>
        <div class="mp-empty__actions">
          <button type="button" class="mp-create" @click="goCreate">
            <el-icon><Plus /></el-icon>
            <span>New Project</span>
            <em>新项目</em>
          </button>
          <router-link class="mp-ghost" :to="{ name: 'work' }">去工作台</router-link>
        </div>
      </section>

      <section v-else-if="!visibleProjects.length" class="mp-empty">
        <span class="mp-empty__icon" aria-hidden="true">
          <el-icon><Search /></el-icon>
        </span>
        <h2>没有匹配「{{ keyword.trim() }}」的项目</h2>
        <p>换个关键词试试，或者清空搜索看全部项目。</p>
        <div class="mp-empty__actions">
          <button type="button" class="mp-ghost" @click="clearKeyword">清空搜索</button>
        </div>
      </section>

      <template v-else-if="view === 'grid'">
        <ul class="mp-grid">
          <li v-for="project in visibleProjects" :key="project.id" class="mp-card">
            <button
              type="button"
              class="mp-card__hit"
              :aria-label="`打开项目 ${project.name}`"
              @click="openProject(project)"
            >
              <span class="mp-card__cover" :style="thumbStyle(project)">
                <span class="mp-card__badge">{{ project.templateLabel }}</span>
                <span class="mp-card__mark" aria-hidden="true">
                  <el-icon :size="24"><component :is="templateOf(project).icon" /></el-icon>
                </span>
                <span class="mp-card__open" aria-hidden="true">
                  打开项目
                  <el-icon><ArrowRight /></el-icon>
                </span>
              </span>

              <span class="mp-card__body">
                <span class="mp-card__name" :title="project.name">{{ project.name }}</span>
                <span class="mp-card__meta">
                  <span class="mp-card__date">
                    <el-icon><Calendar /></el-icon>
                    {{ formatDay(project.updatedAt) }}
                  </span>
                  <span class="mp-card__dot" aria-hidden="true">·</span>
                  <span class="mp-card__status">草稿 Draft</span>
                </span>
              </span>
            </button>
          </li>
        </ul>
      </template>

      <ul v-else class="mp-list">
        <li v-for="project in visibleProjects" :key="project.id" class="mp-row">
          <button
            type="button"
            class="mp-row__hit"
            :aria-label="`打开项目 ${project.name}`"
            @click="openProject(project)"
          >
            <span class="mp-row__cover" :style="thumbStyle(project)" aria-hidden="true">
              <el-icon><component :is="templateOf(project).icon" /></el-icon>
            </span>

            <span class="mp-row__text">
              <span class="mp-row__name" :title="project.name">{{ project.name }}</span>
              <span class="mp-row__desc">{{ project.desc || '还没有玩法描述，点开补一句吧' }}</span>
            </span>

            <span class="mp-row__badge">{{ project.templateLabel }}</span>
            <span class="mp-row__date">
              <el-icon><Calendar /></el-icon>
              {{ formatDay(project.updatedAt) }}
            </span>
            <span class="mp-row__status">草稿 Draft</span>
            <el-icon class="mp-row__chevron"><ArrowRight /></el-icon>
          </button>
        </li>
      </ul>
    </main>

    <transition name="mp-fade">
      <div v-if="confirmVisible" class="mp-modal-mask" @click.self="confirmVisible = false">
        <div class="mp-modal" role="alertdialog" aria-modal="true" aria-labelledby="mp-modal-title">
          <h3 id="mp-modal-title" class="mp-modal__title">退出登录？</h3>
          <p class="mp-modal__text">当前账号的项目会保留在这台设备上，随时可以回来继续。</p>
          <div class="mp-modal__actions">
            <button type="button" class="mp-ghost" @click="confirmVisible = false">取消</button>
            <button type="button" class="mp-ghost is-danger" @click="logout">退出登录</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  ArrowDown,
  ArrowRight,
  Calendar,
  Check,
  Close,
  FolderOpened,
  Grid,
  Menu,
  Plus,
  Search,
  SortDown,
  SortUp
} from '@element-plus/icons-vue'
import {
  PROJECTS_STORAGE_KEY,
  TEMPLATES,
  formatDay,
  loadProjects,
  templateOf,
  thumbStyle
} from '@/lib/projects'

const SORTS = [
  { key: 'updated', label: '最近更新', hint: 'Last Updated' },
  { key: 'created', label: '创建时间', hint: 'Created' },
  { key: 'name', label: '项目名称', hint: 'Name' }
]

const PREFS_KEY = 'vc-my-projects:prefs:v1'

const router = useRouter()
const authStore = useAuthStore()

const projects = ref([])
const keyword = ref('')

const sortKey = ref('updated')
const sortAsc = ref(false)

const view = ref('grid')

const isSortOpen = ref(false)

const confirmVisible = ref(false)

const searchInputRef = ref(null)
const sortSelectRef = ref(null)

const currentSort = computed(() => SORTS.find((item) => item.key === sortKey.value) ?? SORTS[0])

const sortedProjects = computed(() => {
  const direction = sortAsc.value ? 1 : -1
  return [...projects.value].sort((a, b) => {
    if (sortKey.value === 'name') {
      return String(a.name).localeCompare(String(b.name), 'zh-Hans-CN') * direction
    }
    const field = sortKey.value === 'created' ? 'createdAt' : 'updatedAt'
    return (Number(a[field]) - Number(b[field])) * direction
  })
})

const visibleProjects = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return sortedProjects.value
  return sortedProjects.value.filter((project) => {
    const haystack = `${project.name} ${project.desc ?? ''} ${templateOf(project).label}`
    return haystack.toLowerCase().includes(kw)
  })
})

const templateSummary = computed(() =>
  TEMPLATES.map(
    (template) =>
      `${template.label} ${projects.value.filter((p) => p.template === template.key).length}`
  ).join(' · ')
)

function restorePrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return

    const parsed = JSON.parse(raw)
    if (parsed?.view === 'grid' || parsed?.view === 'list') view.value = parsed.view
    if (SORTS.some((item) => item.key === parsed?.sortKey)) sortKey.value = parsed.sortKey
    if (typeof parsed?.sortAsc === 'boolean') sortAsc.value = parsed.sortAsc
  } catch (error) {
    console.warn('[my-projects] 读取视图偏好失败，使用默认值：', error)
  }
}

function persistPrefs() {
  try {
    localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ view: view.value, sortKey: sortKey.value, sortAsc: sortAsc.value })
    )
  } catch (error) {
    console.warn('[my-projects] 保存视图偏好失败：', error)
  }
}

watch([view, sortKey, sortAsc], persistPrefs)

function chooseSort(key) {
  sortKey.value = key
  sortAsc.value = key === 'name'
  isSortOpen.value = false
}

function clearKeyword() {
  keyword.value = ''
  searchInputRef.value?.focus()
}

function goCreate() {
  router.push({ name: 'work', query: { new: '1' } })
}

function openProject(project) {
  router.push({ name: 'work', query: { open: project.id } })
}

function logout() {
  confirmVisible.value = false
  authStore.logout()
  router.replace({ name: 'login' })
}

function handleGlobalKeydown(event) {
  const { key } = event
  const isTyping =
    event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(event.target.tagName)

  if (key === 'Escape') {
    if (isSortOpen.value) {
      isSortOpen.value = false
      return
    }
    if (confirmVisible.value) {
      confirmVisible.value = false
      return
    }
    if (keyword.value && isTyping) clearKeyword()
    return
  }

  if ((event.ctrlKey || event.metaKey) && key.toLowerCase() === 'k') {
    event.preventDefault()
    searchInputRef.value?.focus()
    return
  }
  if (key === '/' && !isTyping && !event.ctrlKey && !event.metaKey) {
    event.preventDefault()
    searchInputRef.value?.focus()
  }
}

function handleGlobalPointerDown(event) {
  if (!isSortOpen.value) return
  const root = sortSelectRef.value
  if (root && event.target instanceof Node && !root.contains(event.target)) {
    isSortOpen.value = false
  }
}

function handleStorage(event) {
  if (event.key && event.key !== PROJECTS_STORAGE_KEY) return
  projects.value = loadProjects()
}

onMounted(() => {
  restorePrefs()
  projects.value = loadProjects()

  document.addEventListener('keydown', handleGlobalKeydown)
  document.addEventListener('pointerdown', handleGlobalPointerDown)
  window.addEventListener('storage', handleStorage)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
  document.removeEventListener('pointerdown', handleGlobalPointerDown)
  window.removeEventListener('storage', handleStorage)
})
</script>

<style scoped>
.mp-page {
  --mp-bg: #0a0c10;
  --mp-panel: #101419;
  --mp-border: #1e222a;
  --mp-border-strong: #2b3140;
  --mp-text: #eef2f8;
  --mp-text-2: #98a3b5;
  --mp-text-3: #5f6a7b;
  --mp-accent: #3b82f6;
  --mp-accent-bright: #60a5fa;
  --mp-accent-line: rgba(96, 165, 250, 0.4);
  --mp-danger: #ef4444;
  --mp-radius-sm: 8px;
  --mp-radius: 12px;
  --mp-radius-lg: 16px;

  display: flex;
  flex-direction: column;
  min-height: 100vh;
  color: var(--mp-text);
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background:
    radial-gradient(110% 50% at 50% 0%, rgba(59, 130, 246, 0.07), transparent 62%), var(--mp-bg);
  -webkit-font-smoothing: antialiased;
}

.mp-page ::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
.mp-page ::-webkit-scrollbar-thumb {
  background: #242a34;
  border: 3px solid transparent;
  background-clip: content-box;
  border-radius: 8px;
}
.mp-page ::-webkit-scrollbar-thumb:hover {
  background: #333c4a;
  background-clip: content-box;
}

.mp-topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 24px;
  height: 66px;
  padding: 0 30px;
  border-bottom: 1px solid #171b22;
  background: rgba(9, 11, 15, 0.9);
  backdrop-filter: blur(14px);
}

.mp-topbar__lead {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.mp-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: inherit;
  border-radius: 10px;
  transition: opacity 0.18s ease;
}
.mp-brand:hover {
  opacity: 0.86;
}
.mp-brand__logo {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  color: #fff;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
}
.mp-brand__logo svg {
  display: block;
  width: 17px;
  height: 17px;
  fill: currentColor;
}
.mp-brand__name {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: #f3f7fd;
  white-space: nowrap;
}
.mp-brand__sub {
  font-size: 15px;
  font-weight: 600;
  color: #8b96a8;
  white-space: nowrap;
}
.mp-topbar__slash {
  font-size: 15px;
  color: #373e49;
}
.mp-crumb {
  font-size: 14.5px;
  color: #cfd8e6;
  white-space: nowrap;
}

.mp-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}
.mp-nav__link {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 9px;
  border: 1px solid transparent;
  color: #96a1b3;
  font-size: 14px;
  transition:
    color 0.16s ease,
    background 0.16s ease,
    border-color 0.16s ease;
}
.mp-nav__link em {
  font-style: normal;
  font-size: 12.5px;
  color: #6e798a;
}
.mp-nav__link:hover {
  color: #e3ebf8;
  background: #12161d;
}
.mp-nav__link.is-active {
  color: #f0f5ff;
  border-color: #242a34;
  background: rgba(255, 255, 255, 0.05);
}
.mp-nav__link.is-active em {
  color: #98a3b5;
}

.mp-topbar__tail {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-left: auto;
}
.mp-user {
  display: flex;
  align-items: center;
  gap: 9px;
}
.mp-user__avatar {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 12.5px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #5b8cff, #6366f1);
}
.mp-user__name {
  font-size: 14px;
  color: #c9d2e1;
  white-space: nowrap;
}
.mp-logout {
  padding: 7px 10px;
  border: 0;
  border-radius: var(--mp-radius-sm);
  background: transparent;
  color: #8d97a8;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition:
    color 0.18s ease,
    background 0.18s ease;
}
.mp-logout:hover {
  color: #e8eefc;
  background: #151920;
}

.mp-main {
  flex: 1;
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding: 46px 32px 88px;
}

.mp-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}
.mp-title {
  font-size: 38px;
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.6px;
  color: #f8fafe;
}
.mp-title span {
  color: #f2f6fd;
}
.mp-subtitle {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  font-size: 14px;
  color: #8b95a7;
}
.mp-subtitle__count strong {
  font-size: 15px;
  font-weight: 600;
  color: #d3dcea;
}
.mp-subtitle__dot {
  color: #3d4552;
}

.mp-create {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 44px;
  padding: 0 20px;
  border: 0;
  border-radius: 10px;
  background: linear-gradient(180deg, #3d86f7, #2f6df0);
  color: #fff;
  font-size: 14.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(47, 109, 240, 0.32);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    filter 0.18s ease;
}
.mp-create em {
  font-style: normal;
  font-size: 12.5px;
  font-weight: 500;
  opacity: 0.78;
}
.mp-create:hover {
  transform: translateY(-1px);
  filter: brightness(1.07);
  box-shadow: 0 12px 30px rgba(47, 109, 240, 0.44);
}
.mp-create:active {
  transform: translateY(0);
  filter: brightness(0.98);
}

.mp-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 34px;
}

.mp-search {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  max-width: 540px;
  height: 46px;
  padding: 0 14px;
  border-radius: 11px;
  border: 1px solid #242a34;
  background: #0e1218;
  color: #5f6a7b;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}
.mp-search:focus-within {
  border-color: var(--mp-accent-line);
  background: #10151d;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.mp-search__icon {
  font-size: 15px;
  flex: none;
}
.mp-search__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  background: transparent;
  color: var(--mp-text);
  font-size: 14.5px;
  font-family: inherit;
  outline: none;
}
.mp-search__input::placeholder {
  color: #5f6875;
}
.mp-search__input::-webkit-search-cancel-button {
  display: none;
}
.mp-search__clear {
  display: grid;
  place-items: center;
  padding: 2px;
  border: 0;
  background: transparent;
  color: #6b7584;
  cursor: pointer;
  transition: color 0.16s ease;
}
.mp-search__clear:hover {
  color: #dfe6f2;
}

.mp-select {
  position: relative;
  flex: none;
}
.mp-select__trigger {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 224px;
  height: 46px;
  padding: 0 14px;
  border-radius: 11px;
  border: 1px solid #242a34;
  background: #0e1218;
  color: #d7dfeb;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}
.mp-select__trigger:hover {
  border-color: #333c4a;
  background: #12161d;
}
.mp-select.is-open .mp-select__trigger {
  border-color: var(--mp-accent-line);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.mp-select__label {
  color: #dbe3ef;
}
.mp-select__hint {
  font-style: normal;
  font-size: 12.5px;
  color: #6b7584;
}
.mp-select__arrow {
  margin-left: auto;
  font-size: 12px;
  color: #6f7a8b;
  transition: transform 0.2s ease;
}
.mp-select.is-open .mp-select__arrow {
  transform: rotate(180deg);
}
.mp-select__panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 30;
  width: 220px;
  padding: 6px;
  border-radius: var(--mp-radius);
  border: 1px solid #262b34;
  background: #11151b;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
}
.mp-select__option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: var(--mp-radius-sm);
  cursor: pointer;
  transition: background 0.14s ease;
}
.mp-select__option:hover {
  background: #171c24;
}
.mp-select__option.is-active {
  background: rgba(59, 130, 246, 0.12);
}
.mp-select__option-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.mp-select__option-text strong {
  font-size: 13.5px;
  font-weight: 600;
  color: #e2e9f5;
}
.mp-select__option-text em {
  font-style: normal;
  font-size: 11.5px;
  color: #6b7584;
}
.mp-select__check {
  margin-left: auto;
  font-size: 14px;
  color: var(--mp-accent-bright);
}

.mp-tool {
  display: grid;
  flex: none;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 11px;
  border: 1px solid #242a34;
  background: #0e1218;
  color: #9aa6b8;
  font-size: 17px;
  font-family: inherit;
  cursor: pointer;
  transition:
    color 0.16s ease,
    border-color 0.16s ease,
    background 0.16s ease;
}
.mp-tool:hover {
  color: #e8effb;
  border-color: #333c4a;
  background: #12161d;
}

.mp-segment {
  display: flex;
  flex: none;
  gap: 2px;
  padding: 4px;
  border-radius: 11px;
  border: 1px solid #242a34;
  background: #0e1218;
}
.mp-segment button {
  display: grid;
  place-items: center;
  width: 40px;
  height: 38px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #7c8798;
  font-size: 16px;
  font-family: inherit;
  cursor: pointer;
  transition:
    color 0.16s ease,
    background 0.16s ease,
    box-shadow 0.16s ease;
}
.mp-segment button:hover {
  color: #dbe4f2;
}
.mp-segment button.is-active {
  color: #eaf1fb;
  background: #1b2029;
  box-shadow: inset 0 0 0 1px #2b3140;
}

.mp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 26px 22px;
  margin-top: 30px;
  list-style: none;
}
.mp-card {
  min-width: 0;
}

.mp-card__hit {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  font-family: inherit;
  color: inherit;
  cursor: pointer;
  border-radius: 15px;
}
.mp-card__hit:focus-visible {
  outline: 2px solid rgba(96, 165, 250, 0.6);
  outline-offset: 4px;
}

.mp-card__cover {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: 14px;
  border: 1px solid #222834;
  overflow: hidden;
  background: linear-gradient(
    var(--thumb-angle, 130deg),
    var(--thumb-from, #6366f1),
    var(--thumb-to, #8b5cf6)
  );
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.34);
  transition:
    transform 0.22s ease,
    border-color 0.22s ease,
    box-shadow 0.22s ease;
}
.mp-card__cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(6, 8, 12, 0.34), rgba(6, 8, 12, 0.62)),
    radial-gradient(120% 100% at 20% 0%, rgba(255, 255, 255, 0.22), transparent 58%);
  pointer-events: none;
}
.mp-card__hit:hover .mp-card__cover,
.mp-card__hit:focus-visible .mp-card__cover {
  transform: translateY(-3px);
  border-color: #3a4456;
  box-shadow: 0 20px 38px rgba(0, 0, 0, 0.5);
}

.mp-card__badge {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(9, 12, 17, 0.55);
  backdrop-filter: blur(6px);
  color: #eaf2ff;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.mp-card__mark {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  transform: translate(-50%, -50%);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(9, 12, 17, 0.32);
  backdrop-filter: blur(4px);
  color: #f4f8ff;
}

.mp-card__open {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(9, 12, 17, 0.55);
  backdrop-filter: blur(6px);
  color: #e9f1ff;
  font-size: 11.5px;
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.mp-card__hit:hover .mp-card__open,
.mp-card__hit:focus-visible .mp-card__open {
  opacity: 1;
  transform: none;
}

.mp-card__body {
  display: block;
  padding: 13px 2px 0;
}
.mp-card__name {
  display: block;
  font-size: 15.5px;
  font-weight: 600;
  color: #eef3fb;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mp-card__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 7px;
  font-size: 12.5px;
  color: #78839a;
}
.mp-card__date {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.mp-card__date .el-icon {
  font-size: 12.5px;
}
.mp-card__dot {
  color: #3d4552;
}
.mp-card__status {
  color: #e0a35c;
  font-weight: 500;
}

.mp-list {
  margin-top: 26px;
  border-top: 1px solid #1a1f27;
  list-style: none;
}
.mp-row {
  border-bottom: 1px solid #1a1f27;
}
.mp-row__hit {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 14px 12px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  text-align: left;
  font-family: inherit;
  color: inherit;
  cursor: pointer;
  transition: background 0.16s ease;
}
.mp-row__hit:hover {
  background: #0f131a;
}
.mp-row__hit:focus-visible {
  outline: 2px solid rgba(96, 165, 250, 0.6);
  outline-offset: -2px;
}

.mp-row__cover {
  position: relative;
  display: grid;
  flex: 0 0 104px;
  place-items: center;
  width: 104px;
  aspect-ratio: 16 / 10;
  border-radius: 10px;
  border: 1px solid #232a35;
  overflow: hidden;
  background: linear-gradient(
    var(--thumb-angle, 130deg),
    var(--thumb-from, #6366f1),
    var(--thumb-to, #8b5cf6)
  );
  color: #f4f8ff;
}
.mp-row__cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(6, 8, 12, 0.3), rgba(6, 8, 12, 0.56));
  pointer-events: none;
}
.mp-row__cover .el-icon {
  position: relative;
  z-index: 2;
  font-size: 18px;
  opacity: 0.92;
}

.mp-row__text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.mp-row__name {
  font-size: 14.5px;
  font-weight: 600;
  color: #eaf0fa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mp-row__desc {
  font-size: 12.5px;
  color: #6f7a8b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mp-row__badge {
  flex: none;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid #262d38;
  background: #10151c;
  color: #9fb3ce;
  font-size: 11px;
}
.mp-row__date {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: none;
  width: 108px;
  font-size: 12.5px;
  color: #78839a;
}
.mp-row__date .el-icon {
  font-size: 12.5px;
}
.mp-row__status {
  flex: none;
  width: 78px;
  font-size: 12.5px;
  color: #e0a35c;
}
.mp-row__chevron {
  flex: none;
  font-size: 14px;
  color: #4d5766;
  transition:
    color 0.16s ease,
    transform 0.16s ease;
}
.mp-row__hit:hover .mp-row__chevron {
  color: #cfd8e6;
  transform: translateX(2px);
}

.mp-empty {
  margin-top: 42px;
  padding: 62px 24px;
  border: 1px dashed #232a34;
  border-radius: 18px;
  background:
    radial-gradient(90% 120% at 50% 0%, rgba(59, 130, 246, 0.06), transparent 65%), #0d1117;
  text-align: center;
}
.mp-empty__icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  margin: 0 auto 18px;
  border-radius: 16px;
  border: 1px solid #263041;
  background: #111823;
  color: #8fb6ff;
  font-size: 23px;
}
.mp-empty h2 {
  font-size: 17px;
  font-weight: 600;
  color: #e8eefa;
}
.mp-empty p {
  max-width: 420px;
  margin: 9px auto 0;
  font-size: 13.5px;
  line-height: 1.7;
  color: #7c8798;
}
.mp-empty__actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 24px;
}

.mp-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 44px;
  padding: 0 18px;
  border-radius: 10px;
  border: 1px solid #2a313d;
  background: #12161d;
  color: #c2cbda;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition:
    background 0.16s ease,
    color 0.16s ease,
    border-color 0.16s ease;
}
.mp-ghost:hover {
  background: #161b23;
  border-color: #333c4a;
  color: #eaf1fb;
}
.mp-ghost.is-danger {
  border-color: transparent;
  background: linear-gradient(180deg, #f0605f, #e03d3d);
  color: #fff;
  box-shadow: 0 8px 20px rgba(224, 61, 61, 0.26);
}
.mp-ghost.is-danger:hover {
  filter: brightness(1.06);
  color: #fff;
}

.mp-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(4, 6, 10, 0.66);
  backdrop-filter: blur(4px);
}
.mp-modal {
  width: min(400px, 100%);
  padding: 24px;
  border-radius: var(--mp-radius-lg);
  border: 1px solid #262b34;
  background: linear-gradient(180deg, #12161d, #0d1015);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
}
.mp-modal__title {
  font-size: 16.5px;
  font-weight: 600;
  color: #f2f6fc;
}
.mp-modal__text {
  margin-top: 10px;
  font-size: 13.5px;
  line-height: 1.7;
  color: #8b95a7;
}
.mp-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}
.mp-modal__actions .mp-ghost {
  height: 40px;
}

.mp-fade-enter-active,
.mp-fade-leave-active {
  transition: opacity 0.2s ease;
}
.mp-fade-enter-from,
.mp-fade-leave-to {
  opacity: 0;
}

.mp-pop-enter-active,
.mp-pop-leave-active {
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}
.mp-pop-enter-from,
.mp-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

@media (max-width: 1180px) {
  .mp-main {
    padding: 38px 26px 72px;
  }
  .mp-title {
    font-size: 32px;
  }
  .mp-topbar {
    padding: 0 22px;
  }
}

@media (max-width: 980px) {
  .mp-brand__sub,
  .mp-crumb,
  .mp-topbar__slash,
  .mp-user__name {
    display: none;
  }
  .mp-topbar {
    gap: 14px;
  }
  .mp-nav__link {
    padding: 8px 10px;
  }
}

@media (max-width: 760px) {
  .mp-nav {
    display: none;
  }
  .mp-main {
    padding: 30px 16px 56px;
  }
  .mp-toolbar {
    flex-wrap: wrap;
  }
  .mp-search {
    flex: 1 1 100%;
    max-width: none;
  }
  .mp-select {
    flex: 1;
    min-width: 0;
  }
  .mp-select__trigger {
    width: 100%;
    min-width: 0;
  }
  .mp-title {
    font-size: 27px;
  }
  .mp-head {
    flex-direction: column;
    align-items: stretch;
  }
  .mp-head .mp-create {
    align-self: flex-start;
  }
  .mp-create {
    height: 42px;
  }
  .mp-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 22px 16px;
  }
  .mp-row__badge,
  .mp-row__status {
    display: none;
  }
  .mp-row__date {
    width: auto;
  }
  .mp-row__desc {
    display: none;
  }
  .mp-row__cover {
    flex-basis: 84px;
    width: 84px;
  }
}

@media (max-width: 520px) {
  .mp-grid {
    grid-template-columns: 1fr;
  }
  .mp-row__date {
    display: none;
  }
  .mp-select__hint {
    display: none;
  }
  .mp-select__trigger {
    justify-content: space-between;
  }
}
</style>
