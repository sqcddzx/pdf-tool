<template>
  <div id="vessel">
    <home v-if="pannel == 'home'" ref="home"></home>
    <watermark v-if="pannel == 'watermark'" ref="watermark"></watermark>
    <pdf2jpg v-if="pannel == 'pdf2jpg'" ref="pdf2jpg"></pdf2jpg>
    <about></about>
    <config></config>
  </div>
</template>
<script>
import { ipcRenderer } from "electron";
import { MessageBox } from 'element-ui';
import { mapState, mapActions } from "vuex";
import home from "@/components/home";
import watermark from "@/components/watermark";
import pdf2jpg from "@/components/pdf2jpg";
import about from "@/components/about";
import config from "@/components/config";

export default {
  name: "index",
  data() {
    return {};
  },
  components: {
    home,
    watermark,
    pdf2jpg,
    about,
    config
  },
  computed: {
    ...mapState('pdf', [
      'pannel'
     ])
  },
  methods: {
    ...mapActions('pdf', [
      'pdfSetState' 
    ]),
    checkIsOver(){
      let isOver = true;

      if(this.$refs.watermark){
        isOver = this.$refs.watermark.files.every(file => file.status === 'completed')
      }

      if(this.$refs.pdf2jpg){
        isOver = this.$refs.pdf2jpg.files.every(file => file.status === 'completed') 
      }

      return isOver
    }
  },
  created() {
    ipcRenderer.on("close-all", async (e, args) => {
      if (this.checkIsOver()) {
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

    // 监听显示设置面板事件
    ipcRenderer.on('set-pannel', (e, args) => {
      let { pannel } = args;

      if (this.checkIsOver()) {
        this.pdfSetState({ pannel: pannel })
      } else {
        MessageBox.confirm('队列未处理完或有失败未处理，是否返回首页？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.pdfSetState({ pannel: pannel })
        }).catch(() => {});
      }
    });
  }
};
</script>
<style lang="scss" scoped>
#vessel {
  // background: #292929;
}
</style>
