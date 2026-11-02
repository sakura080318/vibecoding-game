<template>
  <div>
    <el-result icon="warning" title="404 Not Found" sub-title="你找的页面走丢了~">
      <template #extra>
        <el-button type="primary" @click="goHome">回到首页</el-button>
      </template>
    </el-result>
  </div>
</template>

<script>
export default {
  methods: {
    goHome() {
      this.$router.push('/')
    }
  }
}
</script>
