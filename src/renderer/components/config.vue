<template>
  <div id="output-folder-settings" v-if="showPannel">
    <popup title="输出目录设置" @closePannel="onClosePannel">
      <div class="content">
        <el-form :model="form" label-width="100px">
          <el-form-item label="输出目录">
            <el-input v-model="form.outputFolder" readonly>
              <el-button slot="append" @click="selectFolder">选择目录</el-button>
            </el-input>
          </el-form-item>
        </el-form>
      </div>
    </popup>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import popup from "@/components/popup";

export default {
  data() {
    return {
      showPannel: false,
      form: {
        outputFolder: ''
      }
    }
  },
  components: {
    popup
  },
  methods: {
    onClosePannel() {
      this.showPannel = false
    },
    selectFolder() {
      ipcRenderer.send('show-save-dialog', {
        properties: ['openDirectory']
      });
      ipcRenderer.once('save-dialog-result', (event, result) => {
        if (result) {
          this.form.outputFolder = result[0];
          // 保存配置
          ipcRenderer.send('save-config', {
            outputFolder: this.form.outputFolder
          });
        }
      });
    }
  },
  created() {
    // 监听显示设置面板事件
    ipcRenderer.on('show-output-folder-settings', () => {
      this.showPannel = true;
    });

    // 获取已保存的配置
    ipcRenderer.send('get-config');
    ipcRenderer.on('get-config', (event, res) => {
      if (res && res.outputFolder) {
        this.form.outputFolder = res.outputFolder;
      }
    });
  },
  beforeDestroy() {
    ipcRenderer.removeAllListeners('show-output-folder-settings');
    ipcRenderer.removeAllListeners('save-dialog-result');
  }
}
</script>

<style lang="scss" scoped>
#output-folder-settings {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.content {
  padding: 20px;
}
</style> 