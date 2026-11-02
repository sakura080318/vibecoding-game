<template>
  <div class="rg-page">
    <main class="rg-card">
      <AuthArt />

      <div class="rg-panel">
        <div class="rg-brand">
          <span class="rg-brand__logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path
                d="M9.2 6.9a1 1 0 0 1 1.52-.86l7.1 4.6a1 1 0 0 1 0 1.72l-7.1 4.6A1 1 0 0 1 9.2 16.1V6.9Z"
              />
            </svg>
          </span>
          <h1 class="rg-brand__title">注册 Vibe Coding 账号</h1>
          <p class="rg-brand__subtitle">创建账号，开始用自然语言做游戏</p>
        </div>

        <form class="rg-form" novalidate @submit.prevent="handleSubmit">
          <!-- 账号 ID -->
          <div class="rg-field" :class="{ 'is-invalid': errors.username }">
            <el-icon class="rg-field__icon"><User /></el-icon>
            <input
              ref="usernameRef"
              v-model="form.username"
              class="rg-field__input"
              type="text"
              autocomplete="username"
              maxlength="20"
              placeholder="请输入账号 ID（字母开头，3-20 位）"
              aria-label="账号 ID"
              :aria-invalid="Boolean(errors.username)"
              @input="errors.username = ''"
            />
          </div>
          <p v-if="errors.username" class="rg-field__error">{{ errors.username }}</p>

          <!-- 邮箱 -->
          <div class="rg-field" :class="{ 'is-invalid': errors.email }">
            <el-icon class="rg-field__icon"><Message /></el-icon>
            <input
              ref="emailRef"
              v-model="form.email"
              class="rg-field__input"
              type="email"
              autocomplete="email"
              maxlength="64"
              placeholder="请输入邮箱"
              aria-label="邮箱"
              :aria-invalid="Boolean(errors.email)"
              @input="errors.email = ''"
            />
          </div>
          <p v-if="errors.email" class="rg-field__error">{{ errors.email }}</p>

          <div class="rg-field" :class="{ 'is-invalid': errors.phone }">
            <el-icon class="rg-field__icon"><Phone /></el-icon>
            <input
              ref="phoneRef"
              v-model="form.phone"
              class="rg-field__input"
              type="tel"
              inputmode="numeric"
              autocomplete="tel"
              maxlength="11"
              placeholder="请输入 11 位手机号"
              aria-label="电话号码"
              :aria-invalid="Boolean(errors.phone)"
              @input="errors.phone = ''"
            />
          </div>
          <p v-if="errors.phone" class="rg-field__error">{{ errors.phone }}</p>

          <!-- 密码 -->
          <div class="rg-field" :class="{ 'is-invalid': errors.password }">
            <el-icon class="rg-field__icon"><Lock /></el-icon>
            <input
              ref="passwordRef"
              v-model="form.password"
              class="rg-field__input"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              maxlength="32"
              placeholder="请设置密码（至少 6 位）"
              aria-label="密码"
              :aria-invalid="Boolean(errors.password)"
              @input="errors.password = ''"
            />
            <button
              type="button"
              class="rg-field__toggle"
              :aria-label="showPassword ? '隐藏密码' : '显示密码'"
              @click="showPassword = !showPassword"
            >
              <el-icon>
                <component :is="showPassword ? Hide : View" />
              </el-icon>
            </button>
          </div>
          <p v-if="errors.password" class="rg-field__error">{{ errors.password }}</p>

          <div class="rg-field" :class="{ 'is-invalid': errors.confirm }">
            <el-icon class="rg-field__icon"><Key /></el-icon>
            <input
              ref="confirmRef"
              v-model="form.confirm"
              class="rg-field__input"
              :type="showConfirm ? 'text' : 'password'"
              autocomplete="new-password"
              maxlength="32"
              placeholder="请再次输入密码"
              aria-label="再次确认密码"
              :aria-invalid="Boolean(errors.confirm)"
              @input="errors.confirm = ''"
            />
            <button
              type="button"
              class="rg-field__toggle"
              :aria-label="showConfirm ? '隐藏确认密码' : '显示确认密码'"
              @click="showConfirm = !showConfirm"
            >
              <el-icon>
                <component :is="showConfirm ? Hide : View" />
              </el-icon>
            </button>
          </div>
          <p v-if="errors.confirm" class="rg-field__error">{{ errors.confirm }}</p>

          <p v-if="errors.form" class="rg-form__error" role="alert">{{ errors.form }}</p>

          <button
            type="submit"
            class="rg-submit"
            :class="{ 'is-loading': loading }"
            :disabled="loading"
          >
            <span v-if="loading" class="rg-submit__spinner" aria-hidden="true"></span>
            <span>{{ loading ? '注册中' : '完成注册' }}</span>
          </button>

          <p class="rg-form__hint">
            已有账号？
            <RouterLink class="rg-form__link" :to="{ name: 'login' }">返回登录</RouterLink>
          </p>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Hide, Key, Lock, Message, Phone, User, View } from '@element-plus/icons-vue'
import AuthArt from '@/components/AuthArt.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

/** 表单数据 */
const form = reactive({
  username: '',
  email: '',
  phone: '',
  password: '',
  confirm: ''
})

const errors = reactive({
  username: '',
  email: '',
  phone: '',
  password: '',
  confirm: '',
  form: ''
})

const loading = ref(false)

const showPassword = ref(false)
const showConfirm = ref(false)

const usernameRef = ref(null)
const emailRef = ref(null)
const phoneRef = ref(null)
const passwordRef = ref(null)
const confirmRef = ref(null)

const fieldRefs = {
  username: usernameRef,
  email: emailRef,
  phone: phoneRef,
  password: passwordRef,
  confirm: confirmRef,
  form: confirmRef
}

onMounted(() => {
  usernameRef.value?.focus()
})

const USERNAME_RE = /^[A-Za-z][A-Za-z0-9_]{2,19}$/

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

const PHONE_RE = /^1[3-9]\d{9}$/

function validate() {
  const username = form.username.trim()
  const email = form.email.trim()
  const phone = form.phone.replace(/[\s-]/g, '')
  const password = form.password

  errors.username = !username
    ? '请输入账号 ID'
    : USERNAME_RE.test(username)
      ? ''
      : '账号 ID 需 3-20 位，字母开头，可含数字和下划线'

  errors.email = !email ? '请输入邮箱' : EMAIL_RE.test(email) ? '' : '邮箱格式不正确'

  errors.phone = !phone ? '请输入电话号码' : PHONE_RE.test(phone) ? '' : '请输入 11 位手机号'

  errors.password = !password
    ? '请设置密码'
    : password.length < 6
      ? '密码至少 6 位'
      : password.length > 32
        ? '密码最多 32 位'
        : ''

  errors.confirm = !form.confirm
    ? '请再次输入密码'
    : form.confirm !== password
      ? '两次输入的密码不一致'
      : ''

  return !errors.username && !errors.email && !errors.phone && !errors.password && !errors.confirm
}

function focusFirstError() {
  const first = ['username', 'email', 'phone', 'password', 'confirm'].find((field) => errors[field])
  if (first) fieldRefs[first].value?.focus()
}

async function handleSubmit() {
  if (loading.value) return

  errors.form = ''
  if (!validate()) {
    focusFirstError()
    return
  }

  loading.value = true
  try {
    await new Promise((resolve) => setTimeout(resolve, 320))

    const result = authStore.register({
      username: form.username.trim(),
      email: form.email.trim(),
      phone: form.phone.replace(/[\s-]/g, ''),
      password: form.password
    })

    if (!result.ok) {
      if (result.field && result.field in fieldRefs) {
        errors[result.field] = result.message
        if (result.field !== 'form') fieldRefs[result.field].value?.focus()
      } else {
        errors.form = result.message || '注册失败，请稍后重试'
      }
      return
    }

    await router.replace({
      name: 'login',
      query: { registered: '1', username: form.username.trim() }
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.rg-page {
  --rg-bg: #0a0b10;
  --rg-card: #101219;
  --rg-border: #23262f;
  --rg-text: #eef1f8;
  --rg-text-2: #98a1b2;
  --rg-text-3: #5c6472;
  --rg-accent: #3b82f6;
  --rg-accent-line: rgba(96, 165, 250, 0.5);
  --rg-danger: #f87171;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40px 24px;
  color: var(--rg-text);
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background:
    radial-gradient(55% 45% at 8% 0%, rgba(99, 102, 241, 0.22), transparent 62%),
    radial-gradient(50% 45% at 95% 100%, rgba(59, 130, 246, 0.14), transparent 60%), var(--rg-bg);
  -webkit-font-smoothing: antialiased;
}

.rg-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: min(1120px, 92vw);
  min-height: 640px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 20px;
  background: var(--rg-card);
  box-shadow:
    0 40px 100px rgba(0, 0, 0, 0.62),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.rg-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
  padding: 42px 54px;
  background: linear-gradient(180deg, #11131a 0%, #0e1016 100%);
}

.rg-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.rg-brand__logo {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 15px;
  color: #fff;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 12px 28px rgba(99, 102, 241, 0.4);
}
.rg-brand__logo svg {
  width: 26px;
  height: 26px;
  display: block;
  fill: currentColor;
}
.rg-brand__title {
  margin-top: 16px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: #f6f8fd;
}
.rg-brand__subtitle {
  margin-top: 8px;
  font-size: 13.5px;
  color: var(--rg-text-2);
}

.rg-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rg-field {
  position: relative;
  display: flex;
  align-items: center;
}
.rg-field__icon {
  position: absolute;
  left: 15px;
  font-size: 15px;
  color: #6a7383;
  pointer-events: none;
}
.rg-field__input {
  width: 100%;
  height: 46px;
  padding: 0 46px 0 44px;
  border: 1px solid var(--rg-border);
  border-radius: 10px;
  background: #0d0f15;
  color: var(--rg-text);
  font-size: 13.5px;
  font-family: inherit;
  outline: none;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}
.rg-field__input::placeholder {
  color: #5c6472;
}
.rg-field__input:focus {
  border-color: var(--rg-accent-line);
  background: #0f1219;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}
.rg-field.is-invalid .rg-field__input {
  border-color: rgba(248, 113, 113, 0.6);
}
.rg-field__toggle {
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
.rg-field__toggle:hover {
  color: #dbe4f2;
}

.rg-field__error {
  margin: -6px 0 0 4px;
  font-size: 12px;
  color: var(--rg-danger);
}
.rg-form__error {
  padding: 9px 12px;
  border: 1px solid rgba(248, 113, 113, 0.35);
  border-radius: 9px;
  background: rgba(248, 113, 113, 0.08);
  font-size: 12.5px;
  line-height: 1.5;
  color: #fca5a5;
}

/* 主按钮 */
.rg-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 48px;
  margin-top: 2px;
  border: 0;
  border-radius: 10px;
  background: linear-gradient(180deg, #3d86f7, #2f6df0);
  color: #fff;
  font-size: 15.5px;
  font-weight: 600;
  font-family: inherit;
  letter-spacing: 0.12em;
  cursor: pointer;
  box-shadow: 0 12px 26px rgba(47, 109, 240, 0.32);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    filter 0.18s ease;
}
.rg-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.07);
  box-shadow: 0 14px 30px rgba(47, 109, 240, 0.42);
}
.rg-submit:active:not(:disabled) {
  transform: translateY(0);
  filter: brightness(0.98);
}
.rg-submit:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.rg-submit__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #fff;
  border-radius: 50%;
  animation: rg-spin 0.7s linear infinite;
}
@keyframes rg-spin {
  to {
    transform: rotate(360deg);
  }
}

.rg-form__hint {
  margin-top: 2px;
  font-size: 12.5px;
  line-height: 1.6;
  text-align: center;
  color: var(--rg-text-3);
}
.rg-form__link {
  color: #60a5fa;
  font-size: 13px;
  font-weight: 500;
  border-radius: 4px;
  transition: color 0.16s ease;
}
.rg-form__link:hover {
  color: #93c5fd;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.rg-form__link:focus-visible {
  outline: 2px solid rgba(96, 165, 250, 0.6);
  outline-offset: 3px;
}

@media (max-width: 900px) {
  .rg-card {
    grid-template-columns: 1fr;
    width: min(460px, 92vw);
    min-height: 0;
  }
  .rg-panel {
    padding: 34px 28px 30px;
    gap: 20px;
  }
  .rg-brand__title {
    font-size: 21px;
  }
}

@media (max-width: 420px) {
  .rg-page {
    padding: 20px 14px;
  }
  .rg-panel {
    padding: 28px 20px 26px;
  }
  .rg-field__input {
    font-size: 13px;
  }
}
</style>
