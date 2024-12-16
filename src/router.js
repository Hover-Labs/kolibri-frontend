import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';

//  Vue.use(VueRouter)

import Index from '@/pages/Index.vue';
import Docs from "@/pages/Docs.vue";
import AllOvens from "@/pages/AllOvens.vue";
import NotFound from "@/pages/NotFound.vue";
import TOS from "@/pages/TOS.vue";
import PrivacyPolicy from "@/pages/PrivacyPolicy.vue";
import SigningTool from "@/pages/SigningTool.vue";
import LiquidityPool from "@/pages/LiquidityPool.vue";
import Farming from "@/pages/Farming.vue";
import SavingsRate from "@/pages/SavingsRate.vue";

const routes = [
    {
        path: '/',
        name: 'Index',
        component: Index
    },
    {
        path: '/project-info',
        name: 'ProjectInfoRoot',
        redirect: {name: 'DocsRoot'},
    },
    {
        path: '/project-info/:folder/:page',
        name: 'ProjectInfo',
        redirect: {name: 'Docs'},
    },
    {
        path: '/docs',
        name: 'DocsRoot',
        component: Docs,
    },
    {
        path: '/docs/:folder?/:page?',
        name: 'Docs',
        component: Docs,
    },
    {
        path: '/all-ovens',
        name: 'AllOvens',
        component: AllOvens
    },
    {
        path: '/terms-of-service',
        name: 'TOS',
        component: TOS
    },
    {
        path: '/privacy-policy',
        name: 'PrivacyPolicy',
        component: PrivacyPolicy
    },
    {
        path: '/signing-tool',
        name: 'SigningTool',
        component: SigningTool
    },
    {
        path: '/liquidity-pool',
        name: 'LiquidityPool',
        component: LiquidityPool
    },
    {
        path: '/savings-rate',
        name: 'SavingsRate',
        component: SavingsRate
    },
    {
        path: '/farming',
        name: 'Farming',
        component: Farming
    },
    {
        path: '/:catchAll(.*)',
        name: 'NotFound',
        component: NotFound
    }
]

const isIPFS = window.location.host.indexOf('k51qzi5uqu5dlgtiu5vs75r2cfim0qn9rezu804nrw6x38h85kh8q8c4ake3vn') !== -1 ||
               window.location.host === 'kusd.tez.page'
const isFileProtocol = window.location.protocol === 'file:'

const router = createRouter({
    history: (isIPFS || isFileProtocol) ? createWebHashHistory() : createWebHistory(),
    linkActiveClass: 'is-active',
    routes
})

// const app = createApp({})
// app.use(router)
// app.mount('#app')

export default router;