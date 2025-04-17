<template>
  <div id="vessel">
    <home ref="home"></home>
    <about></about>
    <config></config>
  </div>
</template>
<script>
import { ipcRenderer } from "electron";
import home from "@/components/home";
import about from "@/components/about";
import config from "@/components/config";
import { MessageBox } from 'element-ui';

export default {
  name: "index",
  data() {
    return {};
  },
  components: {
    home,
    about,
    config
  },
  computed: {
  },
  methods: {
  },
  created() {
    ipcRenderer.on("close-all", async (e, args) => {
      let isOver = this.$refs.home.files.every(file => file.status === 'completed')
      if (isOver) {
        ipcRenderer.send("win-close");
      } else {
        MessageBox.confirm('队列未处理完或有失败未处理，确认退出程序？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          ipcRenderer.send("win-close");
        }).catch(() => {});
      }
    })
  }
};
</script>
<style lang="scss" scoped>
#vessel {
  background: #292929;
}
</style>
