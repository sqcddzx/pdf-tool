<template>
  <div id="output-folder-settings" v-if="showPannel">
    <popup title="基础配置" @closePannel="onClosePannel">
      <div class="content">
        <el-form :model="form" label-width="100px">

          <el-form-item label="输出目录">
            <el-input v-model="form.outputFolder" readonly>
              <el-button slot="append" @click="selectFolder">选择目录</el-button>
            </el-input>
          </el-form-item>

          <el-form-item label="并发数量">
            <el-input-number v-model="form.concurrency"  :min="1"  :max="10"  label="并发数量" @change="changeConcurrency()"
            ></el-input-number>
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
        outputFolder: '',
        // 初始化并发量，默认值设为 1
        concurrency: 1 
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
          
          ipcRenderer.send('save-config', {
            outputFolder: this.form.outputFolder
          });
        }
      });
    },
    changeConcurrency() {
      ipcRenderer.send('save-config', {
        concurrency: this.form.concurrency
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
      if (res) {
        if (res.outputFolder) {
          this.form.outputFolder = res.outputFolder;
        }
        // 获取并发量配置
        if (res.concurrency) {
          this.form.concurrency = res.concurrency;
        }
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