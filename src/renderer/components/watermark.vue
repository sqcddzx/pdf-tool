<template>
  <div id="watermark">
    <div class="container">
      <!-- 左侧水印管理区域 -->
      <div class="watermark-panel">
        <div class="watermark-header">
          <h3>水印管理</h3>
          <div class="upload-btn">
            <input type="file" id="watermark-upload" accept=".pdf" @change="handleWatermarkUpload"
              style="display: none">
            <label for="watermark-upload" class="upload-label">
              上传PDF水印
            </label>
          </div>
        </div>

        <div class="watermark-list">
          <div v-for="(item, index) in watermarks" :key="index" class="watermark-item"
            :class="{ active: activeMd5 === item.md5 }" @click="selectWatermark(item.md5)">
            <!-- <div class="watermark-preview">
              <img :src="watermark.preview" alt="水印预览">
            </div> -->
            <div class="watermark-info">
              <div class="watermark-name">{{ item.name }}</div>
              <button class="delete-btn" @click.stop="deleteWatermark(item.md5)">
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧文件处理区域 -->
      <div class="file-panel">
        <div class="file-list">
          <div class="progress-bar">
            <div class="progress" :style="{ width: totalProgress + '%' }"></div>
            <span class="progress-text">{{ totalProgress }}%</span>
          </div>

          <div class="file-item" v-for="(file, index) in files" :key="index">
            <div class="file-icon">
              <i class="el-icon-document"></i>
            </div>
            <div class="file-info">
              <div class="file-name">{{ file.name }}</div>
              <div class="file-status" :class="file.status">
                {{ getStatusText(file.status) }}
              </div>
              <div class="file-msg" v-if="file.msg" :class="{ expanded: file.isExpanded }"
                @click="toggleMessage(index)">
                {{ file.msg }}
              </div>
            </div>
            <div class="file-actions" v-if="file.status === 'completed'">
              <button class="open-folder-btn" @click="openFolder(file)">
                打开文件夹
              </button>
            </div>
          </div>
        </div>

        <div class="drop-zone" @dragover.prevent @drop.prevent="handleDrop">
          <div class="drop-text">将PDF文件拖到此处加水印</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import { MessageBox, Message } from 'element-ui';
import path from 'path';

export default {
  name: "home",
  data() {
    return {
      isDragging: false,
      files: [],
      watermarks: [],
      activeMd5: null,
      outputFolder: ''
    }
  },
  computed: {
    totalProgress() {
      if (this.files.length === 0) return 0;
      const completed = this.files.filter(f => f.status === 'completed').length;
      return Math.round((completed / this.files.length) * 100);
    }
  },
  methods: {
    handleWatermarkUpload(e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        // 发送文件到主进程
        ipcRenderer.send('upload-watermark', {
          file: {
            name: file.name,
            path: file.path
          }
        });
      };
      reader.readAsDataURL(file);

      // 清空input的值，允许重复选择同一个文件
      e.target.value = '';
    },
    deleteWatermark(md5) {
      MessageBox.confirm('确定要删除这个水印文件吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        let watermark = this.watermarks.find(item => item.md5 === md5);
        ipcRenderer.send('delete-watermark', watermark);
      }).catch(() => {
        // 用户点击取消，不做任何操作
      });
    },
    selectWatermark(md5) {
      this.activeMd5 = md5;
    },
    handleDrop(e) {
      if (this.activeMd5 === null) {
        Message.warning('请先选择水印文件');
        return;
      }

      const droppedFiles = Array.from(e.dataTransfer.files);
      const newFiles = droppedFiles.map(file => ({
        id: Date.now() + Math.random().toString(36).substr(2, 9), // 生成唯一ID
        name: file.name,
        path: file.path,
        status: 'pending'
      }));
      this.files = [...this.files, ...newFiles];

      ipcRenderer.send("add-watermark", {
        files: newFiles,
        watermark: this.watermarks.find(item => item.md5 === this.activeMd5)
      });
    },
    getStatusText(status) {
      const statusMap = {
        'pending': '等待处理',
        'processing': '处理中',
        'completed': '已完成',
        'error': '处理失败'
      };
      return statusMap[status] || '未知状态';
    },
    toggleMessage(index) {
      this.$set(this.files[index], 'isExpanded', !this.files[index].isExpanded);
    },
    openFolder(file) {
      if (!this.outputFolder) {
        Message.warning('请先设置输出目录');
        return;
      }
      // 获取输出文件的路径
      const outputPath = path.join(this.outputFolder, path.basename(file.path));
      ipcRenderer.send('open-folder', outputPath);
    }
  },
  mounted() {
    // 获取已保存的水印文件
    ipcRenderer.send('get-config');
    ipcRenderer.on('get-config', (event, res) => {
      if (res) {
        if (res.watermark) {
          this.watermarks = res.watermark.map(item => {
            // 使用FileReader读取本地文件
            const reader = new FileReader();
            reader.onload = (e) => {
              const index = this.watermarks.findIndex(w => w.path === item.path);
              if (index !== -1) {
                this.$set(this.watermarks, index, {
                  ...this.watermarks[index],
                  preview: e.target.result
                });
              }
            };
            // 使用fetch读取文件
            fetch(`file://${item.path}`)
              .then(response => response.blob())
              .then(blob => reader.readAsDataURL(blob));
              
            return {
              ...item,
              preview: '' // 初始化为空，等待FileReader加载
            };
          });
        }
        if (res.outputFolder) {
          this.outputFolder = res.outputFolder;
        }
      }
    });

    // 监听水印上传成功事件
    ipcRenderer.on('watermark-upload-success', (event, data) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.watermarks.push({
          md5: data.md5,
          name: data.name,
          path: data.path,
          preview: e.target.result
        });
      };
      // 使用fetch读取文件
      fetch(`file://${data.path}`)
        .then(response => response.blob())
        .then(blob => reader.readAsDataURL(blob));
    });

    // 监听水印删除事件
    ipcRenderer.on('watermark-delete-success', (event, data) => {
      this.watermarks = this.watermarks.filter(item => item.path !== data.path)
      if (this.activeMd5 === data.md5) {
        this.activeMd5 = null;
      }
    });

    ipcRenderer.on('file-status-update', (event, { id, status, msg }) => {
      const fileIndex = this.files.findIndex(f => f.id === id);
      if (fileIndex !== -1) {
        this.$set(this.files, fileIndex, { ...this.files[fileIndex], status, msg });
      }
    });
  },
  beforeDestroy() {
    ipcRenderer.removeAllListeners('get-config');
    ipcRenderer.removeAllListeners('watermark-upload-success');
    ipcRenderer.removeAllListeners('watermark-delete-success');
    ipcRenderer.removeAllListeners('file-status-update');
  }
};
</script>

<style lang="scss" scoped>
#watermark {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;

  /* 自定义滚动条样式 */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #f5f5f5;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: #c0c4cc;
    border-radius: 4px;
    transition: all 0.3s ease;

    &:hover {
      background: #909399;
    }
  }

  .container {
    display: flex;
    width: 100%;
    height: 100%;
    gap: 20px;
    border-top: solid 1px #efefef;
    box-sizing: border-box;
  }

  .watermark-panel {
    width: 300px;
    background: #fff;
    // border-radius: 8px;
    // box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    padding: 20px;
    display: flex;
    flex-direction: column;

    .watermark-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h3 {
        margin: 0;
        color: #303133;
      }

      .upload-btn {
        .upload-label {
          display: inline-block;
          padding: 8px 16px;
          background-color: #409EFF;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;

          &:hover {
            background-color: #66b1ff;
          }
        }
      }
    }

    .watermark-list {
      flex: 1;
      overflow-y: auto;

      .watermark-item {
        display: flex;
        padding: 10px;
        border: 1px solid #ebeef5;
        border-radius: 4px;
        margin-bottom: 10px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          border-color: #409EFF;
        }

        &.active {
          border-color: #409EFF;
          background-color: #f0f7ff;
        }

        .watermark-preview {
          width: 60px;
          height: 60px;
          margin-right: 10px;
          border: 1px solid #ebeef5;
          border-radius: 4px;
          overflow: hidden;

          img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
        }

        .watermark-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;

          .watermark-name {
            font-size: 14px;
            color: #303133;
          }

          .delete-btn {
            align-self: flex-end;
            background: none;
            border: none;
            color: #F56C6C;
            cursor: pointer;
            padding: 0;
            font-size: 12px;

            &:hover {
              color: #f78989;
            }
          }
        }
      }
    }
  }

  .file-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #fff;
    // border-radius: 8px;
    // box-shadow: inset 0 0 5px 1px #ddd;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    padding: 20px;
    // border-left: solid 1px #efefef;

    .file-list {
      flex: 1;
      overflow-y: auto;
      margin-bottom: 20px;

      .progress-bar {
        height: 20px;
        background: #f5f7fa;
        border-radius: 10px;
        margin-bottom: 20px;
        position: relative;

        .progress {
          height: 100%;
          background: #409EFF;
          border-radius: 10px;
          transition: width 0.3s ease;
        }

        .progress-text {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #fff;
          font-size: 12px;
        }
      }

      .file-item {
        display: flex;
        align-items: center;
        padding: 10px;
        border-bottom: 1px solid #ebeef5;
        position: relative;

        &:last-child {
          border-bottom: none;
        }

        .file-icon {
          margin-right: 15px;
          color: #409EFF;
          font-size: 24px;
        }

        .file-info {
          flex: 1;
          min-width: 0; // 防止内容溢出

          .file-name {
            font-size: 14px;
            color: #303133;
            margin-bottom: 5px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .file-status {
            font-size: 12px;

            &.pending {
              color: #909399;
            }

            &.processing {
              color: #409EFF;
            }

            &.completed {
              color: #67C23A;
            }

            &.error {
              color: #F56C6C;
            }
          }

          .file-msg {
            font-size: 12px;
            color: #909399;
            margin-top: 2px;
            line-height: 1.4;
            max-height: 2.8em; // 两行高度
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            cursor: pointer;
            transition: max-height 0.3s ease;

            &.expanded {
              max-height: none;
              -webkit-line-clamp: unset;
            }
          }
        }

        .file-actions {
          margin-left: 15px;
          flex-shrink: 0;

          .open-folder-btn {
            background: none;
            border: 1px solid #409EFF;
            color: #409EFF;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.3s;

            &:hover {
              background-color: #409EFF;
              color: white;
            }
          }
        }
      }
    }

    .drop-zone {
      height: 200px;
      border: 2px dashed #ccc;
      border-radius: 8px;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #f8f8f8;
      transition: all 0.3s ease;

      &:hover {
        border-color: #409EFF;
        background-color: #f0f7ff;
      }

      .drop-text {
        color: #666;
        font-size: 16px;
      }
    }
  }
}
// #watermark {
//   position: absolute;
//   left: 0;
//   top: 0;
//   width: 100%;
//   height: 100%;
//   display: flex;
//   // background-color: #1a1a1a; // 整体背景改为暗夜黑

//   /* 自定义滚动条样式 */
//   ::-webkit-scrollbar {
//     width: 8px;
//     height: 8px;
//   }

//   ::-webkit-scrollbar-track {
//     background: #2d2d2d; // 滚动条轨道颜色
//     border-radius: 4px;
//   }

//   ::-webkit-scrollbar-thumb {
//     background: #4d4d4d; // 滚动条滑块颜色
//     border-radius: 4px;
//     transition: all 0.3s ease;

//     &:hover {
//       background: #666; // 鼠标悬停时滚动条滑块颜色
//     }
//   }

//   .container {
//     display: flex;
//     width: 100%;
//     height: 100%;
//     gap: 20px;
//     border-top: solid 1px #333; // 边框颜色
//     box-sizing: border-box;
//   }

//   .watermark-panel {
//     width: 300px;
//     background: #2d2d2d; // 水印管理区域背景颜色
//     // border-radius: 8px;
//     // box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
//     padding: 20px;
//     display: flex;
//     flex-direction: column;

//     .watermark-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       margin-bottom: 20px;

//       h3 {
//         margin: 0;
//         color: #ffffff; // 标题颜色
//       }

//       .upload-btn {
//         .upload-label {
//           display: inline-block;
//           padding: 8px 16px;
//           background-color: #409EFF;
//           color: white;
//           border-radius: 4px;
//           cursor: pointer;
//           transition: background-color 0.3s;

//           &:hover {
//             background-color: #66b1ff;
//           }
//         }
//       }
//     }

//     .watermark-list {
//       flex: 1;
//       overflow-y: auto;

//       .watermark-item {
//         display: flex;
//         padding: 10px;
//         background: #444;
//         border: 1px solid #555; // 边框颜色
//         border-radius: 4px;
//         margin-bottom: 10px;
//         cursor: pointer;
//         transition: all 0.3s;

//         &:hover {
//           border-color: #ddd;
//         }

//         &.active {
//           border-color: #ddd;
//           background-color: #3a3a3a; // 激活状态背景颜色
//         }

//         .watermark-preview {
//           width: 60px;
//           height: 60px;
//           margin-right: 10px;
//           border: 1px solid #333;
//           border-radius: 4px;
//           overflow: hidden;

//           img {
//             width: 100%;
//             height: 100%;
//             object-fit: contain;
//           }
//         }

//         .watermark-info {
//           flex: 1;
//           display: flex;
//           flex-direction: column;
//           justify-content: space-between;

//           .watermark-name {
//             font-size: 14px;
//             color: #ffffff;
//           }

//           .delete-btn {
//             align-self: flex-end;
//             background: none;
//             border: none;
//             color: #F56C6C;
//             cursor: pointer;
//             padding: 0;
//             font-size: 12px;

//             &:hover {
//               color: #f78989;
//             }
//           }
//         }
//       }
//     }
//   }

//   .file-panel {
//     flex: 1;
//     display: flex;
//     flex-direction: column;
//     background: #2d2d2d; // 文件处理区域背景颜色
//     // border-radius: 8px;
//     // box-shadow: inset 0 0 5px 1px #ddd;
//     box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3); // 阴影颜色加深
//     padding: 20px;
//     // border-left: solid 1px #efefef;

//     .file-list {
//       flex: 1;
//       overflow-y: auto;
//       margin-bottom: 20px;

//       .progress-bar {
//         height: 20px;
//         background: #3a3a3a; // 进度条背景颜色
//         border-radius: 10px;
//         margin-bottom: 20px;
//         position: relative;

//         .progress {
//           height: 100%;
//           background: #409EFF;
//           border-radius: 10px;
//           transition: width 0.3s ease;
//         }

//         .progress-text {
//           position: absolute;
//           right: 10px;
//           top: 50%;
//           transform: translateY(-50%);
//           color: #fff;
//           font-size: 12px;
//         }
//       }

//       .file-item {
//         display: flex;
//         align-items: center;
//         padding: 10px;
//         border-bottom: 1px solid #333; // 边框颜色
//         position: relative;

//         &:last-child {
//           border-bottom: none;
//         }

//         .file-icon {
//           margin-right: 15px;
//           color: #409EFF;
//           font-size: 24px;
//         }

//         .file-info {
//           flex: 1;
//           min-width: 0; // 防止内容溢出

//           .file-name {
//             font-size: 14px;
//             color: #ffffff; // 文件名称颜色
//             margin-bottom: 5px;
//             white-space: nowrap;
//             overflow: hidden;
//             text-overflow: ellipsis;
//           }

//           .file-status {
//             font-size: 12px;

//             &.pending {
//               color: #909399;
//             }

//             &.processing {
//               color: #409EFF;
//             }

//             &.completed {
//               color: #67C23A;
//             }

//             &.error {
//               color: #F56C6C;
//             }
//           }

//           .file-msg {
//             font-size: 12px;
//             color: #909399;
//             margin-top: 2px;
//             line-height: 1.4;
//             max-height: 2.8em; // 两行高度
//             overflow: hidden;
//             text-overflow: ellipsis;
//             display: -webkit-box;
//             -webkit-line-clamp: 2;
//             -webkit-box-orient: vertical;
//             cursor: pointer;
//             transition: max-height 0.3s ease;

//             &.expanded {
//               max-height: none;
//               -webkit-line-clamp: unset;
//             }
//           }
//         }

//         .file-actions {
//           margin-left: 15px;
//           flex-shrink: 0;

//           .open-folder-btn {
//             background: none;
//             border: 1px solid #409EFF;
//             color: #409EFF;
//             padding: 4px 12px;
//             border-radius: 4px;
//             font-size: 12px;
//             cursor: pointer;
//             transition: all 0.3s;

//             &:hover {
//               background-color: #409EFF;
//               color: white;
//             }
//           }
//         }
//       }
//     }

//     .drop-zone {
//       height: 200px;
//       border: 2px dashed #4d4d4d; // 拖拽区域边框颜色
//       border-radius: 8px;
//       display: flex;
//       justify-content: center;
//       align-items: center;
//       background-color: #3a3a3a; // 拖拽区域背景颜色
//       transition: all 0.3s ease;

//       &:hover {
//         border-color: #409EFF;
//         background-color: #424242; // 鼠标悬停时背景颜色
//       }

//       .drop-text {
//         color: #cccccc; // 拖拽提示文字颜色
//         font-size: 16px;
//       }
//     }
//   }
// }
</style>