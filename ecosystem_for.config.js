module.exports = {
  apps: [
    {
      name: "encar_for",      // имя процесса (в pm2 list будет видно)
      script: "index_for.js",         // какой файл запускать
      watch: false,                // лучше отключить наблюдение в продакшене
      ignore_watch: [              // если включишь watch — эти папки/файлы игнорить
        "last_page_for.json",
        "node_modules",
        ".git",
        "logs"
      ],
      autorestart: true,           // автоперезапуск при ошибке
      restart_delay: 5000,         // задержка 5 секунд между рестартами
      max_restarts: 20,            // максимум 20 рестартов подряд
      max_memory_restart: "500M",  // перезапуск, если процесс съест >500 МБ
      env: {
        NODE_ENV: "production",
        TZ: "Asia/Seoul"           // часовой пояс (можно заменить на свой)
      },
      time: true                   // добавлять время в логах
    }
  ]
};
