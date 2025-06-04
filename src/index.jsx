/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-16 01:35:04
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-03 04:28:35
 */
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import store from "./store/index.js";

// 加载测试文件，确保测试函数挂载到全局对象
import "./test/summonNatureTest.js";

// 初始化装备关系管理器
import equipmentRelationshipManager from "./store/EquipmentRelationshipManager.js";

// 在开发环境下，将装备关系管理器挂载到全局对象，方便调试
if (process.env.NODE_ENV === 'development') {
  window.equipmentRelationshipManager = equipmentRelationshipManager;
  console.log('[Index] 装备关系管理器已挂载到 window.equipmentRelationshipManager');
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <App />
  </Provider>
);
    
