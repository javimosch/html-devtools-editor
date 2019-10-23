import Vue from "vue";
import App from "./App.vue";

import "./styles/main.scss";

import VueCodemirror from "vue-codemirror";
import "codemirror/lib/codemirror.css";
Vue.use(
  VueCodemirror /* { 
  options: { theme: 'base16-dark', ... },
  events: ['scroll', ...]
} */
);

Vue.config.productionTip = false;

new Vue({
  render: h => h(App)
}).$mount("#app");
