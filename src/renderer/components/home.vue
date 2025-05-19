<template>
  <div id="home">
    <div class="logo">
      <div class="logo-img">
        <img src="../assets/img/logo.png" alt="" draggable="false">
      </div>
      <div class="logo-text">
        <p>██████╗ ██████╗ ███████╗      ████████╗ ██████╗  ██████╗ ██╗     </p>
        <p>██╔══██╗██╔══██╗██╔════╝      ╚══██╔══╝██╔═══██╗██╔═══██╗██║     </p>
        <p>██████╔╝██║  ██║█████╗  █████╗   ██║   ██║   ██║██║   ██║██║     </p>
        <p>██╔═══╝ ██║  ██║██╔══╝  ╚════╝   ██║   ██║   ██║██║   ██║██║     </p>
        <p>██║     ██████╔╝██║              ██║   ╚██████╔╝╚██████╔╝███████╗</p>
        <p>╚═╝     ╚═════╝ ╚═╝              ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝</p>                    
      </div>
    </div>
    <div class="main">
      <!-- 添加功能页面入口按钮 -->
      <div class="square-btn" @click="onChangePannel('watermark')">PDF加水印</div>
      <div class="square-btn" @click="onChangePannel('pdf2jpg')">PDF转JPG</div>
    </div>
  </div>
</template>
<script>
import { mapState, mapGetters, mapActions } from 'vuex'
export default {
  name: "home",
  data() {
    return {}
  },
  computed: {
  },
  methods: {
    ...mapActions('pdf', [
      'pdfSetState'
    ]),
    onChangePannel(type) {
      this.pdfSetState({ pannel: type })
    }
  }
};
</script>
<style lang="scss" scoped>
#home {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 100%;

  .logo {
    display: flex;
    align-items: flex-start;
    justify-content: center;

    .logo-img {
      height: 74px;

      >img {
        height: 100%;
        filter: drop-shadow(5px 5px 0px #777); // 调整阴影颜色
      }
    }

    .logo-text {
      text-align: center;
      margin-left: 20px;
      user-select: none;

      >p {
        font-size: 12px;
        white-space: pre-wrap;
        color: #777; // 加深文字颜色以提高可读性
        height: 14px;
      }
    }
  }

  .main {
    display: flex;
    justify-content: center;
    margin: 50px auto;

    .square-btn {
      position: relative;
      width: 100px; 
      height: 40px; 
      line-height: 40px; 
      text-align: center; 
      margin: 0 10px; 
      border: solid 1px #777; // 按钮边框设为蓝色
      border-radius: 3px; 
      background: #fff; // 按钮背景设为蓝色
      color: #777; // 按钮文字设为白色
      cursor: pointer; 
      font-size: 16px;
      box-shadow: 1px 1px 5px #777;

      &::before{
        content: '';
        position: absolute;
        top: 8px;
        left: 8px;
        width: 100%;
        height: 100%;
        border-radius: 3px; 
        border: double 3px #777; // 伪元素边框设为浅蓝色
        box-sizing: border-box;
        z-index: -1;
      }

      &:hover {
        background: #777; // 鼠标悬停时加深按钮颜色
        color: #fff; // 鼠标悬停时加深文字颜色
      }
    }
  }
}
</style>
