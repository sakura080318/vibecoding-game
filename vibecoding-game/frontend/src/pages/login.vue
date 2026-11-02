<template>
  <div class="lg-page">
    <main class="lg-card">
      <!-- ==================== 左侧插画区 ==================== -->
      <AuthArt />

      <!-- ==================== 右侧登录表单 ==================== -->
      <div class="lg-panel">
        <div class="lg-brand">
          <span class="lg-brand__logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path
                d="M9.2 6.9a1 1 0 0 1 1.52-.86l7.1 4.6a1 1 0 0 1 0 1.72l-7.1 4.6A1 1 0 0 1 9.2 16.1V6.9Z"
              />
            </svg>
          </span>
          <h1 class="lg-brand__title">Vibe Coding <span>游戏平台</span></h1>
          <p class="lg-brand__subtitle">用自然语言做游戏</p>
        </div>

        <form class="lg-form" novalidate @submit.prevent="handleSubmit">
          <p v-if="successNotice" class="lg-form__success" role="status">{{ successNotice }}</p>

          <div class="lg-field" :class="{ 'is-invalid': errors.username }">
            <el-icon class="lg-field__icon"><User /></el-icon>
            <input
              ref="usernameRef"
              v-model="form.username"
              class="lg-field__input"
              type="text"
              autocomplete="username"
              placeholder="请输入用户名"
              aria-label="用户名"
              @input="errors.username = ''"
            />
          </div>
          <p v-if="errors.username" class="lg-field__error">{{ errors.username }}</p>

          <div class="lg-field" :class="{ 'is-invalid': errors.password }">
            <el-icon class="lg-field__icon"><Lock /></el-icon>
            <input
              ref="passwordRef"
              v-model="form.password"
              class="lg-field__input"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="请输入登录密码"
              aria-label="登录密码"
              @input="errors.password = ''"
            />
            <button
              type="button"
              class="lg-field__toggle"
              :aria-label="showPassword ? '隐藏密码' : '显示密码'"
              @click="showPassword = !showPassword"
            >
              <el-icon>
                <component :is="showPassword ? Hide : View" />
              </el-icon>
            </button>
          </div>
          <p v-if="errors.password" class="lg-field__error">{{ errors.password }}</p>

          <p v-if="errors.form" class="lg-form__error" role="alert">{{ errors.form }}</p>

          <button
            type="submit"
            class="lg-submit"
            :class="{ 'is-loading': loading }"
            :disabled="loading"
          >
            <span v-if="loading" class="lg-submit__spinner" aria-hidden="true"></span>
            <span>{{ loading ? '登录中' : '登 录' }}</span>
          </button>

          <!-- 没有账号的人从这里去注册页 -->
          <p class="lg-form__hint">
            <RouterLink class="lg-form__link" :to="{ name: 'register' }">注册账号</RouterLink>
          </p>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Hide, Lock, User, View } from '@element-plus/icons-vue'
import AuthArt from '@/components/AuthArt.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = reactive({ username: '', password: '' })

const errors = reactive({ username: '', password: '', form: '' })

const loading = ref(false)

const showPassword = ref(false)

const successNotice = ref('')

const usernameRef = ref(null)
const passwordRef = ref(null)

onMounted(() => {
  const rawName = route.query.username
  const registeredName = Array.isArray(rawName) ? rawName[0] : rawName

  if (route.query.registered) {
    successNotice.value = '注册成功，请使用新账号登录'
    if (typeof registeredName === 'string' && registeredName) {
      form.username = registeredName
    }
  }

  if (form.username) passwordRef.value?.focus()
  else usernameRef.value?.focus()
})

function validate() {
  const name = form.username.trim()
  errors.username = name.length < 3 ? '用户名至少 3 个字符' : ''
  errors.password = form.password.length < 6 ? '密码至少 6 位' : ''
  return !errors.username && !errors.password
}

function resolveRedirect() {
  const raw = route.query.redirect
  const target = Array.isArray(raw) ? raw[0] : raw
  if (typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')) {
    return target
  }
  return { name: 'work' }
}

async function handleSubmit() {
  if (loading.value) return

  errors.form = ''
  successNotice.value = ''
  if (!validate()) {
    if (errors.username) usernameRef.value?.focus()
    else passwordRef.value?.focus()
    return
  }

  loading.value = true
  try {
    await new Promise((resolve) => setTimeout(resolve, 280))

    const ok = authStore.login(form.username, form.password)
    if (!ok) {
      errors.form = '用户名或密码错误，默认账号 admin / 123456'
      passwordRef.value?.focus()
      passwordRef.value?.select?.()
      return
    }

    await router.replace(resolveRedirect())
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.lg-page {
  --lg-bg: #0a0b10;
  --lg-card: #101219;
  --lg-border: #23262f;
  --lg-text: #eef1f8;
  --lg-text-2: #98a1b2;
  --lg-text-3: #5c6472;
  --lg-accent: #3b82f6;
  --lg-accent-line: rgba(96, 165, 250, 0.5);
  --lg-danger: #f87171;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40px 24px;
  color: var(--lg-text);
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background:
    radial-gradient(55% 45% at 8% 0%, rgba(99, 102, 241, 0.22), transparent 62%),
    radial-gradient(50% 45% at 95% 100%, rgba(59, 130, 246, 0.14), transparent 60%), var(--lg-bg);
  -webkit-font-smoothing: antialiased;
}

.lg-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: min(1120px, 92vw);
  min-height: 560px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 20px;
  background: var(--lg-card);
  box-shadow:
    0 40px 100px rgba(0, 0, 0, 0.62),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.lg-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 30px;
  padding: 50px 54px;
  background: linear-gradient(180deg, #11131a 0%, #0e1016 100%);
}

.lg-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.lg-brand__logo {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 12px 28px rgba(99, 102, 241, 0.4);
}
.lg-brand__logo svg {
  width: 30px;
  height: 30px;
  display: block;
  fill: currentColor;
}
.lg-brand__title {
  margin-top: 18px;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: #f6f8fd;
}
.lg-brand__title span {
  font-weight: 700;
}
.lg-brand__subtitle {
  margin-top: 10px;
  font-size: 14px;
  color: var(--lg-text-2);
}

.lg-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.lg-field {
  position: relative;
  display: flex;
  align-items: center;
}
.lg-field__icon {
  position: absolute;
  left: 15px;
  font-size: 15px;
  color: #6a7383;
  pointer-events: none;
}
.lg-field__input {
  width: 100%;
  height: 48px;
  padding: 0 46px 0 44px;
  border: 1px solid var(--lg-border);
  border-radius: 10px;
  background: #0d0f15;
  color: var(--lg-text);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}
.lg-field__input::placeholder {
  color: #5c6472;
}
.lg-field__input:focus {
  border-color: var(--lg-accent-line);
  background: #0f1219;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}
.lg-field.is-invalid .lg-field__input {
  border-color: rgba(248, 113, 113, 0.6);
}
.lg-field__toggle {
  position: absolute;
  right: 12px;
  display: grid;
  place-items: center;
  padding: 4px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #6a7383;
  font-size: 15px;
  cursor: pointer;
  transition: color 0.16s ease;
}
.lg-field__toggle:hover {
  color: #dbe4f2;
}

.lg-field__error {
  margin: -8px 0 0 4px;
  font-size: 12.5px;
  color: var(--lg-danger);
}
.lg-form__error {
  margin-top: 2px;
  padding: 10px 12px;
  border: 1px solid rgba(248, 113, 113, 0.35);
  border-radius: 9px;
  background: rgba(248, 113, 113, 0.08);
  font-size: 12.5px;
  line-height: 1.5;
  color: #fca5a5;
}

.lg-form__success {
  padding: 9px 12px;
  border: 1px solid rgba(52, 211, 153, 0.32);
  border-radius: 9px;
  background: rgba(52, 211, 153, 0.1);
  font-size: 12.5px;
  line-height: 1.5;
  color: #6ee7b7;
}

.lg-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 48px;
  margin-top: 6px;
  border: 0;
  border-radius: 10px;
  background: linear-gradient(180deg, #3d86f7, #2f6df0);
  color: #fff;
  font-size: 15.5px;
  font-weight: 600;
  font-family: inherit;
  letter-spacing: 0.16em;
  cursor: pointer;
  box-shadow: 0 12px 26px rgba(47, 109, 240, 0.32);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    filter 0.18s ease;
}
.lg-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.07);
  box-shadow: 0 14px 30px rgba(47, 109, 240, 0.42);
}
.lg-submit:active:not(:disabled) {
  transform: translateY(0);
  filter: brightness(0.98);
}
.lg-submit:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.lg-submit__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #fff;
  border-radius: 50%;
  animation: lg-spin 0.7s linear infinite;
}
@keyframes lg-spin {
  to {
    transform: rotate(360deg);
  }
}

.lg-form__hint {
  margin-top: 2px;
  font-size: 12.5px;
  line-height: 1.6;
  text-align: center;
  color: var(--lg-text-3);
}

.lg-form__link {
  color: #60a5fa;
  font-size: 13px;
  font-weight: 500;
  border-radius: 4px;
  transition: color 0.16s ease;
}
.lg-form__link:hover {
  color: #93c5fd;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.lg-form__link:focus-visible {
  outline: 2px solid rgba(96, 165, 250, 0.6);
  outline-offset: 3px;
}

@media (max-width: 900px) {
  .lg-card {
    grid-template-columns: 1fr;
    width: min(440px, 92vw);
    min-height: 0;
  }
  .lg-panel {
    padding: 38px 28px 34px;
    gap: 22px;
  }
  .lg-brand__title {
    font-size: 22px;
  }
}

@media (max-width: 420px) {
  .lg-page {
    padding: 24px 14px;
  }
  .lg-panel {
    padding: 32px 20px 28px;
  }
}
</style>
