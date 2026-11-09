module.exports = {
  apps: [
    {
      name: 'lgi',
      script: 'node_modules/tsx/dist/cli.mjs',
      args: 'server/src/index.ts',
      cwd: '/www/wwwroot/lgi',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1500M',
      env: {
        NODE_ENV: 'production',
        PORT: '8788'
      }
    }
  ]
}
