<template>
  <!--
    AuthArt —— 登录 / 注册页共用的左侧插画区。
    纯装饰，所以整块 aria-hidden，读屏软件会直接跳过。
    所有元素按百分比定位，卡片被拉高或变窄时整体等比缩放，不会错位。
  -->
  <div class="auth-art" aria-hidden="true">
    <div class="auth-art__grid"></div>

    <!-- 主视觉：一块「游戏画面」窗口 -->
    <div class="auth-art__window">
      <span class="auth-art__dots"><i></i><i></i><i></i></span>
      <span class="auth-art__lines"><i></i><i></i><i></i><i></i></span>
    </div>

    <!-- 机器人：天线 + 圆角脑袋 + 两点眼睛 + 一条嘴 -->
    <div class="auth-art__robot">
      <span class="auth-art__antenna"></span>
      <span class="auth-art__eyes"><i></i><i></i></span>
      <span class="auth-art__mouth"></span>
    </div>

    <!-- 两个齿轮：外圈用 stroke-dasharray 做齿，内圈做轴孔 -->
    <svg class="auth-art__gear auth-art__gear--lg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="36" />
      <circle class="auth-art__gear-hub" cx="50" cy="50" r="15" />
    </svg>
    <svg class="auth-art__gear auth-art__gear--sm" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="34" />
      <circle class="auth-art__gear-hub" cx="50" cy="50" r="14" />
    </svg>
  </div>
</template>

<style scoped>
/* ==========================================================================
   左侧插画
   --------------------------------------------------------------------------
   深蓝紫渐变底 + 细网格 + 窗口 / 机器人 / 齿轮三个层次，
   全部用 CSS 和少量 SVG 画出来，不依赖任何图片资源。
   ========================================================================== */
.auth-art {
  position: relative;
  overflow: hidden;
  background: linear-gradient(160deg, #1d2447 0%, #191c38 45%, #14172b 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

/* 网格：横竖两组细线，靠 mask 让四周淡出，避免边缘生硬 */
.auth-art__grid {
  position: absolute;
  inset: -10%;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.055) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.055) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(75% 75% at 50% 45%, #000 40%, transparent 100%);
}

/* 「游戏画面」窗口：紫蓝渐变 + 三个圆点 + 四条渐隐横线 */
.auth-art__window {
  position: absolute;
  top: 17%;
  left: 16%;
  width: 66%;
  height: 36%;
  padding: 14px 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, #5b53e0 0%, #7c5cf0 55%, #8b5cf6 100%);
  box-shadow:
    0 22px 50px rgba(76, 61, 196, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}
.auth-art__dots {
  display: flex;
  gap: 6px;
}
.auth-art__dots i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.72);
}
.auth-art__lines {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 22%;
}
.auth-art__lines i {
  display: block;
  height: 7px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.62);
}
.auth-art__lines i:nth-child(1) {
  width: 74%;
}
.auth-art__lines i:nth-child(2) {
  width: 88%;
}
.auth-art__lines i:nth-child(3) {
  width: 52%;
}
.auth-art__lines i:nth-child(4) {
  width: 80%;
  background: rgba(255, 255, 255, 0.38);
}

/* 机器人 */
.auth-art__robot {
  position: absolute;
  top: 61%;
  left: 25%;
  width: 17%;
  height: 15%;
  min-width: 64px;
  min-height: 56px;
  border-radius: 12px;
  background: linear-gradient(160deg, #6f74ef, #5a5bd8);
  box-shadow:
    0 14px 30px rgba(70, 72, 190, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}
/* 天线：一根竖线 + 顶端小圆球，用 ::before / ::after 两个伪元素实现 */
.auth-art__robot::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  width: 2px;
  height: 18%;
  min-height: 12px;
  background: rgba(184, 190, 245, 0.65);
  transform: translateX(-50%);
}
.auth-art__antenna::after {
  content: '';
  position: absolute;
  top: -6px;
  left: 50%;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #aeb4f2;
  transform: translateX(-50%);
}
.auth-art__eyes {
  position: absolute;
  top: 32%;
  left: 50%;
  display: flex;
  gap: 9px;
  transform: translateX(-50%);
}
.auth-art__eyes i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #f3f4ff;
}
.auth-art__mouth {
  position: absolute;
  bottom: 26%;
  left: 50%;
  width: 34%;
  height: 3px;
  border-radius: 2px;
  background: rgba(243, 244, 255, 0.85);
  transform: translateX(-50%);
}

/* 齿轮：外圈虚线做齿，内圈是轴孔 */
.auth-art__gear {
  position: absolute;
  fill: none;
  stroke: #9aa2e8;
  stroke-width: 13;
  stroke-dasharray: 11 9;
  opacity: 0.7;
}
.auth-art__gear-hub {
  stroke-dasharray: none;
  stroke-width: 11;
  opacity: 0.9;
}
.auth-art__gear--lg {
  top: 55%;
  left: 57%;
  width: 17%;
  height: 17%;
  min-width: 62px;
  min-height: 62px;
}
.auth-art__gear--sm {
  top: 73%;
  left: 72%;
  width: 12%;
  height: 12%;
  min-width: 44px;
  min-height: 44px;
}

/* 窄屏：插画区整体隐藏，只留右侧表单 */
@media (max-width: 900px) {
  .auth-art {
    display: none;
  }
}
</style>
