import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startServer, type TestServer } from './helpers'

let server: TestServer
let dir = ''

const cacheControlOf = async (name: string) => {
  const response = await fetch(`${server.base}/${name}`)
  return { status: response.status, cacheControl: response.headers.get('cache-control') }
}

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'lrdi-icons-'))
  const dist = path.join(dir, 'dist')
  await mkdir(dist, { recursive: true })
  await writeFile(path.join(dist, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>')
  await writeFile(path.join(dist, 'favicon.ico'), 'ico')
  await writeFile(path.join(dist, 'apple-touch-icon.png'), 'png')
  await writeFile(path.join(dist, 'icon-192.png'), 'png')
  await writeFile(path.join(dist, 'icon-512.png'), 'png')
  await writeFile(path.join(dist, 'app.js'), 'console.log(1)')
  await writeFile(path.join(dist, 'index.html'), '<!doctype html><title>t</title>')
  server = await startServer(dir)
})

afterAll(async () => {
  await server.close()
  await rm(dir, { recursive: true, force: true })
})

describe('图标缓存策略', () => {
  it('favicon 与 app 图标不缓存，改动立刻生效', async () => {
    for (const name of ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png']) {
      const result = await cacheControlOf(name)
      expect(result.status).toBe(200)
      expect(result.cacheControl).toBe('no-cache')
    }
  })

  it('其余静态资源仍走 1 小时缓存', async () => {
    const result = await cacheControlOf('app.js')
    expect(result.status).toBe(200)
    expect(result.cacheControl).toBe('public, max-age=3600')
  })

  it('缺失的图标直接 404，不回落成首页 HTML', async () => {
    const result = await cacheControlOf('favicon-missing.png')
    expect(result.status).toBe(404)
  })

  it('前端路由仍回落 index.html', async () => {
    const response = await fetch(`${server.base}/projects/abc`)
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store, must-revalidate')
  })
})
