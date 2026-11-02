import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '@/pages/login.vue'
import RegisterPage from '@/pages/register.vue'
import Work from '@/pages/work.vue'
import MyProjects from '@/pages/my project.vue'
import NotFound from '@/pages/404.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      /**
       * 首页就是登录页：path 用 '/'，'/login' 作为别名。
       * 这样打开站点根地址直接渲染登录页（没有 redirect 造成的中途闪跳），
       * 同时 '/login' 依然可以访问、也方便代码里按名字跳转。
       */
      path: '/',
      name: 'login',
      component: LoginPage,
      alias: ['/login'],
      meta: { title: '登录', guestOnly: true }
    },
    {
      /**
       * 注册页：和登录页一样只对未登录用户开放。
       * 注册成功后页面自己 router.replace 回登录页，并带上账号 ID 预填。
       */
      path: '/register',
      name: 'register',
      component: RegisterPage,
      meta: { title: '注册账号', guestOnly: true }
    },
    {
      /**
       * 工作台：需要登录才能进。
       * 项目数据本身仍然是纯前端（localStorage），这里只控制「界面可见性」。
       */
      path: '/work',
      name: 'work',
      component: Work,
      meta: { title: '工作台', requiresAuth: true }
    },
    {
      /**
       * 我的项目：工作台左侧「我的项目」点进来就是这里。
       * 同一个 localStorage 数据源的另一种展示：搜索、排序、网格/列表切换。
       * 同样需要登录，未登录会被上面的守卫送回登录页。
       */
      path: '/projects',
      name: 'projects',
      component: MyProjects,
      meta: { title: '我的项目', requiresAuth: true }
    },
    {
      // 兜底 404，保持公开访问，避免未登录时连「页面不存在」都看不到
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFound,
      meta: { title: '页面走丢了' }
    }
  ]
})

/**
 * 全局前置守卫：登录拦截 + 已登录时跳过登录页。
 * 注意 useAuthStore() 必须放在守卫函数内部调用——那时 Pinia 已经由 main.js
 * 安装完毕；在模块顶层调用会因为 Pinia 还没挂载而报错。
 */
router.beforeEach((to) => {
  const auth = useAuthStore()

  // 需要登录但没登录：带上原始地址，登录成功后能回到这里
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // 已经登录还去登录页：直接进工作台，避免出现「登录成功却停在登录页」
  if (to.meta.guestOnly && auth.isLoggedIn) {
    return { name: 'work' }
  }

  return true
})

/** 全局后置钩子：顺手维护浏览器标签标题 */
router.afterEach((to) => {
  const base = 'Vibe Coding 游戏平台'
  document.title = to.meta.title ? `${to.meta.title} · ${base}` : base
})

export default router
