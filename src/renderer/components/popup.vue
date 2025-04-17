<template>
    <div class="popup-form">
      <div class="close-btn" @click="onClosePannel">×</div>
      <div class="form_item">
        <div class="form_item_name">{{title}}</div>
        <div class="form_item_content">
          <slot></slot>
        </div>
      </div>
      <div class="form-btn">
        <button @click="onClosePannel">关闭</button>
      </div>
    </div>
</template>

<script>
export default {
  data() {
    return {
      
    }
  },
  props: {
    title: {
      type: String,
      default: ''
    }
  },
  methods: {
    onClosePannel() {
      this.$emit('closePannel', { })
    }
  }
}
</script>

<style lang="scss" scoped>
.popup-form {
  min-width: 300px;
  background: #fff;
  padding: 20px;
  border-radius: 3px;
  box-shadow: 0 0 5px 1px rgba(0, 0, 0, 0.2);
  position: relative;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 24px;
  cursor: pointer;
}

.form_item {
  display: flex;
  flex-direction: column;
}

.form_item_name {
  font-weight: bold;
  margin-bottom: 10px;
}

.form_item_content {
  display: flex;
  flex-direction: column;
}

.form-btn {
  margin-top: 20px;
  text-align: center;

  > button{
    background: #007bff;
    color: white;
    padding: 0 12px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
    height: 30px;
    line-height: 30px;
  }
}

button {
  cursor: pointer;
}
</style>
