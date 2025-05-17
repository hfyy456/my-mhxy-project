/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-05-16 01:35:04
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-05-18 01:37:28
 */
import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App.jsx";
import { Provider } from "react-redux";
import store from "@/store";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <App />
  </Provider>
);
    
