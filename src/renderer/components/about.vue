<template>
  <div id="about" v-if="showPannel">
    <popup title="PDF-Tool" @closePannel="onClosePannel">
      <div class="content-text">
        <p>版本号: v0.0.7</p>
      </div>
    </popup>
  </div>
</template>

<script>
import { ipcRenderer, shell } from "electron";
import popup from "@/components/popup";
export default {
  data() {
    return {
      showPannel: false
    }
  },
  components: {
    popup
  },
  methods: {
    onClosePannel() {
      this.showPannel = false
    },
    openInBrowser(url) {
      shell.openExternal(url);
    }
  },
  created() {
    ipcRenderer.on('show-about', (e) => {
      this.showPannel = true
    })
  }
}
</script>

<style lang="scss" scoped>
#about {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.content-text {
  text-align: center;
  margin-top: 10px;

  &:first-child {
    margin-top: 0;
  }

  p {
    font-size: 14px;
    color: #333;

    &.text-btn {

      >span {
        color: #333;
        cursor: pointer;
        text-decoration: underline;
      }
    }
  }
}
</style>
