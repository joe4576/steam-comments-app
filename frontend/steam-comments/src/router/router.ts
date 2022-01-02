import Vue from "vue";
import VueRouter, { Route, RouteConfig } from "vue-router";
import App from "@/App.vue";
import { toRef } from "@vue/composition-api";
import Search from "@/components/pages/Search.vue";

Vue.use(VueRouter);

const routes: RouteConfig[] = [
  {
    path: "/",
    component: App,
    name: "home",
    redirect: "/search",
  },
  {
    path: "/search",
    component: Search,
    name: "search",
  },
];

const router = new VueRouter({ routes, mode: "history" });

export default router;

export const useRouter = () => {
  return {
    router,
    route: toRef(router, "currentRoute"),
  };
};
