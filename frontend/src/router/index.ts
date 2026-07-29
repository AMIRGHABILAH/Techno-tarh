

// // src/router/index.js
// import { createRouter, createWebHistory } from "vue-router"
// import { useAuthStore } from "../stores/auth"

// const LandingPage = () => import("../views/Landing/LandingPage.vue")
// const LoginPage = () => import("../views/Login/LoginRegister.vue")

// const DashboardHome = () => import("../views/Dashboard/home/DashboardHome.vue")
// const DesignsManager = () => import("../views/Dashboard/designs/DesignsManager.vue")
// const BusinessCardEditor = () => import("../views/Dashboard/designs/editor/BusinessCardEditor.vue")
// const TemplatesPage = () => import("../views/Dashboard/templates/TemplatesPage.vue")
// const SettingsPage = () => import("../views/Dashboard/settings/Settings.vue")

// const router = createRouter({
//   history: createWebHistory(),
//   routes: [
//     {
//       path: "/",
//       name: "landing",
//       component: LandingPage
//     },
//     {
//       path: "/login",
//       name: "login",
//       component: LoginPage
//     },
//     {
//       path: "/dashboard",
//       name: "dashboard",
//       component: DashboardHome,
//       meta: { requiresAuth: true }
//     },
//     {
//       path: "/designs",
//       name: "designs",
//       component: DesignsManager,
//       meta: { requiresAuth: true }
//     },
//     {
//       path: "/editor/:id?",
//       name: "editor",
//       component: BusinessCardEditor,
//       meta: { requiresAuth: true }
//     },
//     {
//       path: "/templates",
//       name: "templates",
//       component: TemplatesPage,
//       meta: { requiresAuth: true }
//     },
//     {
//       path: "/settings",
//       name: "settings",
//       component: SettingsPage,
//       meta: { requiresAuth: true }
//     }
    
//   ]
// })

// router.beforeEach((to, from, next) => {
//   const auth = useAuthStore()

//   if (to.meta.requiresAuth && !auth.isAuthenticated) {
//     next("/login")
//   } 
//   else if (to.path === "/login" && auth.isAuthenticated) {
//     next("/dashboard")
//   } 
//   else {
//     next()
//   }
// })

// export default router


import { createRouter, createWebHistory } from "vue-router"
import { useAuthStore } from "../stores/auth"

const LandingPage = () => import("../views/Landing/LandingPage.vue")
const LoginPage = () => import("../views/Login/LoginRegister.vue")

const DashboardHome = () => import("../views/Dashboard/home/DashboardHome.vue")
const DesignsManager = () => import("../views/Dashboard/designs/DesignsManager.vue")
const BusinessCardEditor = () => import("../views/Dashboard/designs/editor/BusinessCardEditor.vue")
const TemplatesPage = () => import("../views/Dashboard/templates/TemplatesPage.vue")
const SettingsPage = () => import("../views/Dashboard/settings/Settings.vue")

// صفحات مالی جدید
const TransactionList = () => import("../views/Dashboard/finance/TransactionList/TransactionList.vue")
const TopUp = () => import("../views/Dashboard/finance/TopUp/TopUp.vue")

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "landing",
      component: LandingPage
    },
    {
      path: "/login",
      name: "login",
      component: LoginPage
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: DashboardHome,
      meta: { requiresAuth: true }
    },
    {
      path: "/designs",
      name: "designs",
      component: DesignsManager,
      meta: { requiresAuth: true }
    },
    {
      path: "/editor/:id?",
      name: "editor",
      component: BusinessCardEditor,
      meta: { requiresAuth: true }
    },
    {
      path: "/templates",
      name: "templates",
      component: TemplatesPage,
      meta: { requiresAuth: true }
    },
    {
      path: "/settings",
      name: "settings",
      component: SettingsPage,
      meta: { requiresAuth: true }
    },

    // -------------------------
    // صفحات مالی (جدید)
    // -------------------------
    {
      path: "/finance/transactions",
      name: "transactions",
      component: TransactionList,
      meta: { requiresAuth: true }
    },
    {
      path: "/finance/topup",
      name: "topup",
      component: TopUp,
      meta: { requiresAuth: true }
    },
    {
  path: "/editor/finalize",
  name: "FinalizeDesign",
  component: () => import("../views/Dashboard/designs/editor/FinalizeDesign/FinalizeDesign.vue")
}

  ]
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next("/login")
  } 
  else if (to.path === "/login" && auth.isAuthenticated) {
    next("/dashboard")
  } 
  else {
    next()
  }
})

export default router
