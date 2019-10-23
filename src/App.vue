<template>
  <div id="app">
    
    <Editor />
  </div>
</template>

<script>

import Editor from './components/Editor'

export default {
  name: "App",
  components: {
    Editor
  }
};
</script>

<style>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
