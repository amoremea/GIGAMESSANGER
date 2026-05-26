const { app, BrowserWindow } = require("electron");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "GigaMessage",
    webPreferences: {
      nodeIntegration: false,    // Безопасность: лучше false для внешних доменов
      contextIsolation: true,    // Безопасность: лучше true
      webSecurity: true          // Для работы с https домена
    }
  });

  // Определяем, какой URL загружать
  // Если запущено с флагом разработки или через npm start, можно оставить localhost
  // В противном случае — твой домен на Render
  const isDev = process.env.NODE_ENV === 'development';
  
  const remoteURL = "https://gmessanger.onrender.com";
  const localURL = "http://localhost:3000";

  win.loadURL(isDev ? localURL : remoteURL);

  // Обработка внешних ссылок (чтобы открывались в обычном браузере, а не внутри окна)
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      require('electron').shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});