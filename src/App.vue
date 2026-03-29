<script setup>
// 导入Element Plus图标
import { Setting} from '@element-plus/icons-vue'

</script>

<template>
  <div class="app-container">
    <!-- 使用Element Plus的Container布局组件 -->
    <el-container style="height: 100vh;">
      <!-- 侧边栏 -->
      <el-aside width="200px" style="background-color: #fff;">
        <!-- 系统标题 -->
        <div class="logo-container">
          <h1 class="logo-text">智能图书馆</h1>
        </div>
        
        <!-- 使用Element Plus的Menu组件实现导航菜单 -->
        <el-menu
          default-active="/"
          class="sidebar-menu"
          background-color='rgb(233, 219, 113)'
          text-color="#fff"
          active-text-color="#ffd04b"
          router
        >
          <div class="session-list">
        <div 
          v-for="session in sessions" 
          :key="session.id"
          :class="['session-item', { active: currentSessionId === session.id }]"
          @click="switchSession(session.id)"
        >
          <div class="session-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" stroke-width="1.5"/>
              <path d="M10 8V12M7 10H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="session-info">
            <div v-if="editingSessionId === session.id" class="session-edit">
              <input 
                v-model="editingTitle" 
                @keyup.enter="saveSessionTitle(session.id)"
                @keyup.esc="cancelEditSession"
                @blur="saveSessionTitle(session.id)"
                class="session-edit-input"
                ref="editInput"
              />
              <div class="session-edit-buttons">
                <button @click="saveSessionTitle(session.id)" class="edit-save-btn">保存</button>
                <button @click="cancelEditSession" class="edit-cancel-btn">取消</button>
              </div>
            </div>
            <div v-else class="session-title" @dblclick="startEditSession(session)">
              {{ session.title || '新会话' }}
            </div>
            <div class="session-time">{{ formatTime(session.lastUpdated) }}</div>
          </div>
          <button @click.stop="deleteSession(session.id)" class="session-delete">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
        </el-menu>
      </el-aside>
      
      <!-- 主内容区 -->
      <el-container>
        <!-- 顶部导航栏 -->
        <el-header style="background-color: #fff; border-bottom: 1px solid #e6e6e6;border-left: 1px solid #e6e6e6; display: flex; align-items: center; padding: 0 20px;">
          <!-- 左侧占位元素 -->
          <div style="flex: 1;"></div>
          
          
          <!-- 右侧占位元素 -->
          <div style="flex: 1;"></div>
          
          <!-- 恢复系统设置下拉菜单 -->
          <div class="user-info">
            <el-dropdown>
              <span class="el-dropdown-link">
                <el-icon class="el-icon--right"><Setting /></el-icon>
                系统设置
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>个人中心</el-dropdown-item>
                  <el-dropdown-item>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        
        <!-- 路由视图区域 -->
        <el-main style="padding: 20px;">
          <!-- 使用RouterView组件显示当前路由对应的组件 -->
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: Arial, sans-serif;
}

.app-container {
  height: 100%;
}

/* 侧边栏样式 */
.logo-container {
  padding: 0;
  height: 60px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid #e6e6e6;;
}

.logo-text {
  color: #2563eb;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  text-align: center;
}

.sidebar-menu {
  border-right: none;
}

/* 顶部导航栏样式 */
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 主内容区域样式 */
.el-main {
  background-color: #f5f7fa;
}
</style>

<style scoped>
/* 组件特定样式 */
.el-dropdown-link {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}
</style>
