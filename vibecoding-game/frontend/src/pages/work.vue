<template>
  <div class="vc-workbench">
    <!-- ============================ 顶部导航栏 ============================ -->
    <header class="vc-topbar">
      <div class="vc-brand">
        <span class="vc-brand__logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path
              d="M9.2 6.9a1 1 0 0 1 1.52-.86l7.1 4.6a1 1 0 0 1 0 1.72l-7.1 4.6A1 1 0 0 1 9.2 16.1V6.9Z"
            />
          </svg>
        </span>
        <span class="vc-brand__name">Vibe Coding</span>
        <span class="vc-brand__sub">游戏平台</span>
      </div>

      <div class="vc-topbar__right">
        <label class="vc-search">
          <el-icon class="vc-search__icon"><Search /></el-icon>
          <input
            ref="searchInputRef"
            v-model="keyword"
            class="vc-search__input"
            type="search"
            placeholder="搜索项目"
            autocomplete="off"
            aria-label="搜索项目"
          />

          <button
            v-if="keyword"
            type="button"
            class="vc-search__clear"
            aria-label="清空搜索"
            @click="clearSearch"
          >
            <el-icon><Close /></el-icon>
          </button>
        </label>

        <div class="vc-user">
          <span class="vc-user__avatar" aria-hidden="true">{{ authStore.avatarText }}</span>
          <span class="vc-user__name">{{ authStore.displayName }}</span>
        </div>

        <button type="button" class="vc-topbar__logout" @click="askLogout">退出登录</button>
      </div>
    </header>

    <!-- ==================== 主体：左侧我的项目栏 + 右侧工作区 ==================== -->
    <div class="vc-body">
      <aside class="vc-sidebar">
        <button type="button" class="vc-sidebar__create" @click="focusComposer">
          <el-icon><Plus /></el-icon>
          <span>新建项目</span>
        </button>

        <button
          type="button"
          class="vc-sidebar__heading"
          title="打开「我的项目」查看全部项目"
          @click="goProjects"
        >
          <span class="vc-sidebar__heading-name">我的项目</span>
          <span class="vc-sidebar__heading-side">
            <em v-if="projects.length">{{ projects.length }}</em>
            <el-icon class="vc-sidebar__heading-arrow"><ArrowRight /></el-icon>
          </span>
        </button>

        <ul v-if="sidebarProjects.length" class="vc-history">
          <li v-for="project in sidebarProjects" :key="project.id">
            <button type="button" class="vc-history__item" @click="openProject(project.id)">
              <span class="vc-history__dot" :style="{ background: gradientOf(project) }" />
              <span class="vc-history__text">
                <strong>{{ project.name }}</strong>
                <em>{{ project.templateLabel }} · {{ formatRelative(project.updatedAt) }}</em>
              </span>
            </button>
          </li>
        </ul>
        <p v-else class="vc-sidebar__empty">还没有项目</p>
      </aside>

      <main class="vc-main">
        <section class="vc-hero">
          <h1 class="vc-hero__title">Vibe Coding <span>游戏平台</span></h1>
        </section>

        <!-- ===================== 新建项目卡片 ===================== -->
        <section class="vc-composer" :class="{ 'is-focused': isComposerFocused }">
          <label class="vc-composer__field">
            <input
              ref="nameInputRef"
              v-model="projectName"
              class="vc-composer__input"
              type="text"
              maxlength="40"
              placeholder="给新项目起个名字，留空就用默认名"
              autocomplete="off"
              aria-label="新项目名称"
              @focus="isComposerFocused = true"
              @blur="isComposerFocused = false"
              @keyup.enter="createProject"
            />
            <span v-if="projectName" class="vc-composer__counter">{{ projectName.length }}/40</span>
          </label>

          <div class="vc-composer__footer">
            <div ref="templateSelectRef" class="vc-select" :class="{ 'is-open': isTemplateOpen }">
              <button
                type="button"
                class="vc-select__trigger"
                :aria-expanded="isTemplateOpen"
                aria-haspopup="listbox"
                @click="toggleTemplate"
              >
                <el-icon class="vc-select__icon">
                  <component :is="currentTemplate.icon" />
                </el-icon>
                <span>{{ currentTemplate.label }}</span>
                <el-icon class="vc-select__arrow"><ArrowDown /></el-icon>
              </button>

              <transition name="vc-pop">
                <ul
                  v-if="isTemplateOpen"
                  class="vc-select__panel"
                  role="listbox"
                  aria-label="选择开发模板"
                >
                  <li
                    v-for="template in TEMPLATES"
                    :key="template.key"
                    class="vc-select__option"
                    :class="{ 'is-active': template.key === templateKey }"
                    role="option"
                    :aria-selected="template.key === templateKey"
                    tabindex="0"
                    @click="chooseTemplate(template.key)"
                    @keyup.enter="chooseTemplate(template.key)"
                    @keyup.space.prevent="chooseTemplate(template.key)"
                  >
                    <span
                      class="vc-select__swatch"
                      :style="{
                        background: `linear-gradient(135deg, ${template.tint[0]}, ${template.tint[1]})`
                      }"
                    />
                    <span class="vc-select__option-text">
                      <strong>{{ template.label }}</strong>
                      <em>{{ template.hint }}</em>
                    </span>
                    <el-icon v-if="template.key === templateKey" class="vc-select__check">
                      <Check />
                    </el-icon>
                  </li>
                </ul>
              </transition>
            </div>

            <button type="button" class="vc-primary" @click="createProject">新建项目</button>
          </div>
        </section>

        <nav class="vc-filters" aria-label="按模板筛选项目">
          <button
            v-for="filter in FILTERS"
            :key="filter.key"
            type="button"
            class="vc-chip"
            :class="{ 'is-active': activeFilter === filter.key }"
            :aria-pressed="activeFilter === filter.key"
            @click="activeFilter = filter.key"
          >
            {{ filter.label }}
            <em v-if="countOf(filter.key)">{{ countOf(filter.key) }}</em>
          </button>
        </nav>

        <p v-if="!projects.length" class="vc-empty">
          还没有项目。在上面填个名字，点「新建项目」开始。
          <button type="button" class="vc-empty__demo" @click="loadDemoProjects">
            载入示例项目
          </button>
        </p>
        <p v-else-if="!visibleProjects.length" class="vc-empty">
          没有匹配的项目，换个关键词，或者切回「全部」看看。
        </p>
        <ul v-else class="vc-grid">
          <li v-for="project in visibleProjects" :key="project.id" class="vc-card">
            <button
              type="button"
              class="vc-card__thumb"
              :style="thumbStyle(project)"
              :aria-label="`打开项目 ${project.name}`"
              @click="openProject(project.id)"
            >
              <span class="vc-card__badge">{{ project.templateLabel }}</span>
              <span class="vc-card__lines" aria-hidden="true"> <i /><i /><i /> </span>
              <span class="vc-card__glyph" aria-hidden="true">
                <el-icon :size="20"><component :is="templateOf(project).icon" /></el-icon>
              </span>
            </button>

            <div class="vc-card__body">
              <h3 class="vc-card__name" :title="project.name">{{ project.name }}</h3>
              <p class="vc-card__meta">
                <el-icon><Clock /></el-icon>
                {{ formatRelative(project.updatedAt) }}
              </p>
            </div>

            <div class="vc-card__actions">
              <button
                type="button"
                class="vc-icon-btn"
                title="打开 / 重命名"
                :aria-label="`打开或重命名 ${project.name}`"
                @click="openProject(project.id)"
              >
                <el-icon><EditPen /></el-icon>
              </button>
              <button
                type="button"
                class="vc-icon-btn is-danger"
                title="删除项目"
                :aria-label="`删除 ${project.name}`"
                @click="askDelete(project)"
              >
                <el-icon><Delete /></el-icon>
              </button>
            </div>
          </li>
        </ul>
      </main>
    </div>

    <transition name="vc-fade">
      <div v-if="activeProject" class="vc-scrim" @click="closeProject" />
    </transition>

    <transition name="vc-drawer">
      <section
        v-if="activeProject"
        class="vc-drawer"
        role="dialog"
        aria-modal="true"
        :aria-label="`项目详情：${activeProject.name}`"
      >
        <header class="vc-drawer__head">
          <div>
            <p class="vc-drawer__eyebrow">{{ activeProject.templateLabel }} 模板</p>
            <h2 class="vc-drawer__title">{{ activeProject.name }}</h2>
          </div>
          <button type="button" class="vc-icon-btn" aria-label="关闭详情" @click="closeProject">
            <el-icon><Close /></el-icon>
          </button>
        </header>

        <div class="vc-drawer__body">
          <div class="vc-drawer__preview" :style="thumbStyle(activeProject)">
            <el-icon :size="30"><component :is="templateOf(activeProject).icon" /></el-icon>
          </div>

          <label class="vc-field">
            <span class="vc-field__label">项目名称</span>
            <input
              v-model="draftName"
              class="vc-field__input"
              type="text"
              maxlength="40"
              @keyup.enter="saveProjectEdits"
            />
          </label>

          <div class="vc-field">
            <span class="vc-field__label">开发模板</span>
            <p class="vc-field__value">
              {{ activeProject.templateLabel }} —— {{ templateOf(activeProject).desc }}
            </p>
          </div>

          <div class="vc-field">
            <span class="vc-field__label">时间</span>
            <p class="vc-field__value">
              创建于 {{ formatDate(activeProject.createdAt) }} · 更新于
              {{ formatRelative(activeProject.updatedAt) }}
            </p>
          </div>

          <label class="vc-field">
            <span class="vc-field__label">小游戏描述（后续 AI 生成的输入）</span>
            <textarea
              v-model="draftDesc"
              class="vc-field__textarea"
              rows="4"
              maxlength="200"
              placeholder="例如：做一个像素风跳跃游戏，主角是只小猫，按空格起跳，收集小鱼干得分。"
            />
          </label>
        </div>

        <footer class="vc-drawer__foot">
          <button type="button" class="vc-ghost" @click="closeProject">关闭</button>
          <button type="button" class="vc-ghost is-danger" @click="askDelete(activeProject)">
            删除
          </button>
          <button type="button" class="vc-primary vc-primary--grow" @click="saveProjectEdits">
            保存修改
          </button>
        </footer>
      </section>
    </transition>

    <transition name="vc-fade">
      <div v-if="confirmState.visible" class="vc-modal-mask" @click.self="closeConfirm">
        <div class="vc-modal" role="alertdialog" aria-modal="true" aria-labelledby="vc-modal-title">
          <h3 id="vc-modal-title" class="vc-modal__title">{{ confirmState.title }}</h3>
          <p v-if="confirmState.message" class="vc-modal__text">{{ confirmState.message }}</p>
          <div class="vc-modal__actions">
            <button type="button" class="vc-ghost" @click="closeConfirm">取消</button>
            <button
              type="button"
              class="vc-primary"
              :class="{ 'is-danger': confirmState.danger }"
              @click="runConfirm"
            >
              {{ confirmState.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <div class="vc-toasts" aria-live="polite" aria-atomic="false">
      <transition-group name="vc-toast">
        <div v-for="item in toasts" :key="item.id" class="vc-toast" :class="`is-${item.type}`">
          <el-icon class="vc-toast__icon">
            <component :is="TOAST_ICONS[item.type]" />
          </el-icon>
          <div class="vc-toast__content">
            <strong>{{ item.title }}</strong>
            <p v-if="item.message">{{ item.message }}</p>
          </div>
          <button
            type="button"
            class="vc-toast__close"
            aria-label="关闭提示"
            @click="dismissToast(item.id)"
          >
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  ArrowDown,
  ArrowRight,
  Check,
  CircleClose,
  Clock,
  Close,
  Delete,
  EditPen,
  InfoFilled,
  Plus,
  Search,
  Warning
} from '@element-plus/icons-vue'
import {
  TEMPLATES,
  findTemplate,
  formatDate,
  formatRelative as formatRelativeTime,
  gradientOf,
  loadProjects,
  saveProjects,
  templateOf,
  thumbStyle
} from '@/lib/projects'

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'web2d', label: 'Web 2D' },
  { key: 'web3d', label: 'Web 3D' }
]

const TOAST_ICONS = {
  success: Check,
  info: InfoFilled,
  warn: Warning,
  danger: CircleClose
}

const DEMO_QUERY_KEY = 'demo'

const router = useRouter()
const route = useRoute()

const authStore = useAuthStore()

const projects = ref([])

const projectName = ref('')
const templateKey = ref('web2d')

const activeFilter = ref('all')
const keyword = ref('')

const isTemplateOpen = ref(false)

const isComposerFocused = ref(false)

const activeProjectId = ref('')

const draftName = ref('')
const draftDesc = ref('')

const nameInputRef = ref(null)
const searchInputRef = ref(null)
const templateSelectRef = ref(null)

const now = ref(Date.now())
let clockTimer = null

const currentTemplate = computed(() => findTemplate(templateKey.value))

const sortedProjects = computed(() => [...projects.value].sort((a, b) => b.updatedAt - a.updatedAt))

const sidebarProjects = computed(() => sortedProjects.value.slice(0, 6))

const visibleProjects = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return sortedProjects.value.filter((project) => {
    if (activeFilter.value !== 'all' && project.template !== activeFilter.value) return false
    if (!kw) return true
    const haystack = `${project.name} ${project.desc ?? ''} ${templateOf(project).label}`
    return haystack.toLowerCase().includes(kw)
  })
})

const activeProject = computed(
  () => projects.value.find((project) => project.id === activeProjectId.value) ?? null
)

watch(
  activeProject,
  (project) => {
    if (!project) {
      draftName.value = ''
      draftDesc.value = ''
      return
    }
    draftName.value = project.name
    draftDesc.value = project.desc ?? ''
  },
  { immediate: true }
)

function uid() {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

function formatRelative(timestamp) {
  return formatRelativeTime(timestamp, now.value)
}

function countOf(filterKey) {
  if (filterKey === 'all') return projects.value.length
  return projects.value.filter((project) => project.template === filterKey).length
}

function persistProjects() {
  saveProjects(projects.value)
}

const toasts = ref([])
const toastTimers = new Map()
let toastSeed = 0

function toast(type, title, message = '') {
  const id = ++toastSeed
  toasts.value = [...toasts.value.slice(-2), { id, type, title, message }]
  toastTimers.set(
    id,
    setTimeout(() => dismissToast(id), 3600)
  )
}

function dismissToast(id) {
  const timer = toastTimers.get(id)
  if (timer) {
    clearTimeout(timer)
    toastTimers.delete(id)
  }
  toasts.value = toasts.value.filter((item) => item.id !== id)
}

const confirmState = reactive({
  visible: false,
  title: '',
  message: '',
  confirmText: '确认',
  danger: false,
  action: null
})

function openConfirm({ title, message = '', confirmText = '确认', danger = false, action = null }) {
  Object.assign(confirmState, { visible: true, title, message, confirmText, danger, action })
}

function closeConfirm() {
  confirmState.visible = false
}

function runConfirm() {
  const action = confirmState.action
  confirmState.visible = false
  if (typeof action === 'function') action()
}

function defaultProjectName() {
  const base = '未命名项目'
  const used = new Set(projects.value.map((project) => project.name))
  if (!used.has(base)) return base

  let index = 2
  while (used.has(`${base} ${index}`)) index += 1
  return `${base} ${index}`
}

function createProject() {
  const trimmed = projectName.value.trim()
  const name = trimmed || defaultProjectName()
  const template = findTemplate(templateKey.value)
  const timestamp = Date.now()

  const project = {
    id: uid(),
    name,
    template: template.key,
    templateLabel: template.label,
    desc: '',
    createdAt: timestamp,
    updatedAt: timestamp
  }

  projects.value = [project, ...projects.value]
  persistProjects()

  projectName.value = ''
  activeFilter.value = 'all'
  keyword.value = ''

  toast('success', `「${name}」已创建`, `${template.label} 模板 · 去详情里补一句玩法描述吧`)
  nextTick(() => nameInputRef.value?.focus())
}

function openProject(id) {
  activeProjectId.value = id
  isTemplateOpen.value = false
}

function closeProject() {
  activeProjectId.value = ''
}

function saveProjectEdits() {
  const project = activeProject.value
  if (!project) return

  const trimmed = draftName.value.trim()
  project.name = trimmed || defaultProjectName()
  project.desc = draftDesc.value.trim()
  project.updatedAt = Date.now()
  persistProjects()

  toast('success', '已保存', `「${project.name}」的信息已更新`)
}

function askDelete(project) {
  if (!project) return
  openConfirm({
    title: `删除项目「${project.name}」？`,
    message: '只会移除这台设备上的项目记录，删除后无法恢复。',
    confirmText: '删除项目',
    danger: true,
    action: () => deleteProject(project.id)
  })
}

function deleteProject(id) {
  const target = projects.value.find((project) => project.id === id)
  projects.value = projects.value.filter((project) => project.id !== id)
  persistProjects()

  if (activeProjectId.value === id) activeProjectId.value = ''
  toast('warn', '项目已删除', target ? `「${target.name}」已从我的项目中移除` : '')
}

function focusComposer() {
  activeFilter.value = 'all'
  nameInputRef.value?.focus()
}

function goProjects() {
  router.push({ name: 'projects' })
}

function toggleTemplate() {
  isTemplateOpen.value = !isTemplateOpen.value
}

function chooseTemplate(key) {
  templateKey.value = key
  isTemplateOpen.value = false
  nextTick(() => nameInputRef.value?.focus())
}

function clearSearch() {
  keyword.value = ''
  searchInputRef.value?.focus()
}

function askLogout() {
  openConfirm({
    title: '退出登录？',
    message: '当前账号的项目记录会保留在这台设备上，随时可以回来继续。',
    confirmText: '退出登录',
    action: () => {
      authStore.logout()
      toast('info', '已退出登录')
      router.replace({ name: 'login' })
    }
  })
}

function buildDemoProjects() {
  const minute = 60 * 1000
  const drafts = [
    {
      name: '像素小猫跳跃',
      template: 'web2d',
      desc: '像素风横版跳跃，主角是只小猫，按空格起跳，收集小鱼干计分。',
      ago: 12 * minute
    },
    {
      name: '霓虹赛车 3D',
      template: 'web3d',
      desc: '赛博霓虹赛道，方向键控制车身，撞墙即重开，圈速越快得分越高。',
      ago: 3 * 60 * minute
    },
    {
      name: '贪吃蛇 · 极简版',
      template: 'web2d',
      desc: '复古贪吃蛇，吃到食物后速度逐步加快，撞到自己就结束。',
      ago: 26 * 60 * minute
    },
    {
      name: '太空弹球',
      template: 'web3d',
      desc: '低重力弹球，鼠标左右移动挡板，打碎砖块累计分数。',
      ago: 5 * 24 * 60 * minute
    }
  ]
  const nowTs = Date.now()

  return drafts.map((draft, index) => ({
    id: `demo_${index}_${nowTs.toString(36)}`,
    name: draft.name,
    template: draft.template,
    templateLabel: findTemplate(draft.template).label,
    desc: draft.desc,
    createdAt: nowTs - draft.ago - 60 * minute,
    updatedAt: nowTs - draft.ago
  }))
}

function loadDemoProjects() {
  if (projects.value.length) {
    toast('info', '已经有项目了', '示例数据只用来预览空列表时的布局')
    return
  }
  projects.value = buildDemoProjects()
  persistProjects()
  toast('success', '已载入 4 个示例项目', '点开卡片能看详情，不需要可以直接删掉')
}

function handleGlobalKeydown(event) {
  const { key } = event
  const isTyping =
    event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(event.target.tagName)

  if (key === 'Escape') {
    if (isTemplateOpen.value) {
      isTemplateOpen.value = false
      return
    }
    if (activeProject.value) {
      closeProject()
      return
    }
    if (confirmState.visible) closeConfirm()
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
  if (!isTemplateOpen.value) return
  const root = templateSelectRef.value
  if (root && event.target instanceof Node && !root.contains(event.target)) {
    isTemplateOpen.value = false
  }
}

function bootstrap() {
  projects.value = loadProjects()

  const openId = route.query.open
  const wantCreate = route.query.new
  const demoFlag = route.query[DEMO_QUERY_KEY]

  if (!projects.value.length && demoFlag === '1') {
    projects.value = buildDemoProjects()
  }

  if (typeof openId === 'string' && projects.value.some((project) => project.id === openId)) {
    activeProjectId.value = openId
  }

  if (wantCreate === '1') {
    nextTick(() => nameInputRef.value?.focus())
  }

  if (openId || wantCreate) {
    const query = { ...route.query }
    delete query.open
    delete query.new
    router.replace({ name: 'work', query })
  }
}

onMounted(() => {
  bootstrap()
  clockTimer = window.setInterval(() => {
    now.value = Date.now()
  }, 60 * 1000)
  document.addEventListener('keydown', handleGlobalKeydown)
  document.addEventListener('pointerdown', handleGlobalPointerDown)
})

onBeforeUnmount(() => {
  if (clockTimer) window.clearInterval(clockTimer)
  toastTimers.forEach((timer) => clearTimeout(timer))
  toastTimers.clear()
  document.removeEventListener('keydown', handleGlobalKeydown)
  document.removeEventListener('pointerdown', handleGlobalPointerDown)
})
</script>

<style scoped>
.vc-workbench {
  --vc-bg: #0a0c10;
  --vc-panel: #101419;
  --vc-border: #1e222a;
  --vc-border-strong: #2b3140;
  --vc-text: #eef2f8;
  --vc-text-2: #98a3b5;
  --vc-text-3: #5f6a7b;
  --vc-accent: #3b82f6;
  --vc-accent-bright: #60a5fa;
  --vc-accent-line: rgba(96, 165, 250, 0.4);
  --vc-danger: #ef4444;
  --vc-radius-sm: 8px;
  --vc-radius: 12px;
  --vc-radius-lg: 16px;
  --vc-topbar-h: 62px;
  --vc-sidebar-w: 268px;

  display: flex;
  flex-direction: column;
  min-height: 100vh;
  color: var(--vc-text);
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background:
    radial-gradient(120% 55% at 50% 0%, rgba(59, 130, 246, 0.08), transparent 62%), var(--vc-bg);
  -webkit-font-smoothing: antialiased;
}

.vc-workbench ::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
.vc-workbench ::-webkit-scrollbar-thumb {
  background: #242a34;
  border: 3px solid transparent;
  background-clip: content-box;
  border-radius: 8px;
}
.vc-workbench ::-webkit-scrollbar-thumb:hover {
  background: #333c4a;
  background-clip: content-box;
}

.vc-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: var(--vc-topbar-h);
  padding: 0 20px;
  background: rgba(10, 12, 16, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--vc-border);
}

.vc-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.vc-brand__logo {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  color: #fff;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
}
.vc-brand__logo svg {
  width: 18px;
  height: 18px;
  display: block;
  fill: currentColor;
}
.vc-brand__name {
  font-size: 16.5px;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: #f5f8fd;
  white-space: nowrap;
}
.vc-brand__sub {
  font-size: 16.5px;
  font-weight: 600;
  color: #93a0b4;
  white-space: nowrap;
}

.vc-topbar__right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.vc-search {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 300px;
  height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #23272f;
  background: #14171d;
  color: var(--vc-text-3);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}
.vc-search:focus-within {
  border-color: var(--vc-accent-line);
  background: #151a22;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}
.vc-search__icon {
  font-size: 15px;
  flex: none;
}
.vc-search__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  background: transparent;
  color: var(--vc-text);
  font-size: 14px;
  font-family: inherit;
  outline: none;
}
.vc-search__input::placeholder {
  color: #5f6875;
}

.vc-search__input::-webkit-search-cancel-button {
  display: none;
}
.vc-search__clear {
  display: grid;
  place-items: center;
  padding: 2px;
  border: 0;
  background: transparent;
  color: #6b7584;
  cursor: pointer;
  transition: color 0.16s ease;
}
.vc-search__clear:hover {
  color: #dfe6f2;
}

.vc-user {
  display: flex;
  align-items: center;
  gap: 9px;
}
.vc-user__avatar {
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
.vc-user__name {
  font-size: 14px;
  color: #c9d2e1;
  white-space: nowrap;
}

.vc-topbar__logout {
  padding: 7px 10px;
  border: 0;
  border-radius: var(--vc-radius-sm);
  background: transparent;
  color: #8d97a8;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition:
    color 0.18s ease,
    background 0.18s ease;
}
.vc-topbar__logout:hover {
  color: #e8eefc;
  background: #151920;
}

.vc-body {
  display: flex;
  flex: 1;
  align-items: stretch;
  min-height: 0;
}

.vc-sidebar {
  display: flex;
  flex-direction: column;
  flex: 0 0 var(--vc-sidebar-w);
  width: var(--vc-sidebar-w);
  padding: 18px 14px 28px;
  border-right: 1px solid var(--vc-border);
  background: rgba(10, 12, 16, 0.55);
}

.vc-sidebar__create {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 46px;
  border-radius: 10px;
  border: 1px solid rgba(96, 165, 250, 0.42);
  background: rgba(59, 130, 246, 0.1);
  color: #cfe0ff;
  font-size: 14.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    color 0.18s ease;
}
.vc-sidebar__create:hover {
  background: rgba(59, 130, 246, 0.18);
  border-color: rgba(96, 165, 250, 0.7);
  color: #eaf2ff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
}

.vc-sidebar__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  margin: 20px 0 8px;
  padding: 6px 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #7c8798;
  font-family: inherit;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-align: left;
  cursor: pointer;
  transition:
    color 0.16s ease,
    background 0.16s ease;
}
.vc-sidebar__heading:hover {
  color: #cfe0ff;
  background: #14181f;
}
.vc-sidebar__heading:focus-visible {
  outline: 2px solid rgba(96, 165, 250, 0.5);
  outline-offset: 2px;
}
.vc-sidebar__heading-side {
  display: flex;
  align-items: center;
  gap: 6px;
}
.vc-sidebar__heading em {
  padding: 1px 6px;
  border-radius: 999px;
  background: #171b22;
  color: #8d97a8;
  font-style: normal;
  font-size: 11px;
}

.vc-sidebar__heading-arrow {
  font-size: 12px;
  color: #8fb6ff;
  opacity: 0;
  transform: translateX(-4px);
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}
.vc-sidebar__heading:hover .vc-sidebar__heading-arrow,
.vc-sidebar__heading:focus-visible .vc-sidebar__heading-arrow {
  opacity: 1;
  transform: none;
}

.vc-history {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.vc-history__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.16s ease;
}
.vc-history__item:hover {
  background: #14181f;
}
.vc-history__dot {
  flex: 0 0 26px;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}
.vc-history__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.vc-history__text strong {
  font-size: 13.5px;
  font-weight: 500;
  color: #dbe3f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.vc-history__text em {
  font-style: normal;
  font-size: 11.5px;
  color: #5d6675;
}
.vc-sidebar__empty {
  margin: 2px 10px;
  font-size: 13px;
  color: #4f5867;
}

.vc-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  padding: 40px 40px 72px;
}

.vc-hero,
.vc-composer,
.vc-filters,
.vc-empty,
.vc-grid {
  width: 100%;
  max-width: 1120px;
}

.vc-hero {
  margin-top: 12px;
  text-align: center;
}
.vc-hero__title {
  font-size: 40px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.6px;
  color: #f7f9fd;
}
.vc-hero__title span {
  color: #f7f9fd;
}
.vc-hero__subtitle {
  margin-top: 14px;
  font-size: 15px;
  color: #8b95a7;
}

.vc-composer {
  margin-top: 30px;
  border: 1px solid var(--vc-border);
  border-radius: var(--vc-radius-lg);
  background: linear-gradient(180deg, #101419, #0c0f14);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
  overflow: visible;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}
.vc-composer.is-focused {
  border-color: var(--vc-accent-line);
  box-shadow:
    0 18px 44px rgba(0, 0, 0, 0.45),
    0 0 0 4px rgba(59, 130, 246, 0.08);
}
.vc-composer__field {
  position: relative;
  display: block;
}
.vc-composer__input {
  width: 100%;
  height: 64px;
  padding: 0 56px 0 22px;
  border: 0;
  border-bottom: 1px solid #1c2028;
  background: transparent;
  color: var(--vc-text);
  font-size: 15px;
  font-family: inherit;
  outline: none;
}
.vc-composer__input::placeholder {
  color: #5a6371;
}
.vc-composer__counter {
  position: absolute;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  font-size: 12px;
  color: #4b5462;
  pointer-events: none;
}
.vc-composer__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
}

.vc-select {
  position: relative;
}
.vc-select__trigger {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 40px;
  padding: 0 14px;
  border-radius: 9px;
  border: 1px solid #262b34;
  background: #0f1218;
  color: #d7dee9;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}
.vc-select__trigger:hover {
  border-color: #333a47;
  background: #121620;
}
.vc-select.is-open .vc-select__trigger {
  border-color: var(--vc-accent-line);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.vc-select__icon {
  font-size: 15px;
  color: #8fb6ff;
}
.vc-select__arrow {
  font-size: 12px;
  color: #6f7a8b;
  transition: transform 0.2s ease;
}
.vc-select.is-open .vc-select__arrow {
  transform: rotate(180deg);
}
.vc-select__panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 30;
  width: 272px;
  padding: 6px;
  border-radius: var(--vc-radius);
  border: 1px solid #262b34;
  background: #11151b;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
}
.vc-select__option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: var(--vc-radius-sm);
  cursor: pointer;
  transition: background 0.14s ease;
}
.vc-select__option:hover {
  background: #171c24;
}
.vc-select__option.is-active {
  background: rgba(59, 130, 246, 0.12);
}
.vc-select__swatch {
  flex: 0 0 22px;
  width: 22px;
  height: 22px;
  border-radius: 6px;
}
.vc-select__option-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.vc-select__option-text strong {
  font-size: 13.5px;
  font-weight: 600;
  color: #e2e9f5;
}
.vc-select__option-text em {
  font-style: normal;
  font-size: 11.5px;
  color: #6b7584;
}
.vc-select__check {
  margin-left: auto;
  font-size: 14px;
  color: var(--vc-accent-bright);
}

.vc-primary {
  height: 40px;
  padding: 0 22px;
  border: 0;
  border-radius: 9px;
  background: linear-gradient(180deg, #3d86f7, #2f6df0);
  color: #fff;
  font-size: 14.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(47, 109, 240, 0.3);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    filter 0.18s ease;
}
.vc-primary:hover {
  transform: translateY(-1px);
  filter: brightness(1.08);
  box-shadow: 0 10px 26px rgba(47, 109, 240, 0.42);
}
.vc-primary:active {
  transform: translateY(0);
  filter: brightness(0.98);
}
.vc-primary.is-danger {
  background: linear-gradient(180deg, #f0605f, #e03d3d);
  box-shadow: 0 8px 20px rgba(224, 61, 61, 0.28);
}
.vc-primary.is-danger:hover {
  box-shadow: 0 10px 26px rgba(224, 61, 61, 0.4);
}
.vc-primary--grow {
  margin-left: auto;
}

.vc-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 26px;
}
.vc-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 38px;
  padding: 0 18px;
  border-radius: 10px;
  border: 1px solid #242a34;
  background: transparent;
  color: #96a0b1;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition:
    color 0.16s ease,
    border-color 0.16s ease,
    background 0.16s ease;
}
.vc-chip:hover {
  color: #d7e2f4;
  border-color: #333c4a;
  background: #12161d;
}
.vc-chip.is-active {
  color: #d6e6ff;
  border-color: rgba(96, 165, 250, 0.55);
  background: rgba(59, 130, 246, 0.14);
}
.vc-chip em {
  font-style: normal;
  font-size: 11.5px;
  color: #7f8b9d;
}
.vc-chip.is-active em {
  color: #9dc0ff;
}

.vc-empty {
  margin-top: 30px;
  font-size: 14px;
  color: #6a7383;
}
.vc-empty__demo {
  margin-left: 10px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #8fb6ff;
  font-size: 13.5px;
  font-family: inherit;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: rgba(143, 182, 255, 0.4);
  text-underline-offset: 3px;
}
.vc-empty__demo:hover {
  color: #b6d0ff;
}

.vc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 18px;
  margin-top: 28px;
  list-style: none;
}
.vc-card {
  position: relative;
  border-radius: 14px;
  border: 1px solid #1f242d;
  background: linear-gradient(180deg, #0f1319, #0b0e13);
  overflow: hidden;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.vc-card:hover,
.vc-card:focus-within {
  transform: translateY(-3px);
  border-color: #2f3948;
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.5);
}

.vc-card__thumb {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  padding: 0;
  border: 0;
  cursor: pointer;
  color: #fff;
  background: linear-gradient(
    var(--thumb-angle, 130deg),
    var(--thumb-from, #6366f1),
    var(--thumb-to, #8b5cf6)
  );
}

.vc-card__thumb::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(6, 8, 12, 0.34), rgba(6, 8, 12, 0.58)),
    radial-gradient(120% 100% at 20% 0%, rgba(255, 255, 255, 0.2), transparent 55%);
}
.vc-card__badge {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(9, 12, 17, 0.5);
  backdrop-filter: blur(6px);
  color: #eaf2ff;
  font-size: 11px;
  font-weight: 600;
}

.vc-card__lines {
  position: absolute;
  left: 14px;
  bottom: 16px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 52%;
}
.vc-card__lines i {
  display: block;
  height: 5px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.35);
}
.vc-card__lines i:nth-child(2) {
  width: 78%;
  background: rgba(255, 255, 255, 0.22);
}
.vc-card__lines i:nth-child(3) {
  width: 56%;
  background: rgba(255, 255, 255, 0.16);
}
.vc-card__glyph {
  position: absolute;
  right: 14px;
  bottom: 12px;
  z-index: 2;
  opacity: 0.9;
}

.vc-card__body {
  padding: 12px 14px 14px;
}
.vc-card__name {
  font-size: 15px;
  font-weight: 600;
  color: #e9eef7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.vc-card__meta {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 6px;
  font-size: 12px;
  color: #6a7383;
}

.vc-card__actions {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 3;
  display: flex;
  gap: 6px;
  opacity: 0;
  transform: translateY(-4px);
  pointer-events: none;
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.vc-card:hover .vc-card__actions,
.vc-card:focus-within .vc-card__actions {
  opacity: 1;
  transform: none;
  pointer-events: auto;
}

.vc-icon-btn {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: var(--vc-radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(9, 12, 17, 0.62);
  backdrop-filter: blur(6px);
  color: #dbe4f2;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition:
    background 0.16s ease,
    color 0.16s ease,
    border-color 0.16s ease;
}
.vc-icon-btn:hover {
  background: rgba(24, 32, 44, 0.95);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}
.vc-icon-btn.is-danger:hover {
  background: rgba(80, 20, 24, 0.9);
  border-color: rgba(239, 68, 68, 0.6);
  color: #ffd9d9;
}

.vc-scrim {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(4, 6, 10, 0.6);
  backdrop-filter: blur(3px);
}

.vc-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 41;
  display: flex;
  flex-direction: column;
  width: min(440px, 92vw);
  border-left: 1px solid #23272f;
  background: #0b0e13;
  box-shadow: -30px 0 60px rgba(0, 0, 0, 0.55);
}
.vc-drawer__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 22px 22px 16px;
  border-bottom: 1px solid #1b1f27;
}
.vc-drawer__eyebrow {
  font-size: 12px;
  letter-spacing: 0.06em;
  color: #6f7a8b;
}
.vc-drawer__title {
  margin-top: 6px;
  font-size: 19px;
  font-weight: 700;
  color: #f2f6fc;
}
.vc-drawer__head .vc-icon-btn {
  background: #12161d;
  border-color: #242a34;
}
.vc-drawer__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 18px;
  padding: 20px 22px;
  overflow-y: auto;
}
.vc-drawer__preview {
  position: relative;
  display: grid;
  place-items: center;
  height: 132px;
  border-radius: var(--vc-radius);
  color: #fff;
  background: linear-gradient(
    var(--thumb-angle, 130deg),
    var(--thumb-from, #6366f1),
    var(--thumb-to, #8b5cf6)
  );
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}
.vc-drawer__preview::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--vc-radius);
  background:
    linear-gradient(180deg, rgba(6, 8, 12, 0.3), rgba(6, 8, 12, 0.5)),
    radial-gradient(120% 100% at 25% 0%, rgba(255, 255, 255, 0.22), transparent 60%);
  pointer-events: none;
}

.vc-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.vc-field__label {
  font-size: 12.5px;
  color: #7b8697;
}
.vc-field__input,
.vc-field__textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: 9px;
  border: 1px solid #242a34;
  background: #0f1319;
  color: #e6ecf6;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}
.vc-field__input:focus,
.vc-field__textarea:focus {
  border-color: var(--vc-accent-line);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.vc-field__textarea {
  min-height: 92px;
  line-height: 1.6;
  resize: vertical;
}
.vc-field__value {
  font-size: 13.5px;
  line-height: 1.6;
  color: #c3ccdb;
}

.vc-drawer__foot {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 22px 22px;
  border-top: 1px solid #1b1f27;
}

.vc-ghost {
  height: 40px;
  padding: 0 16px;
  border-radius: 9px;
  border: 1px solid #262b34;
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
.vc-ghost:hover {
  background: #161b23;
  border-color: #333c4a;
  color: #eaf1fb;
}
.vc-ghost.is-danger:hover {
  background: rgba(70, 20, 24, 0.6);
  border-color: rgba(239, 68, 68, 0.55);
  color: #ffd0d0;
}

.vc-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(4, 6, 10, 0.66);
  backdrop-filter: blur(4px);
}
.vc-modal {
  width: min(400px, 100%);
  padding: 24px;
  border-radius: var(--vc-radius-lg);
  border: 1px solid #262b34;
  background: linear-gradient(180deg, #12161d, #0d1015);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
}
.vc-modal__title {
  font-size: 16.5px;
  font-weight: 600;
  color: #f2f6fc;
}
.vc-modal__text {
  margin-top: 10px;
  font-size: 13.5px;
  line-height: 1.7;
  color: #8b95a7;
}
.vc-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}

.vc-toasts {
  position: fixed;
  top: calc(var(--vc-topbar-h) + 14px);
  left: 50%;
  z-index: 60;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(380px, calc(100vw - 32px));
  transform: translateX(-50%);
  pointer-events: none;
}
.vc-toast {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--vc-radius);
  border: 1px solid #262b34;
  background: #10141a;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
  pointer-events: auto;
}
.vc-toast__icon {
  margin-top: 1px;
  font-size: 15px;
  color: #8fb6ff;
}
.vc-toast.is-success .vc-toast__icon {
  color: #34d399;
}
.vc-toast.is-warn .vc-toast__icon {
  color: #fbbf24;
}
.vc-toast.is-danger .vc-toast__icon {
  color: #f87171;
}
.vc-toast__content strong {
  display: block;
  font-size: 13.5px;
  font-weight: 600;
  color: #eef3fb;
}
.vc-toast__content p {
  margin-top: 3px;
  font-size: 12.5px;
  line-height: 1.55;
  color: #8b95a7;
}
.vc-toast__close {
  display: grid;
  place-items: center;
  margin-left: auto;
  padding: 2px;
  border: 0;
  background: transparent;
  color: #5f6a7b;
  cursor: pointer;
}
.vc-toast__close:hover {
  color: #dbe4f2;
}

.vc-fade-enter-active,
.vc-fade-leave-active {
  transition: opacity 0.2s ease;
}
.vc-fade-enter-from,
.vc-fade-leave-to {
  opacity: 0;
}

.vc-drawer-enter-active,
.vc-drawer-leave-active {
  transition:
    transform 0.26s cubic-bezier(0.22, 0.7, 0.25, 1),
    opacity 0.2s ease;
}
.vc-drawer-enter-from,
.vc-drawer-leave-to {
  transform: translateX(24px);
  opacity: 0;
}

.vc-pop-enter-active,
.vc-pop-leave-active {
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}
.vc-pop-enter-from,
.vc-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

.vc-toast-enter-active,
.vc-toast-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}
.vc-toast-enter-from,
.vc-toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 1180px) {
  .vc-workbench {
    --vc-sidebar-w: 214px;
  }
  .vc-main {
    padding: 38px 28px 60px;
  }
  .vc-hero__title {
    font-size: 34px;
  }
}

@media (max-width: 940px) {
  .vc-body {
    flex-direction: column;
  }
  .vc-sidebar {
    flex: none;
    width: 100%;
    padding: 14px 16px 16px;
    border-right: 0;
    border-bottom: 1px solid var(--vc-border);
  }
  .vc-sidebar__create {
    width: auto;
    align-self: flex-start;
    padding: 0 16px;
  }
  .vc-sidebar__heading {
    margin: 16px 0 8px;
  }

  .vc-history {
    flex-direction: row;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
  }
  .vc-history li {
    flex: 0 0 auto;
  }
  .vc-history__item {
    width: 190px;
    border: 1px solid #1e232b;
    background: #0f1319;
  }
  .vc-main {
    padding: 30px 16px 48px;
  }
  .vc-hero {
    margin-top: 4px;
  }
  .vc-hero__title {
    font-size: 27px;
  }
  .vc-hero__subtitle {
    margin-top: 10px;
    font-size: 14px;
  }
  .vc-topbar {
    gap: 10px;
    padding: 0 14px;
  }

  .vc-brand__name,
  .vc-brand__sub,
  .vc-user__name {
    display: none;
  }
  .vc-search {
    width: 200px;
  }
}

@media (max-width: 620px) {
  .vc-grid {
    grid-template-columns: 1fr;
  }
  .vc-composer__input {
    height: 56px;
    padding: 0 16px;
    font-size: 14px;
  }
  .vc-composer__footer {
    flex-wrap: wrap;
    padding: 12px 14px;
  }
  .vc-select,
  .vc-select__trigger {
    width: 100%;
  }
  .vc-select__trigger {
    justify-content: space-between;
  }
  .vc-select__panel {
    width: 100%;
  }
  .vc-primary {
    width: 100%;
  }
  .vc-search {
    width: 150px;
  }
}
</style>
