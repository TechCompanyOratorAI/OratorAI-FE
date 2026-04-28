import { createRoot } from "react-dom/client";
import { App as AntdApp } from "antd";
import "antd/dist/reset.css"; // dùng reset để tránh xung đột CSS
import "./apps/index.css";
import App from "./apps/App";
import { Provider } from "react-redux";
import { store, persistor } from "./services/store/store";
import { PersistGate } from "redux-persist/integration/react";
const container = document.getElementById("root");
if (!container) {
  throw new Error("Không tìm thấy phần tử gốc");
}

const root = createRoot(container);

root.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <AntdApp>
        <App />
      </AntdApp>
    </PersistGate>
  </Provider>,
);
