/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-16 01:35:04
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-07 00:52:18
 */
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import store from "./store/index.js";

// 加载测试文件，确保测试函数挂载到全局对象
import "./test/summonNatureTest.js";


ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <App />
  </Provider>
);
    
